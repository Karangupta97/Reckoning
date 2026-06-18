/**
 * AI-analysis worker — Reckoning inference on complaint images.
 *
 * Consumes `ai-analysis` jobs. If the complaint already has AI results
 * (pre-analysed by the frontend via /api/ai/detect before submission), the
 * worker persists those results to `complaint_ai_results` without re-running
 * inference. If no prior result exists, it runs fresh inference.
 *
 * Workers are OPT-IN: they only start when Redis is configured. Run this file
 * in its own process (e.g. `tsx src/jobs/workers/aiAnalysis.worker.ts`).
 */

import { Worker } from "bullmq";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { getFileBuffer } from "../../services/s3.service.js";
import { runReckoningDetection } from "../../modules/ai/ai.service.js";
import { logger } from "../../utils/logger.js";
import { connection, QUEUE_NAMES, type AiAnalysisJob } from "../queues.js";

/**
 * Start the AI-analysis worker.
 *
 * @returns The running {@link Worker}, or `null` when Redis is unconfigured.
 */
export function startAiAnalysisWorker(): Worker | null {
  if (!connection) {
    logger.warn("[aiAnalysis.worker] REDIS_URL not set — worker not started.");
    return null;
  }

  const worker = new Worker<AiAnalysisJob>(
    QUEUE_NAMES.aiAnalysis,
    async (job) => {
      const { complaintId } = job.data;
      logger.info(`[aiAnalysis.worker] Processing complaint ${complaintId}`);

      // Fetch the complaint — check if AI was already run by the frontend.
      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
        select: {
          userId: true,
          aiDetected: true,
          aiCategory: true,
          aiConfidence: true,
          aiAnnotatedImageKey: true,
          aiRawResult: true,
        },
      });

      if (!complaint) {
        logger.warn(`[aiAnalysis.worker] Complaint ${complaintId} not found — skipping.`);
        return;
      }

      // ── Fast path: frontend already ran inference ─────────────────────────
      // The /api/ai/detect endpoint ran before submission and stored the result
      // on the complaint. Persist it to complaint_ai_results without re-running
      // the expensive HuggingFace call.
      if (complaint.aiDetected && complaint.aiAnnotatedImageKey && complaint.aiRawResult) {
        const raw = complaint.aiRawResult as Record<string, unknown>;

        const totalDetected = typeof raw.totalDetected === "number" ? raw.totalDetected : 0;
        const inferenceMs = typeof raw.inferenceMs === "number" ? raw.inferenceMs : null;
        const detections = (raw.detections ?? raw.primary ?? null) as Prisma.InputJsonValue;
        const message = totalDetected > 0
          ? `Detected ${totalDetected} issue(s). Review and confirm.`
          : "No issues detected.";

        await prisma.complaintAiResult.upsert({
          where: { complaintId },
          create: {
            complaintId,
            annotatedImageS3Key: complaint.aiAnnotatedImageKey,
            suggestedCategory: complaint.aiCategory ?? null,
            suggestedSeverity: null, // derived from severity field on complaint
            confidence: complaint.aiConfidence ?? null,
            totalDetected,
            detections,
            inferenceMs,
            message,
          },
          update: {
            annotatedImageS3Key: complaint.aiAnnotatedImageKey,
            suggestedCategory: complaint.aiCategory ?? null,
            confidence: complaint.aiConfidence ?? null,
            totalDetected,
            detections,
            inferenceMs,
            message,
          },
        });

        logger.info(`[aiAnalysis.worker] Persisted pre-computed AI result for complaint ${complaintId}`, {
          category: complaint.aiCategory,
          confidence: complaint.aiConfidence,
        });
        return;
      }

      // ── Slow path: no prior result — run fresh inference ──────────────────
      // Find the first image linked to this complaint.
      const media = await prisma.complaintMedia.findFirst({
        where: { complaintId },
        orderBy: { order: "asc" },
        include: {
          media: { select: { s3Key: true, mimeType: true } },
        },
      });

      if (!media || !media.media.mimeType.startsWith("image/")) {
        logger.info(`[aiAnalysis.worker] No image found for complaint ${complaintId} — skipping.`);
        return;
      }

      // Fetch image from S3.
      const buffer = await getFileBuffer(media.media.s3Key).catch((err) => {
        logger.warn(`[aiAnalysis.worker] Failed to fetch file: ${err instanceof Error ? err.message : err}`);
        return null;
      });

      if (!buffer) return;

      // Run Reckoning detection.
      const result = await runReckoningDetection(buffer, media.media.mimeType, complaint.userId);

      if (!result) {
        logger.warn(`[aiAnalysis.worker] Reckoning returned null for complaint ${complaintId}`);
        return;
      }

      const message = result.raw.totalDetected > 0
        ? `Detected ${result.raw.totalDetected} issue(s).`
        : "No issues detected.";
      const detectionsJson = result.raw.detections as unknown as Prisma.InputJsonValue;

      await prisma.$transaction(async (tx) => {
        await tx.complaintAiResult.upsert({
          where: { complaintId },
          create: {
            complaintId,
            annotatedImageS3Key: result.annotatedS3Key,
            suggestedCategory: result.suggestedCategory,
            suggestedSeverity: result.suggestedSeverity,
            confidence: result.confidence,
            totalDetected: result.raw.totalDetected,
            detections: detectionsJson,
            inferenceMs: result.raw.inferenceMs,
            message,
          },
          update: {
            annotatedImageS3Key: result.annotatedS3Key,
            suggestedCategory: result.suggestedCategory,
            suggestedSeverity: result.suggestedSeverity,
            confidence: result.confidence,
            totalDetected: result.raw.totalDetected,
            detections: detectionsJson,
            inferenceMs: result.raw.inferenceMs,
            message,
          },
        });

        // Keep the complaint row in sync for legacy consumers.
        await tx.complaint.update({
          where: { id: complaintId },
          data: {
            aiDetected: true,
            aiCategory: result.suggestedCategory,
            aiConfidence: result.confidence,
            aiRawResult: result.raw as unknown as Prisma.InputJsonValue,
            aiAnnotatedImageKey: result.annotatedS3Key,
          },
        });
      });

      logger.info(`[aiAnalysis.worker] Completed fresh inference for complaint ${complaintId}`, {
        category: result.suggestedCategory,
        confidence: result.confidence,
      });
    },
    {
      connection,
      concurrency: 3,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error(`[aiAnalysis.worker] Job ${job?.id} failed: ${err.message}`);
  });

  logger.info("[aiAnalysis.worker] Started.");
  return worker;
}

// Allow running this module directly as a standalone worker process.
if (import.meta.url === `file://${process.argv[1]}`) {
  startAiAnalysisWorker();
}

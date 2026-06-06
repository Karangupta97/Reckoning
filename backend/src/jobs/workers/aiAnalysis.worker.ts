/**
 * AI-analysis worker — Reckoning inference on complaint images.
 *
 * Consumes `ai-analysis` jobs and runs the YOLOv8 road-damage model via the
 * Reckoning HuggingFace Space, then writes back `aiDetected`, `aiCategory`,
 * `aiConfidence`, `aiRawResult` and (re)derives severity.
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

      // Fetch complaint to get userId for S3 annotated image path.
      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
        select: { userId: true },
      });

      if (!complaint) {
        logger.warn(`[aiAnalysis.worker] Complaint ${complaintId} not found — skipping.`);
        return;
      }

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

      // Persist AI results back to the complaint (including annotated image key).
      await prisma.complaint.update({
        where: { id: complaintId },
        data: {
          aiDetected: true,
          aiCategory: result.suggestedCategory,
          aiConfidence: result.confidence,
          aiRawResult: result.raw as unknown as Prisma.InputJsonValue,
          aiAnnotatedImageKey: result.annotatedS3Key,
        },
      });

      logger.info(`[aiAnalysis.worker] Completed for complaint ${complaintId}`, {
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

/**
 * Background-job producers (queue-ready, with a direct-send fallback).
 *
 * Thin, safe wrappers around the BullMQ queues. Behaviour by environment:
 *
 *   - Redis configured  → the job is enqueued and a worker processes it
 *     out-of-process (durable, retried by BullMQ).
 *   - Redis NOT configured → the work is executed inline via the shared
 *     handlers, best-effort, so single-instance / local deployments still send
 *     confirmation and authority emails. Inline failures are logged, never
 *     thrown: the complaint is already durably stored, and email is a
 *     non-critical side effect.
 *
 * Email-bearing producers ({@link enqueueComplaintConfirmation},
 * {@link enqueueAuthorityNotification}) therefore guarantee a delivery attempt
 * in every environment. {@link enqueueAiAnalysis} has no inline fallback yet
 * (no synchronous AI path) and simply no-ops without Redis.
 */

import {
  aiAnalysisQueue,
  authorityNotifyQueue,
  adminNotifyQueue,
  complaintConfirmationQueue,
  authorityAssignmentQueue,
  queuesEnabled,
  QUEUE_NAMES,
} from "../jobs/queues.js";
import {
  processComplaintConfirmation,
  processAuthorityNotification,
  processAdminNotification,
} from "../jobs/handlers.js";
import { processAuthorityAssignment } from "../workers/authorityAssignment.worker.js";
import { prisma } from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import type { Queue } from "bullmq";

/**
 * Enqueue a job on `queue`, or run an inline fallback when queues are disabled.
 *
 * @param queue    Target queue (may be `null` when Redis is off).
 * @param jobName  Logical job name (for logs).
 * @param payload  Serialisable job data.
 * @param fallback Optional inline handler used when queues are disabled.
 */
async function safeEnqueue<T extends object>(
  queue: Queue | null,
  jobName: string,
  payload: T,
  fallback?: () => Promise<unknown>,
): Promise<void> {
  // Queue path: durable, out-of-process processing.
  if (queue && queuesEnabled) {
    try {
      await queue.add(jobName, payload);
      return;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[queue.service] Failed to enqueue '${jobName}':`, error);
      return;
    }
  }

  // Fallback path: fire-and-forget so the side effect still happens locally
  // without ever blocking the HTTP response (email delivery is non-critical).
  if (fallback) {
    fallback().catch((error) => {
      // eslint-disable-next-line no-console
      console.error(`[queue.service] Inline '${jobName}' failed:`, error);
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.warn(`[queue.service] Skipping '${jobName}' — queues disabled (no REDIS_URL).`);
}

/**
 * Enqueue AI analysis for a complaint.
 *
 * When queues are disabled, runs the "fast path" inline: if the complaint
 * already has AI results from the frontend (aiAnnotatedImageKey + aiRawResult),
 * persist them into `complaint_ai_results` so the citizen can see them in
 * "My Reports". No fresh inference is attempted inline (that's heavyweight).
 *
 * @param complaintId Complaint to analyse.
 */
export async function enqueueAiAnalysis(complaintId: string): Promise<void> {
  await safeEnqueue(
    aiAnalysisQueue,
    QUEUE_NAMES.aiAnalysis,
    { complaintId },
    () => persistPreComputedAiResult(complaintId),
  );
}

/**
 * Inline fallback for AI analysis: persist pre-computed results that the
 * frontend stored on the complaint during submission.
 *
 * @param complaintId Complaint with potential pre-computed AI data.
 */
async function persistPreComputedAiResult(complaintId: string): Promise<void> {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: {
      aiDetected: true,
      aiCategory: true,
      aiConfidence: true,
      aiAnnotatedImageKey: true,
      aiRawResult: true,
    },
  });

  if (!complaint?.aiDetected || !complaint.aiAnnotatedImageKey || !complaint.aiRawResult) {
    // No pre-computed result — skip (fresh inference requires Redis workers).
    return;
  }

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
      suggestedSeverity: null,
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
}

/**
 * Notify the assigned authority about a new complaint (email).
 *
 * Falls back to inline delivery when queues are disabled.
 *
 * @param complaintId Complaint id.
 * @param authorityId Assigned authority id.
 */
export async function enqueueAuthorityNotification(
  complaintId: string,
  authorityId: string,
): Promise<void> {
  await safeEnqueue(
    authorityNotifyQueue,
    QUEUE_NAMES.authorityNotify,
    { complaintId, authorityId },
    () => processAuthorityNotification(complaintId, authorityId),
  );
}

/**
 * Notify the platform admin about a new complaint (email to ADMIN_EMAIL).
 *
 * Falls back to inline delivery when queues are disabled.
 *
 * @param complaintId Complaint id.
 */
export async function enqueueAdminNotification(
  complaintId: string,
): Promise<void> {
  await safeEnqueue(
    adminNotifyQueue,
    QUEUE_NAMES.adminNotify,
    { complaintId },
    () => processAdminNotification(complaintId),
  );
}

/**
 * Send a submission-confirmation email to the reporting user.
 *
 * Falls back to inline delivery when queues are disabled.
 *
 * @param complaintId Complaint id.
 * @param userId      Reporter user id.
 */
export async function enqueueComplaintConfirmation(
  complaintId: string,
  userId: string,
): Promise<void> {
  await safeEnqueue(
    complaintConfirmationQueue,
    QUEUE_NAMES.complaintConfirmation,
    { complaintId, userId },
    () => processComplaintConfirmation(complaintId, userId),
  );
}

/**
 * Enqueue the authority-assignment job (ticket creation + geofence lookup).
 *
 * No inline fallback — this job is heavyweight (PostGIS + ticket creation).
 *
 * @param complaintId Complaint to assign.
 */
export async function enqueueAuthorityAssignment(
  complaintId: string,
): Promise<void> {
  await safeEnqueue(
    authorityAssignmentQueue,
    QUEUE_NAMES.authorityAssignment,
    { complaintId },
    () => processAuthorityAssignment(complaintId),
  );
}

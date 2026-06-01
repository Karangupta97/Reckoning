/**
 * Background-job producers.
 *
 * Thin, safe wrappers around the BullMQ queues. Each enqueue:
 *
 *   - no-ops (logs a warning) when Redis/queues are disabled, so the absence
 *     of a worker fleet never blocks complaint submission;
 *   - swallows enqueue errors (logged) for the same reason — a complaint is
 *     already durably stored before jobs are fired, and jobs are non-critical
 *     side effects that can be retried/back-filled.
 */

import {
  aiAnalysisQueue,
  authorityNotifyQueue,
  complaintConfirmationQueue,
  queuesEnabled,
  QUEUE_NAMES,
} from "../jobs/queues.js";
import type { Queue } from "bullmq";

/**
 * Enqueue a job on `queue`, tolerating a disabled/erroring queue.
 *
 * @param queue   Target queue (may be `null` when Redis is off).
 * @param jobName Logical job name.
 * @param payload Serialisable job data.
 */
async function safeEnqueue<T extends object>(
  queue: Queue | null,
  jobName: string,
  payload: T,
): Promise<void> {
  if (!queue || !queuesEnabled) {
    // eslint-disable-next-line no-console
    console.warn(`[queue.service] Skipping '${jobName}' — queues disabled (no REDIS_URL).`);
    return;
  }
  try {
    await queue.add(jobName, payload);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[queue.service] Failed to enqueue '${jobName}':`, error);
  }
}

/**
 * Enqueue AI analysis for a complaint (future on-server inference).
 *
 * @param complaintId Complaint to analyse.
 */
export async function enqueueAiAnalysis(complaintId: string): Promise<void> {
  await safeEnqueue(aiAnalysisQueue, QUEUE_NAMES.aiAnalysis, { complaintId });
}

/**
 * Notify the assigned authority about a new complaint.
 *
 * @param complaintId Complaint id.
 * @param authorityId Assigned authority id.
 */
export async function enqueueAuthorityNotification(
  complaintId: string,
  authorityId: string,
): Promise<void> {
  await safeEnqueue(authorityNotifyQueue, QUEUE_NAMES.authorityNotify, {
    complaintId,
    authorityId,
  });
}

/**
 * Send a submission-confirmation email to the reporting user.
 *
 * @param complaintId Complaint id.
 * @param userId      Reporter user id.
 */
export async function enqueueComplaintConfirmation(
  complaintId: string,
  userId: string,
): Promise<void> {
  await safeEnqueue(complaintConfirmationQueue, QUEUE_NAMES.complaintConfirmation, {
    complaintId,
    userId,
  });
}

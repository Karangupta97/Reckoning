/**
 * BullMQ queue definitions + shared Redis connection.
 *
 * Queues are only constructed when `REDIS_URL` is configured. When Redis is
 * absent (e.g. local dev) the queues are `null` and the producer layer
 * (`services/queue.service.ts`) no-ops, so background processing degrades
 * gracefully instead of crashing complaint submission.
 *
 * Job payloads are intentionally tiny (just ids): workers re-fetch fresh data
 * from the DB so stale snapshots are never processed.
 */

import { Queue, type QueueOptions, type ConnectionOptions } from "bullmq";
import { env } from "../config/env.js";

/** Names of every queue in the system (single source of truth). */
export const QUEUE_NAMES = {
  aiAnalysis: "ai-analysis",
  authorityNotify: "authority-notify",
  complaintConfirmation: "complaint-confirmation",
} as const;

/** Payload for the `ai-analysis` queue (future AI processing). */
export interface AiAnalysisJob {
  complaintId: string;
}

/** Payload for the `authority-notify` queue. */
export interface AuthorityNotifyJob {
  complaintId: string;
  authorityId: string;
}

/** Payload for the `complaint-confirmation` queue (user email). */
export interface ComplaintConfirmationJob {
  complaintId: string;
  userId: string;
}

/**
 * Shared Redis connection options for BullMQ, or `null` when Redis is not
 * configured. `maxRetriesPerRequest` MUST be null for BullMQ blocking clients.
 */
export const connection: ConnectionOptions | null = env.REDIS_URL
  ? { url: env.REDIS_URL, maxRetriesPerRequest: null }
  : null;

/** Default job options applied to every queued job. */
const defaultJobOptions: QueueOptions["defaultJobOptions"] = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 24 * 3600, count: 1000 },
  removeOnFail: { age: 7 * 24 * 3600 },
};

/**
 * Lazily build a queue, or return `null` when Redis is unavailable.
 *
 * @param name Queue name.
 * @returns A configured {@link Queue}, or `null`.
 */
function makeQueue(name: string): Queue | null {
  if (!connection) return null;
  return new Queue(name, { connection, defaultJobOptions });
}

/** `ai-analysis` queue (or `null` without Redis). */
export const aiAnalysisQueue: Queue | null = makeQueue(QUEUE_NAMES.aiAnalysis);

/** `authority-notify` queue (or `null` without Redis). */
export const authorityNotifyQueue: Queue | null = makeQueue(
  QUEUE_NAMES.authorityNotify,
);

/** `complaint-confirmation` queue (or `null` without Redis). */
export const complaintConfirmationQueue: Queue | null = makeQueue(
  QUEUE_NAMES.complaintConfirmation,
);

/** True when background queues are active (Redis configured). */
export const queuesEnabled: boolean = connection !== null;

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
import { Queue } from "bullmq";
import { env } from "../config/env.js";
/** Names of every queue in the system (single source of truth). */
export const QUEUE_NAMES = {
    aiAnalysis: "ai-analysis",
    authorityNotify: "authority-notify",
    complaintConfirmation: "complaint-confirmation",
};
/**
 * Shared Redis connection options for BullMQ, or `null` when Redis is not
 * configured. `maxRetriesPerRequest` MUST be null for BullMQ blocking clients.
 */
export const connection = env.REDIS_URL
    ? { url: env.REDIS_URL, maxRetriesPerRequest: null }
    : null;
/** Default job options applied to every queued job. */
const defaultJobOptions = {
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
function makeQueue(name) {
    if (!connection)
        return null;
    return new Queue(name, { connection, defaultJobOptions });
}
/** `ai-analysis` queue (or `null` without Redis). */
export const aiAnalysisQueue = makeQueue(QUEUE_NAMES.aiAnalysis);
/** `authority-notify` queue (or `null` without Redis). */
export const authorityNotifyQueue = makeQueue(QUEUE_NAMES.authorityNotify);
/** `complaint-confirmation` queue (or `null` without Redis). */
export const complaintConfirmationQueue = makeQueue(QUEUE_NAMES.complaintConfirmation);
/** True when background queues are active (Redis configured). */
export const queuesEnabled = connection !== null;
//# sourceMappingURL=queues.js.map
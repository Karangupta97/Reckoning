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
import { aiAnalysisQueue, authorityNotifyQueue, adminNotifyQueue, complaintConfirmationQueue, queuesEnabled, QUEUE_NAMES, } from "../jobs/queues.js";
import { processComplaintConfirmation, processAuthorityNotification, processAdminNotification, } from "../jobs/handlers.js";
/**
 * Enqueue a job on `queue`, or run an inline fallback when queues are disabled.
 *
 * @param queue    Target queue (may be `null` when Redis is off).
 * @param jobName  Logical job name (for logs).
 * @param payload  Serialisable job data.
 * @param fallback Optional inline handler used when queues are disabled.
 */
async function safeEnqueue(queue, jobName, payload, fallback) {
    // Queue path: durable, out-of-process processing.
    if (queue && queuesEnabled) {
        try {
            await queue.add(jobName, payload);
            return;
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error(`[queue.service] Failed to enqueue '${jobName}':`, error);
            return;
        }
    }
    // Fallback path: run inline so the side effect still happens locally.
    if (fallback) {
        try {
            await fallback();
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error(`[queue.service] Inline '${jobName}' failed:`, error);
        }
        return;
    }
    // eslint-disable-next-line no-console
    console.warn(`[queue.service] Skipping '${jobName}' — queues disabled (no REDIS_URL).`);
}
/**
 * Enqueue AI analysis for a complaint (future on-server inference).
 *
 * No inline fallback yet — no-ops without Redis.
 *
 * @param complaintId Complaint to analyse.
 */
export async function enqueueAiAnalysis(complaintId) {
    await safeEnqueue(aiAnalysisQueue, QUEUE_NAMES.aiAnalysis, { complaintId });
}
/**
 * Notify the assigned authority about a new complaint (email).
 *
 * Falls back to inline delivery when queues are disabled.
 *
 * @param complaintId Complaint id.
 * @param authorityId Assigned authority id.
 */
export async function enqueueAuthorityNotification(complaintId, authorityId) {
    await safeEnqueue(authorityNotifyQueue, QUEUE_NAMES.authorityNotify, { complaintId, authorityId }, () => processAuthorityNotification(complaintId, authorityId));
}
/**
 * Notify the platform admin about a new complaint (email to ADMIN_EMAIL).
 *
 * Falls back to inline delivery when queues are disabled.
 *
 * @param complaintId Complaint id.
 */
export async function enqueueAdminNotification(complaintId) {
    await safeEnqueue(adminNotifyQueue, QUEUE_NAMES.adminNotify, { complaintId }, () => processAdminNotification(complaintId));
}
/**
 * Send a submission-confirmation email to the reporting user.
 *
 * Falls back to inline delivery when queues are disabled.
 *
 * @param complaintId Complaint id.
 * @param userId      Reporter user id.
 */
export async function enqueueComplaintConfirmation(complaintId, userId) {
    await safeEnqueue(complaintConfirmationQueue, QUEUE_NAMES.complaintConfirmation, { complaintId, userId }, () => processComplaintConfirmation(complaintId, userId));
}
//# sourceMappingURL=queue.service.js.map
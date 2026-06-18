/**
 * Authority-notification worker.
 *
 * Consumes `authority-notify` jobs and emails the assigned authority a summary
 * of the new complaint. The job carries only ids; the shared handler re-fetches
 * the complaint + authority fresh from the DB so it never acts on a stale
 * snapshot, then delivers via the SES email service.
 *
 * Run in its own process: `tsx src/jobs/workers/authorityNotify.worker.ts`.
 */

import { Worker } from "bullmq";
import { connection, QUEUE_NAMES, type AuthorityNotifyJob } from "../queues.js";
import { processAuthorityNotification } from "../handlers.js";

/**
 * Start the authority-notification worker.
 *
 * @returns The running {@link Worker}, or `null` when Redis is unconfigured.
 */
export function startAuthorityNotifyWorker(): Worker | null {
  if (!connection) {
    // eslint-disable-next-line no-console
    console.warn("[authorityNotify.worker] REDIS_URL not set — worker not started.");
    return null;
  }

  const worker = new Worker<AuthorityNotifyJob>(
    QUEUE_NAMES.authorityNotify,
    async (job) => {
      const { complaintId, authorityId } = job.data;
      await processAuthorityNotification(complaintId, authorityId);
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`[authorityNotify.worker] Job ${job?.id} failed:`, err);
  });

  // eslint-disable-next-line no-console
  console.log("[authorityNotify.worker] Started.");
  return worker;
}

// Allow running this module directly as a standalone worker process.
if (import.meta.url === `file://${process.argv[1]}`) {
  startAuthorityNotifyWorker();
}

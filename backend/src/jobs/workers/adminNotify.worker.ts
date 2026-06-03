/**
 * Admin-notification worker.
 *
 * Consumes `admin-notify` jobs and emails the platform admin (configured
 * `ADMIN_EMAIL`) a summary of each new complaint. The job carries only the
 * complaint id; the shared handler re-fetches fresh data and delivers via the
 * SES email service.
 *
 * Run in its own process: `tsx src/jobs/workers/adminNotify.worker.ts`.
 */

import { Worker } from "bullmq";
import { connection, QUEUE_NAMES, type AdminNotifyJob } from "../queues.js";
import { processAdminNotification } from "../handlers.js";

/**
 * Start the admin-notification worker.
 *
 * @returns The running {@link Worker}, or `null` when Redis is unconfigured.
 */
export function startAdminNotifyWorker(): Worker | null {
  if (!connection) {
    // eslint-disable-next-line no-console
    console.warn("[adminNotify.worker] REDIS_URL not set — worker not started.");
    return null;
  }

  const worker = new Worker<AdminNotifyJob>(
    QUEUE_NAMES.adminNotify,
    async (job) => {
      await processAdminNotification(job.data.complaintId);
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`[adminNotify.worker] Job ${job?.id} failed:`, err);
  });

  // eslint-disable-next-line no-console
  console.log("[adminNotify.worker] Started.");
  return worker;
}

// Allow running this module directly as a standalone worker process.
if (import.meta.url === `file://${process.argv[1]}`) {
  startAdminNotifyWorker();
}

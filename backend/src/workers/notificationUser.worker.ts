/**
 * Citizen notification worker.
 *
 * Consumes `notification-user` jobs and emails the citizen when their
 * complaint status changes (RESOLVED, REJECTED, IN_PROGRESS, etc.).
 *
 * Run in its own process: `tsx src/workers/notificationUser.worker.ts`.
 */

import { Worker } from "bullmq";
import {
  connection,
  QUEUE_NAMES,
  type NotificationUserJob,
} from "../jobs/queues.js";
import { processStatusUpdateNotification } from "../jobs/handlers.js";

/**
 * Start the citizen notification worker.
 *
 * @returns The running {@link Worker}, or `null` when Redis is unconfigured.
 */
export function startNotificationUserWorker(): Worker | null {
  if (!connection) {
    // eslint-disable-next-line no-console
    console.warn("[notificationUser.worker] REDIS_URL not set — worker not started.");
    return null;
  }

  const worker = new Worker<NotificationUserJob>(
    QUEUE_NAMES.notificationUser,
    async (job) => {
      const { type, complaintId, userId, newStatus } = job.data;

      // Currently we only handle STATUS_UPDATE notifications via email.
      if (type === "STATUS_UPDATE" && newStatus) {
        await processStatusUpdateNotification(complaintId, userId, newStatus);
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `[notificationUser.worker] Job type '${type}' — no handler yet, skipping.`,
        );
      }
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`[notificationUser.worker] Job ${job?.id} failed:`, err);
  });

  // eslint-disable-next-line no-console
  console.log("[notificationUser.worker] Started.");
  return worker;
}

// Allow running this module directly as a standalone worker process.
if (import.meta.url === `file://${process.argv[1]}`) {
  startNotificationUserWorker();
}

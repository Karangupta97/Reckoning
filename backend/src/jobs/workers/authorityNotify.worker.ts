/**
 * Authority-notification worker.
 *
 * Consumes `authority-notify` jobs and emails the assigned authority a summary
 * of the new complaint. Re-fetches the complaint + authority fresh from the DB
 * (the job only carries ids) so it never acts on a stale snapshot.
 *
 * The email send is best-effort scaffolding for now; integrate the real
 * authority template when the notification design is finalised.
 *
 * Run in its own process: `tsx src/jobs/workers/authorityNotify.worker.ts`.
 */

import { Worker } from "bullmq";
import { connection, QUEUE_NAMES, type AuthorityNotifyJob } from "../queues.js";
import { prisma } from "../../config/prisma.js";

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

      const [complaint, authority] = await Promise.all([
        prisma.complaint.findUnique({
          where: { id: complaintId },
          select: {
            ticketNumber: true,
            category: true,
            severity: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        }),
        prisma.authority.findUnique({
          where: { id: authorityId },
          select: { name: true, email: true, isActive: true },
        }),
      ]);

      if (!complaint || !authority || !authority.isActive) {
        // eslint-disable-next-line no-console
        console.warn(
          `[authorityNotify.worker] Skipping job — missing/inactive target (complaint=${complaintId}, authority=${authorityId}).`,
        );
        return;
      }

      // eslint-disable-next-line no-console
      console.log(
        `[authorityNotify.worker] Notifying ${authority.name} <${authority.email}> ` +
          `about ${complaint.ticketNumber} [${complaint.severity} ${complaint.category}].`,
      );
      // TODO: send the real authority email via the transactional email service.
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

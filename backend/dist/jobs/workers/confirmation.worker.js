/**
 * Confirmation-email worker.
 *
 * Consumes `complaint-confirmation` jobs and emails the reporting citizen a
 * receipt for their submission (ticket number + summary). Re-fetches the
 * complaint and user fresh from the DB using the job's ids.
 *
 * Run in its own process: `tsx src/jobs/workers/confirmation.worker.ts`.
 */
import { Worker } from "bullmq";
import { connection, QUEUE_NAMES, } from "../queues.js";
import { prisma } from "../../config/prisma.js";
/**
 * Start the confirmation-email worker.
 *
 * @returns The running {@link Worker}, or `null` when Redis is unconfigured.
 */
export function startConfirmationWorker() {
    if (!connection) {
        // eslint-disable-next-line no-console
        console.warn("[confirmation.worker] REDIS_URL not set — worker not started.");
        return null;
    }
    const worker = new Worker(QUEUE_NAMES.complaintConfirmation, async (job) => {
        const { complaintId, userId } = job.data;
        const [complaint, user] = await Promise.all([
            prisma.complaint.findUnique({
                where: { id: complaintId },
                select: { ticketNumber: true, category: true, status: true, address: true },
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, fullName: true },
            }),
        ]);
        if (!complaint || !user) {
            // eslint-disable-next-line no-console
            console.warn(`[confirmation.worker] Skipping job — missing complaint/user (complaint=${complaintId}, user=${userId}).`);
            return;
        }
        // eslint-disable-next-line no-console
        console.log(`[confirmation.worker] Emailing ${user.email}: complaint ${complaint.ticketNumber} received.`);
        // TODO: send the real confirmation email via the transactional email service.
    }, { connection });
    worker.on("failed", (job, err) => {
        // eslint-disable-next-line no-console
        console.error(`[confirmation.worker] Job ${job?.id} failed:`, err);
    });
    // eslint-disable-next-line no-console
    console.log("[confirmation.worker] Started.");
    return worker;
}
// Allow running this module directly as a standalone worker process.
if (import.meta.url === `file://${process.argv[1]}`) {
    startConfirmationWorker();
}
//# sourceMappingURL=confirmation.worker.js.map
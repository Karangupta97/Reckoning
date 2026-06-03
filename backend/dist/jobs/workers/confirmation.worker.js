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
import { processComplaintConfirmation } from "../handlers.js";
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
        await processComplaintConfirmation(complaintId, userId);
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
/**
 * SLA escalation worker.
 *
 * Two responsibilities:
 *   1. Consume `sla-escalation` jobs (a specific complaint id to (re)evaluate)
 *      and advance its escalation level via the shared handler.
 *   2. Run a periodic sweep ({@link scanAndEscalateBreaches}) that finds every
 *      complaint whose SLA deadline has lapsed and escalates it — this is the
 *      deadline-detection loop described in Part 7.
 *
 * Run in its own process: `tsx src/jobs/workers/slaEscalation.worker.ts`
 * (or `npm run worker:sla`).
 */

import { Worker } from "bullmq";
import { connection, QUEUE_NAMES, type SlaEscalationJob } from "../queues.js";
import { processSlaEscalationJob } from "../handlers.js";
import { scanAndEscalateBreaches } from "../../modules/admin/escalation/escalation.service.js";

/** How often the deadline-detection sweep runs, in milliseconds (5 minutes). */
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Start the SLA escalation worker + periodic sweep.
 *
 * @returns The running {@link Worker}, or `null` when Redis is unconfigured.
 */
export function startSlaEscalationWorker(): Worker | null {
  if (!connection) {
    // eslint-disable-next-line no-console
    console.warn("[slaEscalation.worker] REDIS_URL not set — worker not started.");
    return null;
  }

  const worker = new Worker<SlaEscalationJob>(
    QUEUE_NAMES.slaEscalation,
    async (job) => {
      await processSlaEscalationJob(job.data.complaintId);
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`[slaEscalation.worker] Job ${job?.id} failed:`, err);
  });

  // Periodic deadline-detection sweep.
  const timer = setInterval(() => {
    void scanAndEscalateBreaches()
      .then((count) => {
        if (count > 0) {
          // eslint-disable-next-line no-console
          console.log(`[slaEscalation.worker] Sweep escalated ${count} complaint(s).`);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error("[slaEscalation.worker] Sweep failed:", error);
      });
  }, SWEEP_INTERVAL_MS);
  // Don't keep the event loop alive solely for the sweep timer.
  timer.unref();

  // eslint-disable-next-line no-console
  console.log("[slaEscalation.worker] Started (sweep every 5m).");
  return worker;
}

// Allow running this module directly as a standalone worker process.
if (import.meta.url === `file://${process.argv[1]}`) {
  startSlaEscalationWorker();
}

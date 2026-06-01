/**
 * AI-analysis worker — PLACEHOLDER (SOON).
 *
 * Consumes `ai-analysis` jobs and will eventually run the road-damage model,
 * then write back `aiDetected`, `aiCategory`, `aiConfidence`, `aiRawResult`
 * and (re)derive severity. For now it just logs receipt so the wiring can be
 * exercised end-to-end.
 *
 * Workers are OPT-IN: they only start when Redis is configured. Run this file
 * in its own process (e.g. `tsx src/jobs/workers/aiAnalysis.worker.ts`).
 */

import { Worker } from "bullmq";
import { connection, QUEUE_NAMES, type AiAnalysisJob } from "../queues.js";

/**
 * Start the AI-analysis worker.
 *
 * @returns The running {@link Worker}, or `null` when Redis is unconfigured.
 */
export function startAiAnalysisWorker(): Worker | null {
  if (!connection) {
    // eslint-disable-next-line no-console
    console.warn("[aiAnalysis.worker] REDIS_URL not set — worker not started.");
    return null;
  }

  const worker = new Worker<AiAnalysisJob>(
    QUEUE_NAMES.aiAnalysis,
    async (job) => {
      // eslint-disable-next-line no-console
      console.log(`[aiAnalysis.worker] (SOON) Received complaint ${job.data.complaintId}`);
      // TODO: run inference + persist aiDetected/aiCategory/aiConfidence/severity.
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`[aiAnalysis.worker] Job ${job?.id} failed:`, err);
  });

  // eslint-disable-next-line no-console
  console.log("[aiAnalysis.worker] Started.");
  return worker;
}

// Allow running this module directly as a standalone worker process.
if (import.meta.url === `file://${process.argv[1]}`) {
  startAiAnalysisWorker();
}

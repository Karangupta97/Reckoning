/**
 * Worker registry — imports and initializes all BullMQ workers.
 *
 * Call {@link startAllWorkers} after the database connection is confirmed to
 * boot all background processors. Each worker guards internally against a
 * missing Redis URL and returns `null` when queues are disabled.
 *
 * Run from `src/server.ts` (or `src/app.ts`) post-DB-connect, or import
 * individual starters for standalone process mode.
 */

import type { Worker } from "bullmq";
import { startAuthorityAssignmentWorker } from "./authorityAssignment.worker.js";
import { startSlaEngineWorker } from "./slaEngine.worker.js";

/** Registry of active worker instances (null entries mean Redis is absent). */
export interface WorkerRegistry {
  authorityAssignment: Worker | null;
  slaEngine: Worker | null;
}

/**
 * Initialize and start all registered BullMQ workers.
 *
 * Safe to call when Redis is unconfigured — each worker no-ops individually.
 *
 * @returns A registry of active worker instances.
 */
export function startAllWorkers(): WorkerRegistry {
  // eslint-disable-next-line no-console
  console.log("[workers] Initializing background workers...");

  const registry: WorkerRegistry = {
    authorityAssignment: startAuthorityAssignmentWorker(),
    slaEngine: startSlaEngineWorker(),
  };

  // eslint-disable-next-line no-console
  console.log("[workers] All workers initialized.");
  return registry;
}

export { startAuthorityAssignmentWorker } from "./authorityAssignment.worker.js";
export { startSlaEngineWorker } from "./slaEngine.worker.js";

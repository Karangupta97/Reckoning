/**
 * Authority-assignment worker.
 *
 * Consumes `authority-assignment` jobs, performs a two-step PostGIS geofence
 * lookup (ST_Contains → ST_DWithin nearest 5 km) to find the responsible
 * sub-district + admin, creates a Ticket record, and pushes a user notification
 * job.
 *
 * Job payload: `{ complaintId: string }`
 *
 * Run in its own process: `tsx src/workers/authorityAssignment.worker.ts`
 * (or `npm run worker:assignment`).
 */

import { Worker, type Job } from "bullmq";
import { prisma } from "../config/prisma.js";
import { query } from "../config/db.js";
import {
  connection,
  QUEUE_NAMES,
  notificationUserQueue,
  type AuthorityAssignmentJob,
} from "../jobs/queues.js";
import { getSlaDeadline } from "../utils/sla.js";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Result of the PostGIS sub-district lookup. */
interface RoutingResult {
  subDistrictId: string;
  districtId: string;
  assignedAdminId: string;
  subDistrictName?: string;
}

/** Row shape returned by ST_Contains query. */
interface ContainsRow {
  subDistrictId: string;
  districtId: string;
  assignedAdminId: string;
  subDistrictName: string;
}

/** Row shape returned by ST_DWithin nearest query. */
interface NearestRow extends ContainsRow {
  distance: number;
}

/** Row shape returned by ticket_number_seq nextval. */
interface SeqRow {
  seq: string;
}

// ─── PostGIS Routing (raw pg pool) ──────────────────────────────────────────

/**
 * ATTEMPT 1: Find the sub-district whose geofence contains the complaint point.
 *
 * Uses `ST_Contains` for an exact spatial inclusion test.
 *
 * @param longitude Complaint longitude.
 * @param latitude  Complaint latitude.
 * @returns The matching sub-district routing result, or `null`.
 */
async function findByContains(
  longitude: number,
  latitude: number,
): Promise<RoutingResult | null> {
  const sql = `
    SELECT
      sd.id        AS "subDistrictId",
      sd."districtId",
      au.id        AS "assignedAdminId",
      sd.name      AS "subDistrictName"
    FROM "sub_districts" sd
    JOIN "admin_users" au
      ON au."subDistrictId" = sd.id
      AND au.role = 'SUB_DISTRICT_ADMIN'
      AND au.status = 'ACTIVE'
    WHERE ST_Contains(
      sd.geofence,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)
    )
    LIMIT 1
  `;

  const result = await query<ContainsRow>(sql, [longitude, latitude]);
  return result.rows[0] ?? null;
}

/**
 * ATTEMPT 2: Find the nearest sub-district within 5 km of the complaint point.
 *
 * Falls back to a distance-ordered search when the point doesn't lie inside any
 * geofence boundary. Only returns results within a 5 km radius.
 *
 * @param longitude Complaint longitude.
 * @param latitude  Complaint latitude.
 * @returns The nearest sub-district routing result within 5 km, or `null`.
 */
async function findByNearest(
  longitude: number,
  latitude: number,
): Promise<RoutingResult | null> {
  const sql = `
    SELECT
      sd.id        AS "subDistrictId",
      sd."districtId",
      au.id        AS "assignedAdminId",
      sd.name      AS "subDistrictName",
      ST_Distance(
        sd.geofence::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      ) AS distance
    FROM "sub_districts" sd
    JOIN "admin_users" au
      ON au."subDistrictId" = sd.id
      AND au.role = 'SUB_DISTRICT_ADMIN'
      AND au.status = 'ACTIVE'
    WHERE ST_DWithin(
      sd.geofence::geography,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      5000
    )
    ORDER BY distance ASC
    LIMIT 1
  `;

  const result = await query<NearestRow>(sql, [longitude, latitude]);
  return result.rows[0] ?? null;
}

/**
 * Two-step PostGIS routing: ST_Contains first, then nearest fallback.
 *
 * @param longitude Complaint longitude.
 * @param latitude  Complaint latitude.
 * @returns Routing result or `null` (UNASSIGNED).
 */
async function resolveRouting(
  longitude: number,
  latitude: number,
): Promise<RoutingResult | null> {
  // Step 1: exact containment
  const containsResult = await findByContains(longitude, latitude);
  if (containsResult) return containsResult;

  // Step 2: nearest within proximity
  const nearestResult = await findByNearest(longitude, latitude);
  return nearestResult;
}

// ─── Ticket Number Generation ────────────────────────────────────────────────

/**
 * Generate the next ticket number using a PostgreSQL sequence.
 *
 * Format: `TKT-{YYYY}-{6-digit-zero-padded-seq}`
 *
 * @returns The formatted ticket number string.
 */
async function generateTicketNumber(): Promise<string> {
  const result = await query<SeqRow>(
    `SELECT NEXTVAL('ticket_number_seq') AS seq`,
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to obtain ticket_number_seq nextval");
  }
  const seq = Number(row.seq);
  return `TKT-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

// ─── Core Job Processor ──────────────────────────────────────────────────────

/**
 * Process a single authority-assignment job.
 *
 * Steps:
 * 1. Fetch complaint (id, latitude, longitude, severity, category, userId).
 * 2. PostGIS two-step routing (ST_Contains → nearest fallback).
 * 3. Generate ticket number from sequence.
 * 4. Calculate SLA deadline from severity.
 * 5. Prisma transaction: create ticket + update complaint.
 * 6. Push notification-user job (fire and forget).
 * 7. Logging.
 *
 * @param complaintId The complaint to process.
 * @throws Error when complaint is not found (triggers BullMQ retry).
 */
export async function processAuthorityAssignment(complaintId: string): Promise<void> {
  // ─── Step 1: Fetch complaint ─────────────────────────────────────────────
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      severity: true,
      category: true,
      userId: true,
      ticketId: true,
    },
  });

  if (!complaint) {
    throw new Error(
      `[authorityAssignment.worker] Complaint not found: ${complaintId}`,
    );
  }

  // Idempotency guard: skip if ticket already exists.
  if (complaint.ticketId) {
    // eslint-disable-next-line no-console
    console.info(
      `[authorityAssignment.worker] Ticket already exists for complaint: ${complaintId} — skipping.`,
    );
    return;
  }

  // ─── Step 2: PostGIS routing (two-step) ──────────────────────────────────
  const routingResult = await resolveRouting(
    complaint.longitude,
    complaint.latitude,
  );

  if (!routingResult) {
    // eslint-disable-next-line no-console
    console.warn(
      `[authorityAssignment.worker] No sub-district found for complaint ${complaintId} at [${complaint.latitude}, ${complaint.longitude}]`,
    );
  }

  // ─── Step 3: Generate ticket number ──────────────────────────────────────
  const ticketNumber = await generateTicketNumber();

  // ─── Step 4: Calculate SLA deadline ──────────────────────────────────────
  const slaDeadline = getSlaDeadline(complaint.severity);

  // ─── Step 5: Prisma transaction (atomic) ─────────────────────────────────
  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.ticket.create({
      data: {
        ticketNumber,
        complaintId: complaint.id,
        subDistrictId: routingResult?.subDistrictId ?? null,
        districtId: routingResult?.districtId ?? null,
        assignedAdminId: routingResult?.assignedAdminId ?? null,
        status: routingResult ? "OPEN" : "UNASSIGNED",
        priority: complaint.severity,
        slaDeadline,
        escalationLevel: 0,
      },
    });

    await tx.complaint.update({
      where: { id: complaint.id },
      data: {
        ticketId: created.id,
        status: routingResult ? "UNDER_REVIEW" : "SUBMITTED",
      },
    });

    return created;
  });

  // ─── Step 6: Push notification job (fire and forget) ─────────────────────
  if (notificationUserQueue) {
    await notificationUserQueue.add(QUEUE_NAMES.notificationUser, {
      type: routingResult ? "TICKET_ASSIGNED" : "TICKET_UNASSIGNED",
      complaintId: complaint.id,
      ticketId: ticket.id,
      userId: complaint.userId,
      ticketNumber,
      subDistrictName: routingResult?.subDistrictName ?? null,
    });
  }

  // ─── Step 7: Logging ─────────────────────────────────────────────────────
  // eslint-disable-next-line no-console
  console.info(
    `[authorityAssignment.worker] Ticket ${ticketNumber} created → complaintId: ${complaintId} → admin: ${routingResult?.assignedAdminId ?? "UNASSIGNED"}`,
  );
}

// ─── Worker Bootstrap ────────────────────────────────────────────────────────

/**
 * Start the authority-assignment BullMQ worker.
 *
 * Concurrency: 5 — processes up to 5 jobs in parallel.
 *
 * @returns The running {@link Worker}, or `null` when Redis is unconfigured.
 */
export function startAuthorityAssignmentWorker(): Worker<AuthorityAssignmentJob> | null {
  if (!connection) {
    // eslint-disable-next-line no-console
    console.warn(
      "[authorityAssignment.worker] REDIS_URL not set — worker not started.",
    );
    return null;
  }

  const worker = new Worker<AuthorityAssignmentJob>(
    QUEUE_NAMES.authorityAssignment,
    async (job: Job<AuthorityAssignmentJob>) => {
      await processAuthorityAssignment(job.data.complaintId);
    },
    {
      connection,
      concurrency: 5,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  );

  worker.on("completed", (job) => {
    // eslint-disable-next-line no-console
    console.debug(
      `[authorityAssignment.worker] Job ${job.id} completed.`,
    );
  });

  worker.on("failed", (job, err) => {
    // eslint-disable-next-line no-console
    console.error(
      `[authorityAssignment.worker] Job ${job?.id} failed:`,
      err,
    );
  });

  // eslint-disable-next-line no-console
  console.log("[authorityAssignment.worker] Started (concurrency: 5).");
  return worker;
}

// Allow running this module directly as a standalone worker process.
const scriptPath = `file://${process.argv[1]}`;
const isDirectRun =
  import.meta.url === scriptPath ||
  import.meta.url === `file://${encodeURI(process.argv[1]!)}` ||
  import.meta.url.replace(/%20/g, " ") === scriptPath;

if (isDirectRun) {
  startAuthorityAssignmentWorker();
}

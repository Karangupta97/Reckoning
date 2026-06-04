/**
 * Authority-assignment worker.
 *
 * Consumes `authority-assignment` jobs, performs PostGIS geofence lookup to
 * find the responsible sub-district + admin, creates a Ticket record, and
 * pushes a user notification job.
 *
 * Job payload: { complaintId: string }
 *
 * Run in its own process: `tsx src/workers/authorityAssignment.worker.ts`.
 */

import { Worker } from "bullmq";
import { prisma } from "../config/prisma.js";
import {
  connection,
  QUEUE_NAMES,
  notificationUserQueue,
  type AuthorityAssignmentJob,
  type NotificationUserJob,
} from "../jobs/queues.js";
import { getSlaDeadline } from "../utils/sla.js";

/** Result of the PostGIS sub-district lookup. */
interface GeoLookupResult {
  id: string;
  districtId: string;
  adminUserId: string;
}

/**
 * Find the sub-district whose geofence contains the complaint point, along
 * with the active SUB_DISTRICT_ADMIN assigned to it.
 *
 * @param longitude Complaint longitude.
 * @param latitude  Complaint latitude.
 * @returns The matching sub-district + admin, or `null`.
 */
async function findSubDistrictByPoint(
  longitude: number,
  latitude: number,
): Promise<GeoLookupResult | null> {
  const rows = await prisma.$queryRaw<GeoLookupResult[]>`
    SELECT
      sd.id,
      sd."districtId",
      au.id AS "adminUserId"
    FROM "sub_districts" sd
    JOIN "admin_users" au
      ON au."subDistrictId" = sd.id
      AND au.role = 'SUB_DISTRICT_ADMIN'
      AND au.status = 'ACTIVE'
    WHERE ST_Contains(
      sd.geofence,
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
    )
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/**
 * Generate the next ticket number using a PostgreSQL sequence.
 *
 * Format: TKT-{YYYY}-{6-digit-zero-padded-seq}
 *
 * @returns The formatted ticket number string.
 */
async function generateTicketNumber(): Promise<string> {
  const year = new Date().getUTCFullYear();
  const result = await prisma.$queryRaw<Array<{ nextval: bigint }>>`
    SELECT nextval('ticket_number_seq')
  `;
  const seq = Number(result[0].nextval);
  return `TKT-${year}-${String(seq).padStart(6, "0")}`;
}

/**
 * Push a notification job to the user notification queue.
 *
 * Logs the payload for now — the notification delivery worker is built later.
 *
 * @param payload Notification job payload.
 */
async function pushUserNotification(payload: NotificationUserJob): Promise<void> {
  if (notificationUserQueue) {
    await notificationUserQueue.add(QUEUE_NAMES.notificationUser, payload);
  }
  // eslint-disable-next-line no-console
  console.log("[authorityAssignment.worker] Notification payload:", JSON.stringify(payload));
}

/**
 * Process a single authority-assignment job.
 *
 * 1. Fetch complaint (latitude, longitude, severity, category).
 * 2. PostGIS query to find the responsible sub-district + admin.
 * 3. Generate ticket number from sequence.
 * 4. Calculate SLA deadline from severity.
 * 5. Create Ticket record.
 * 6. Update Complaint: set ticketId + status = UNDER_REVIEW.
 * 7. Push notification-user job.
 *
 * @param complaintId The complaint to process.
 */
async function processAuthorityAssignment(complaintId: string): Promise<void> {
  // 1. Fetch complaint
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
    // eslint-disable-next-line no-console
    console.warn(
      `[authorityAssignment.worker] Complaint not found: ${complaintId}`,
    );
    return;
  }

  // Guard: if a ticket already exists, skip (idempotency).
  if (complaint.ticketId) {
    // eslint-disable-next-line no-console
    console.warn(
      `[authorityAssignment.worker] Ticket already exists for complaint: ${complaintId}`,
    );
    return;
  }

  // 2. PostGIS lookup
  const lookup = await findSubDistrictByPoint(
    complaint.longitude,
    complaint.latitude,
  );

  const subDistrictId = lookup?.id ?? null;
  const districtId = lookup?.districtId ?? null;
  const assignedAdminId = lookup?.adminUserId ?? null;
  const status = lookup ? "OPEN" : "UNASSIGNED";

  // 3. Generate ticket number
  const ticketNumber = await generateTicketNumber();

  // 4. SLA deadline
  const slaDeadline = getSlaDeadline(complaint.severity);

  // 5 + 6. Create Ticket and update Complaint atomically
  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.ticket.create({
      data: {
        ticketNumber,
        complaintId: complaint.id,
        subDistrictId,
        districtId,
        assignedAdminId,
        status,
        priority: complaint.severity,
        slaDeadline,
      },
    });

    await tx.complaint.update({
      where: { id: complaint.id },
      data: {
        ticketId: created.id,
        status: "UNDER_REVIEW",
      },
    });

    // Create initial status history entry
    if (assignedAdminId) {
      await tx.ticketStatusHistory.create({
        data: {
          ticketId: created.id,
          status,
          changedById: assignedAdminId,
          note: "Ticket created and assigned automatically via geofence.",
        },
      });
    }

    return created;
  });

  // 7. Push notification
  await pushUserNotification({
    type: "TICKET_ASSIGNED",
    complaintId: complaint.id,
    ticketId: ticket.id,
    userId: complaint.userId,
  });

  // eslint-disable-next-line no-console
  console.log(
    `[authorityAssignment.worker] Ticket ${ticketNumber} created for complaint ${complaintId}` +
      ` → ${lookup ? `assigned to admin ${assignedAdminId}` : "UNASSIGNED (no geofence match)"}`,
  );
}

/**
 * Start the authority-assignment worker.
 *
 * @returns The running {@link Worker}, or `null` when Redis is unconfigured.
 */
export function startAuthorityAssignmentWorker(): Worker | null {
  if (!connection) {
    // eslint-disable-next-line no-console
    console.warn("[authorityAssignment.worker] REDIS_URL not set — worker not started.");
    return null;
  }

  const worker = new Worker<AuthorityAssignmentJob>(
    QUEUE_NAMES.authorityAssignment,
    async (job) => {
      await processAuthorityAssignment(job.data.complaintId);
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    // eslint-disable-next-line no-console
    console.error(
      `[authorityAssignment.worker] Job ${job?.id} failed:`,
      err,
    );
  });

  // eslint-disable-next-line no-console
  console.log("[authorityAssignment.worker] Started.");
  return worker;
}

// Allow running this module directly as a standalone worker process.
if (import.meta.url === `file://${process.argv[1]}`) {
  startAuthorityAssignmentWorker();
}

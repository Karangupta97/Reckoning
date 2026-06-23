/**
 * Tickets service — business logic for ticket listing, detail, status
 * transitions, notes, and citizen-facing views.
 *
 * Controllers delegate here; all DB access, authorization checks, and
 * response shaping live in this module.
 */

import { Prisma, type TicketStatus, type SeverityLevel } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { getSignedDownloadUrl } from "../../config/s3.js";
import { AppError } from "../../utils/AppError.js";
import { getDaysRemaining } from "../../utils/sla.js";
import {
  notificationUserQueue,
  QUEUE_NAMES,
  type NotificationUserJob,
} from "../../jobs/queues.js";
import { processStatusUpdateNotification } from "../../jobs/handlers.js";
import { ALLOWED_TRANSITIONS } from "./tickets.validation.js";
import type {
  CitizenTicketView,
  CreateTicketNoteInput,
  ListTicketsQuery,
  PaginationMeta,
  SuperAdminListTicketsQuery,
  TicketDetail,
  TicketListItem,
  TicketListResult,
  TicketStats,
  UpdateTicketStatusInput,
  UpdateTicketStatusResult,
} from "./tickets.types.js";

/** Signed URL expiry for media (1 hour). */
const SIGNED_URL_EXPIRY_SECONDS = 3600;

/**
 * Wrap a DB operation, converting Prisma errors to generic 500 AppError.
 */
async function dbGuard<T>(operation: () => Promise<T>, context: string): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) throw error;
    // eslint-disable-next-line no-console
    console.error(`[tickets.service] DB error during ${context}:`, error);
    throw new AppError("A database error occurred. Please try again.", 500, {
      cause: error,
    });
  }
}

/**
 * Generate a signed thumbnail URL for a complaint's primary media.
 */
async function signedThumbnail(s3Key: string | undefined | null): Promise<string | null> {
  if (!s3Key) return null;
  try {
    return await getSignedDownloadUrl(s3Key, SIGNED_URL_EXPIRY_SECONDS);
  } catch {
    return null;
  }
}

/**
 * Build pagination metadata.
 */
function paginate(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Push a notification job to the user notification queue.
 * Falls back to inline delivery when queues are disabled (no Redis).
 */
async function pushUserNotification(payload: NotificationUserJob): Promise<void> {
  if (notificationUserQueue) {
    try {
      await notificationUserQueue.add(QUEUE_NAMES.notificationUser, payload);
      // eslint-disable-next-line no-console
      console.log("[tickets.service] Notification queued:", JSON.stringify(payload));
      return;
    } catch {
      // eslint-disable-next-line no-console
      console.error("[tickets.service] Failed to push user notification to queue.");
    }
  }

  // Inline fallback: deliver the notification directly (fire-and-forget).
  if (payload.type === "STATUS_UPDATE" && payload.newStatus) {
    processStatusUpdateNotification(payload.complaintId, payload.userId, payload.newStatus).catch(
      (error) => {
        // eslint-disable-next-line no-console
        console.error("[tickets.service] Inline status-update notification failed:", error);
      },
    );
  } else {
    // eslint-disable-next-line no-console
    console.log("[tickets.service] Notification (no queue):", JSON.stringify(payload));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-District Admin: List Tickets
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List tickets assigned to the authenticated sub-district admin.
 *
 * Sorted: CRITICAL first, then by slaDeadline ASC.
 */
export async function listTickets(
  adminId: string,
  query: ListTicketsQuery,
): Promise<TicketListResult> {
  const { status, priority, page, limit } = query;
  const offset = (page - 1) * limit;

  const where: Prisma.TicketWhereInput = {
    assignedAdminId: adminId,
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
  };

  const [total, tickets, statsGrouped] = await dbGuard(
    () =>
      prisma.$transaction([
        prisma.ticket.count({ where }),
        prisma.ticket.findMany({
          where,
          include: {
            complaint: {
              select: {
                ticketNumber: true,
                category: true,
                address: true,
                media: {
                  where: { isPrimary: true },
                  take: 1,
                  include: { media: { select: { s3Key: true } } },
                },
              },
            },
          },
          orderBy: [
            { priority: "desc" },
            { slaDeadline: "asc" },
          ],
          skip: offset,
          take: limit,
        }),
        prisma.ticket.groupBy({
          by: ["status"],
          where: { assignedAdminId: adminId },
          _count: { id: true },
        }),
      ]),
    "listTickets",
  );

  // Compute stats
  const statusCounts = new Map<string, number>(
    statsGrouped.map((s) => [s.status, s._count.id]),
  );

  const criticalCount = await dbGuard(
    () =>
      prisma.ticket.count({
        where: { assignedAdminId: adminId, priority: "CRITICAL" },
      }),
    "listTickets:criticalCount",
  );

  const ticketStats: TicketStats = {
    open: statusCounts.get("OPEN") ?? 0,
    inProgress: statusCounts.get("IN_PROGRESS") ?? 0,
    resolved: statusCounts.get("RESOLVED") ?? 0,
    critical: criticalCount,
  };

  // Map to response shape
  const items: TicketListItem[] = await Promise.all(
    tickets.map(async (t) => {
      const primaryMedia = t.complaint.media[0]?.media;
      const thumbnailUrl = await signedThumbnail(primaryMedia?.s3Key);

      return {
        ticketId: t.id,
        ticketNumber: t.ticketNumber,
        status: t.status,
        priority: t.priority,
        daysRemaining: getDaysRemaining(t.slaDeadline),
        slaDeadline: t.slaDeadline,
        complaint: {
          complaintNumber: t.complaint.ticketNumber,
          category: t.complaint.category,
          address: t.complaint.address,
          thumbnailUrl,
        },
      };
    }),
  );

  return {
    tickets: items,
    pagination: paginate(total, page, limit),
    stats: ticketStats,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Ticket Detail
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get full ticket detail by id.
 */
export async function getTicketById(
  ticketId: string,
  adminId: string,
  adminRole: string,
  adminSubDistrictId: string | null,
): Promise<TicketDetail> {
  const ticket = await dbGuard(
    () =>
      prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          complaint: {
            select: {
              id: true,
              ticketNumber: true,
              category: true,
              description: true,
              severity: true,
              address: true,
              roadName: true,
              landmark: true,
              latitude: true,
              longitude: true,
              isAnonymous: true,
              user: { select: { fullName: true } },
              media: {
                orderBy: { order: "asc" },
                include: { media: { select: { s3Key: true, mimeType: true } } },
              },
              createdAt: true,
            },
          },
          notes: {
            orderBy: { createdAt: "desc" },
            select: { id: true, authorId: true, content: true, createdAt: true },
          },
          statusHistory: {
            orderBy: { changedAt: "asc" },
            select: {
              id: true,
              status: true,
              changedById: true,
              note: true,
              changedAt: true,
            },
          },
        },
      }),
    "getTicketById",
  );

  if (!ticket) {
    throw new AppError("Ticket not found.", 404, { code: "NOT_FOUND" });
  }

  // Guard: Sub-District Admin can only see their own tickets
  if (adminRole === "SUB_DISTRICT_ADMIN" && ticket.assignedAdminId !== adminId) {
    throw new AppError("Access denied.", 403, { code: "FORBIDDEN" });
  }

  // District Admin can see tickets in their district's sub-districts
  if (adminRole === "DISTRICT_ADMIN") {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { districtId: true },
    });
    if (!ticket.districtId || admin?.districtId !== ticket.districtId) {
      throw new AppError("Access denied.", 403, { code: "FORBIDDEN" });
    }
  }

  // Sign media URLs
  const mediaWithUrls = await Promise.all(
    ticket.complaint.media.map(async (m) => ({
      url: (await signedThumbnail(m.media.s3Key)) ?? "",
      mimeType: m.media.mimeType,
      isPrimary: m.isPrimary,
    })),
  );

  const submittedBy =
    ticket.complaint.isAnonymous || !ticket.complaint.user?.fullName
      ? "Anonymous Citizen"
      : ticket.complaint.user.fullName;

  return {
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    status: ticket.status,
    priority: ticket.priority,
    daysRemaining: getDaysRemaining(ticket.slaDeadline),
    slaDeadline: ticket.slaDeadline,
    escalationLevel: ticket.escalationLevel,
    escalatedAt: ticket.escalatedAt,
    resolvedAt: ticket.resolvedAt,
    rejectedAt: ticket.rejectedAt,
    rejectionReason: ticket.rejectionReason,
    assignedAdminId: ticket.assignedAdminId,
    subDistrictId: ticket.subDistrictId,
    districtId: ticket.districtId,
    complaint: {
      id: ticket.complaint.id,
      ticketNumber: ticket.complaint.ticketNumber,
      category: ticket.complaint.category,
      description: ticket.complaint.description,
      severity: ticket.complaint.severity,
      address: ticket.complaint.address,
      roadName: ticket.complaint.roadName,
      landmark: ticket.complaint.landmark,
      latitude: ticket.complaint.latitude,
      longitude: ticket.complaint.longitude,
      submittedBy,
      media: mediaWithUrls,
      createdAt: ticket.complaint.createdAt,
    },
    notes: ticket.notes,
    statusHistory: ticket.statusHistory,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Update Ticket Status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update ticket status with strict transition validation.
 *
 * Allowed transitions: OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED | REJECTED.
 */
export async function updateTicketStatus(
  ticketId: string,
  adminId: string,
  input: UpdateTicketStatusInput,
): Promise<UpdateTicketStatusResult> {
  const ticket = await dbGuard(
    () =>
      prisma.ticket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          ticketNumber: true,
          status: true,
          assignedAdminId: true,
          complaintId: true,
          complaint: { select: { userId: true } },
        },
      }),
    "updateTicketStatus:find",
  );

  if (!ticket) {
    throw new AppError("Ticket not found.", 404, { code: "NOT_FOUND" });
  }

  // Guard: only the assigned admin can update status
  if (ticket.assignedAdminId !== adminId) {
    throw new AppError("Only the assigned admin can update this ticket.", 403, {
      code: "FORBIDDEN",
    });
  }

  // Validate transition
  const allowed = ALLOWED_TRANSITIONS[ticket.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw new AppError(
      `Cannot transition from ${ticket.status} to ${input.status}.`,
      400,
      { code: "INVALID_TRANSITION" },
    );
  }

  const previousStatus = ticket.status;
  const now = new Date();

  // Build update data
  const updateData: Prisma.TicketUpdateInput = {
    status: input.status as TicketStatus,
    ...(input.status === "RESOLVED" ? { resolvedAt: now } : {}),
    ...(input.status === "REJECTED"
      ? { rejectedAt: now, rejectionReason: input.note ?? null }
      : {}),
  };

  // Build complaint status update
  let complaintStatus: "RESOLVED" | "REJECTED" | undefined;
  if (input.status === "RESOLVED") complaintStatus = "RESOLVED";
  if (input.status === "REJECTED") complaintStatus = "REJECTED";

  // Atomic update
  const updated = await dbGuard(
    () =>
      prisma.$transaction(async (tx) => {
        const result = await tx.ticket.update({
          where: { id: ticketId },
          data: updateData,
          select: { id: true, ticketNumber: true, updatedAt: true },
        });

        // Update complaint status if terminal
        if (complaintStatus) {
          await tx.complaint.update({
            where: { id: ticket.complaintId },
            data: {
              status: complaintStatus,
              ...(complaintStatus === "RESOLVED"
                ? { resolvedAt: now, resolvedByAdmin: adminId }
                : {}),
            },
          });
        }

        // Append status history
        await tx.ticketStatusHistory.create({
          data: {
            ticketId,
            status: input.status as TicketStatus,
            changedById: adminId,
            note: input.note ?? null,
          },
        });

        return result;
      }),
    "updateTicketStatus:transaction",
  );

  // Push notification
  await pushUserNotification({
    type: "STATUS_UPDATE",
    complaintId: ticket.complaintId,
    ticketId: ticket.id,
    userId: ticket.complaint.userId,
    newStatus: input.status,
  });

  return {
    ticketId: updated.id,
    ticketNumber: updated.ticketNumber,
    previousStatus,
    newStatus: input.status as TicketStatus,
    updatedAt: updated.updatedAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Ticket Note
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a note to a ticket.
 *
 * Allowed for SUB_DISTRICT_ADMIN (assigned) and DISTRICT_ADMIN (same district).
 */
export async function createTicketNote(
  ticketId: string,
  adminId: string,
  adminRole: string,
  adminDistrictId: string | null,
  input: CreateTicketNoteInput,
): Promise<{ id: string; ticketId: string; authorId: string; content: string; createdAt: Date }> {
  const ticket = await dbGuard(
    () =>
      prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, assignedAdminId: true, districtId: true },
      }),
    "createTicketNote:find",
  );

  if (!ticket) {
    throw new AppError("Ticket not found.", 404, { code: "NOT_FOUND" });
  }

  // Guard: SUB_DISTRICT_ADMIN must be assigned; DISTRICT_ADMIN must be in the same district
  if (adminRole === "SUB_DISTRICT_ADMIN" && ticket.assignedAdminId !== adminId) {
    throw new AppError("Access denied.", 403, { code: "FORBIDDEN" });
  }
  if (adminRole === "DISTRICT_ADMIN" && ticket.districtId !== adminDistrictId) {
    throw new AppError("Access denied.", 403, { code: "FORBIDDEN" });
  }

  const note = await dbGuard(
    () =>
      prisma.ticketNote.create({
        data: {
          ticketId,
          authorId: adminId,
          content: input.content,
        },
        select: { id: true, ticketId: true, authorId: true, content: true, createdAt: true },
      }),
    "createTicketNote:create",
  );

  return note;
}

// ─────────────────────────────────────────────────────────────────────────────
// Citizen: Get Complaint Ticket
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the citizen-facing ticket view for a complaint.
 *
 * Privacy: NEVER returns assignedAdminId, admin email, or admin name.
 * Only returns the sub-district office name as "assignedTo".
 */
export async function getComplaintTicket(
  complaintId: string,
  userId: string,
): Promise<CitizenTicketView> {
  const complaint = await dbGuard(
    () =>
      prisma.complaint.findUnique({
        where: { id: complaintId },
        select: { id: true, userId: true, ticketId: true },
      }),
    "getComplaintTicket:findComplaint",
  );

  if (!complaint) {
    throw new AppError("Complaint not found.", 404, { code: "NOT_FOUND" });
  }

  // Guard: citizen can only see their own complaint's ticket
  if (complaint.userId !== userId) {
    throw new AppError("Access denied.", 403, { code: "FORBIDDEN" });
  }

  if (!complaint.ticketId) {
    throw new AppError("No ticket has been assigned yet.", 404, {
      code: "TICKET_NOT_FOUND",
    });
  }

  const ticket = await dbGuard(
    () =>
      prisma.ticket.findUnique({
        where: { id: complaint.ticketId! },
        include: {
          subDistrict: { select: { name: true } },
          statusHistory: {
            orderBy: { changedAt: "asc" },
            select: { status: true, changedAt: true, note: true },
          },
        },
      }),
    "getComplaintTicket:findTicket",
  );

  if (!ticket) {
    throw new AppError("Ticket not found.", 404, { code: "TICKET_NOT_FOUND" });
  }

  const assignedTo = ticket.subDistrict
    ? `${ticket.subDistrict.name} Sub-District Office`
    : "Unassigned — Pending Review";

  return {
    ticketNumber: ticket.ticketNumber,
    status: ticket.status,
    assignedTo,
    slaDeadline: ticket.slaDeadline,
    daysRemaining: getDaysRemaining(ticket.slaDeadline),
    estimatedResolutionDate: ticket.slaDeadline,
    statusHistory: ticket.statusHistory.map((h) => ({
      status: h.status,
      changedAt: h.changedAt,
      note: h.note,
    })),
    lastUpdatedAt: ticket.updatedAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Super Admin: List All Tickets
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List all tickets platform-wide with filtering (Super Admin).
 */
export async function listAllTickets(
  query: SuperAdminListTicketsQuery,
): Promise<TicketListResult> {
  const { status, priority, subDistrictId, districtId, page, limit } = query;
  const offset = (page - 1) * limit;

  const where: Prisma.TicketWhereInput = {
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(subDistrictId ? { subDistrictId } : {}),
    ...(districtId ? { districtId } : {}),
  };

  const [total, tickets, statsRaw] = await dbGuard(
    () =>
      prisma.$transaction([
        prisma.ticket.count({ where }),
        prisma.ticket.findMany({
          where,
          include: {
            complaint: {
              select: {
                ticketNumber: true,
                category: true,
                address: true,
                media: {
                  where: { isPrimary: true },
                  take: 1,
                  include: { media: { select: { s3Key: true } } },
                },
              },
            },
          },
          orderBy: [{ priority: "desc" }, { slaDeadline: "asc" }],
          skip: offset,
          take: limit,
        }),
        prisma.ticket.groupBy({
          by: ["status"],
          where,
          _count: { id: true },
        }),
      ]),
    "listAllTickets",
  );

  const statusCounts = new Map<string, number>(
    statsRaw.map((s) => [s.status, s._count.id]),
  );

  const criticalCount = await dbGuard(
    () => prisma.ticket.count({ where: { ...where, priority: "CRITICAL" } }),
    "listAllTickets:criticalCount",
  );

  const ticketStats: TicketStats = {
    open: statusCounts.get("OPEN") ?? 0,
    inProgress: statusCounts.get("IN_PROGRESS") ?? 0,
    resolved: statusCounts.get("RESOLVED") ?? 0,
    critical: criticalCount,
  };

  const items: TicketListItem[] = await Promise.all(
    tickets.map(async (t) => {
      const primaryMedia = t.complaint.media[0]?.media;
      const thumbnailUrl = await signedThumbnail(primaryMedia?.s3Key);

      return {
        ticketId: t.id,
        ticketNumber: t.ticketNumber,
        status: t.status,
        priority: t.priority,
        daysRemaining: getDaysRemaining(t.slaDeadline),
        slaDeadline: t.slaDeadline,
        complaint: {
          complaintNumber: t.complaint.ticketNumber,
          category: t.complaint.category,
          address: t.complaint.address,
          thumbnailUrl,
        },
      };
    }),
  );

  return {
    tickets: items,
    pagination: paginate(total, page, limit),
    stats: ticketStats,
  };
}

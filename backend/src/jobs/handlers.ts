/**
 * Shared job handlers — the actual "do the work" logic for background jobs.
 *
 * These functions are the single source of truth for what each job does. They
 * are invoked from two places:
 *
 *   1. BullMQ workers ({@link startConfirmationWorker} / {@link startAuthorityNotifyWorker})
 *      when Redis is configured and the work runs out-of-process; and
 *   2. the direct-send fallback in `services/queue.service.ts` when queues are
 *      disabled (no `REDIS_URL`), so the complaint workflow still emails users
 *      and authorities in single-instance / local deployments.
 *
 * Each handler re-fetches fresh data from the DB by id (jobs carry ids only),
 * so it never acts on a stale snapshot, and delegates delivery to the SES
 * email service.
 */

import { prisma } from "../config/prisma.js";
import {
  sendComplaintReceivedEmail,
  sendAdminNotificationEmail,
  sendComplaintStatusUpdateEmail,
} from "../services/email.service.js";
import { processSlaEscalation } from "../modules/admin/escalation/escalation.service.js";

/**
 * Email the reporting citizen their submission receipt.
 *
 * @param complaintId Complaint to confirm.
 * @param userId      Reporter user id.
 * @returns `true` when an email was sent, `false` when skipped (missing data).
 */
export async function processComplaintConfirmation(
  complaintId: string,
  userId: string,
): Promise<boolean> {
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
    console.warn(
      `[handlers] complaint-confirmation skipped — missing complaint/user (complaint=${complaintId}, user=${userId}).`,
    );
    return false;
  }

  await sendComplaintReceivedEmail({
    to: user.email,
    fullName: user.fullName,
    ticketNumber: complaint.ticketNumber,
    category: complaint.category,
    status: complaint.status,
    address: complaint.address,
  });
  return true;
}

/**
 * Email the assigned authority a summary of a new complaint.
 *
 * @param complaintId Complaint id.
 * @param authorityId Assigned authority id.
 * @returns `true` when an email was sent, `false` when skipped (missing/inactive).
 */
export async function processAuthorityNotification(
  complaintId: string,
  authorityId: string,
): Promise<boolean> {
  const [complaint, authority] = await Promise.all([
    prisma.complaint.findUnique({
      where: { id: complaintId },
      select: {
        ticketNumber: true,
        category: true,
        severity: true,
        address: true,
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
      `[handlers] authority-notify skipped — missing/inactive target (complaint=${complaintId}, authority=${authorityId}).`,
    );
    return false;
  }

  await sendAdminNotificationEmail({
    to: authority.email,
    recipientName: authority.name,
    ticketNumber: complaint.ticketNumber,
    category: complaint.category,
    severity: complaint.severity,
    reportedBy: "RoadWatch AI citizen",
    address: complaint.address,
  });
  return true;
}

/**
 * Email the platform admin (configured `ADMIN_EMAIL`) about a new complaint.
 *
 * Fired for every submission, independent of authority auto-assignment, so the
 * operations team always has visibility. Honours the reporter's anonymity.
 *
 * @param complaintId Complaint id.
 * @returns `true` when an email was sent, `false` when skipped (missing data).
 */
export async function processAdminNotification(
  complaintId: string,
): Promise<boolean> {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: {
      ticketNumber: true,
      category: true,
      severity: true,
      address: true,
      isAnonymous: true,
      user: { select: { fullName: true } },
    },
  });

  if (!complaint) {
    // eslint-disable-next-line no-console
    console.warn(
      `[handlers] admin-notify skipped — missing complaint (complaint=${complaintId}).`,
    );
    return false;
  }

  const reportedBy =
    complaint.isAnonymous || !complaint.user?.fullName
      ? "Anonymous Citizen"
      : complaint.user.fullName;

  await sendAdminNotificationEmail({
    ticketNumber: complaint.ticketNumber,
    category: complaint.category,
    severity: complaint.severity,
    reportedBy,
    address: complaint.address,
  });
  return true;
}

/**
 * Process a single complaint's SLA breach, advancing its escalation level and
 * dispatching the simultaneous push + SMS notifications.
 *
 * Delegates entirely to the escalation service; exposed here so both the
 * BullMQ worker and the inline fallback can invoke identical logic.
 *
 * @param complaintId Complaint whose SLA was breached.
 * @returns `true` when an escalation occurred, `false` when skipped.
 */
export async function processSlaEscalationJob(
  complaintId: string,
): Promise<boolean> {
  const { action } = await processSlaEscalation(complaintId);
  return action.startsWith("escalated");
}

/**
 * Email the citizen when their complaint status changes (RESOLVED, REJECTED, etc.).
 *
 * @param complaintId Complaint whose status changed.
 * @param userId      The citizen who filed the complaint.
 * @param newStatus   The new status value.
 * @returns `true` when an email was sent, `false` when skipped (missing data).
 */
export async function processStatusUpdateNotification(
  complaintId: string,
  userId: string,
  newStatus: string,
): Promise<boolean> {
  const [complaint, user] = await Promise.all([
    prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { ticketNumber: true, category: true, address: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    }),
  ]);

  if (!complaint || !user) {
    // eslint-disable-next-line no-console
    console.warn(
      `[handlers] status-update-notification skipped — missing complaint/user (complaint=${complaintId}, user=${userId}).`,
    );
    return false;
  }

  await sendComplaintStatusUpdateEmail({
    to: user.email,
    fullName: user.fullName,
    ticketNumber: complaint.ticketNumber,
    newStatus,
    category: complaint.category,
    address: complaint.address,
  });
  return true;
}

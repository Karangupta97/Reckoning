/**
 * SLA escalation service (Part 7).
 *
 * Drives the two-step escalation ladder when an SLA deadline is breached:
 *
 *   Level 0 → 1  Sub-District Admin missed their SLA.
 *                - mark complaint ESCALATED, escalationLevel=1, route to the
 *                  owning District; set a NEW district SLA by severity;
 *                - SIMULTANEOUSLY notify the sub-district admin (who missed it)
 *                  AND the district admin (who receives it), via push + SMS.
 *
 *   Level 1 → 2  District Admin missed their EXTENDED SLA.
 *                - escalate to SUPER_ADMIN; notify district + super admins;
 *                - raise an {@link AuditFlag} (DOUBLE_SLA_BREACH) so the
 *                  complaint surfaces on the public "Unresolved" list.
 *
 * The owning sub-district is resolved from the complaint's PostGIS point via
 * `ST_Within`; the district is the sub-district's parent. Notifications are
 * best-effort and never block the state transition.
 */

import type { SeverityLevel } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";
import { query } from "../../../config/db.js";
import {
  sendPushNotification,
  sendSms,
} from "../../../services/notification.service.js";

/**
 * Extended district SLA (in days) granted when a complaint escalates from a
 * sub-district to its district, keyed by severity.
 */
const DISTRICT_SLA_DAYS: Readonly<Record<SeverityLevel, number>> = {
  CRITICAL: 3,
  HIGH: 15,
  MEDIUM: 30,
  LOW: 45,
};

/** Milliseconds in a day. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Resolve the human-readable district SLA deadline for a severity. */
function districtDeadlineFor(severity: SeverityLevel, from: Date = new Date()): Date {
  return new Date(from.getTime() + DISTRICT_SLA_DAYS[severity] * DAY_MS);
}

/** The owning jurisdiction of a complaint (resolved via PostGIS). */
interface OwningJurisdiction {
  subDistrictId: string | null;
  subDistrictName: string | null;
  districtId: string | null;
}

/**
 * Resolve the sub-district (and its parent district) whose geofence contains
 * the complaint's location point.
 *
 * @param complaintId Complaint id.
 * @returns The owning sub-district + district ids/name (nulls when unmatched).
 */
async function resolveJurisdiction(
  complaintId: string,
): Promise<OwningJurisdiction> {
  const rows = await query<{
    sub_district_id: string;
    sub_district_name: string;
    district_id: string;
  }>(
    `SELECT sd.id AS sub_district_id, sd.name AS sub_district_name, sd."districtId" AS district_id
     FROM "complaints" AS c
     JOIN "sub_districts" AS sd
       ON sd.geofence IS NOT NULL
      AND c.location IS NOT NULL
      AND ST_Within(c.location::geometry, sd.geofence)
     WHERE c.id = $1
     LIMIT 1`,
    [complaintId],
  );
  const row = rows.rows[0];
  return {
    subDistrictId: row?.sub_district_id ?? null,
    subDistrictName: row?.sub_district_name ?? null,
    districtId: row?.district_id ?? null,
  };
}

/** Active admins for a jurisdiction scope, with contact details. */
interface AdminContact {
  id: string;
  fullName: string;
  phone: string | null;
}

/**
 * List ACTIVE admins of a given role within a jurisdiction.
 *
 * @param role          Admin role to fetch.
 * @param scope         Jurisdiction filter (districtId / subDistrictId).
 * @returns Matching active admin contacts.
 */
async function activeAdmins(
  role: "DISTRICT_ADMIN" | "SUB_DISTRICT_ADMIN" | "SUPER_ADMIN",
  scope: { districtId?: string | null; subDistrictId?: string | null },
): Promise<AdminContact[]> {
  return prisma.adminUser.findMany({
    where: {
      role,
      status: "ACTIVE",
      ...(scope.districtId ? { districtId: scope.districtId } : {}),
      ...(scope.subDistrictId ? { subDistrictId: scope.subDistrictId } : {}),
    },
    select: { id: true, fullName: true, phone: true },
  });
}

/** Notify a set of admins via push + SMS with the same title/body. */
async function notifyAll(
  admins: AdminContact[],
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<void> {
  await Promise.all(
    admins.flatMap((admin) => [
      sendPushNotification({ adminId: admin.id, title, body, data }),
      sendSms(admin.phone, `${title} — ${body}`),
    ]),
  );
}

/**
 * Process an SLA breach for a complaint, advancing it one escalation level.
 *
 * Idempotent-ish: it reads the current `escalationLevel` and only advances when
 * the complaint is not already in a terminal state. Re-running for an
 * already-escalated complaint advances to the next level only if its (new) SLA
 * has also lapsed — callers (the worker) decide cadence.
 *
 * @param complaintId Complaint whose SLA was breached.
 * @returns A short summary of the action taken.
 */
export async function processSlaEscalation(
  complaintId: string,
): Promise<{ action: string }> {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: {
      id: true,
      ticketNumber: true,
      category: true,
      severity: true,
      status: true,
      escalationLevel: true,
      deletedAt: true,
    },
  });

  if (!complaint || complaint.deletedAt) {
    return { action: "skipped:not-found" };
  }
  if (complaint.status === "RESOLVED" || complaint.status === "REJECTED") {
    return { action: "skipped:terminal" };
  }

  const jurisdiction = await resolveJurisdiction(complaintId);

  // ---- Level 0 → 1: sub-district missed SLA, escalate to district ----------
  if (complaint.escalationLevel < 1) {
    if (!jurisdiction.districtId) {
      return { action: "skipped:no-district" };
    }
    const newDeadline = districtDeadlineFor(complaint.severity);

    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        escalationLevel: 1,
        status: "ESCALATED",
        escalatedAt: new Date(),
        escalatedToDistrictId: jurisdiction.districtId,
        escalationReason: "SLA_BREACH_SUB_DISTRICT",
        slaDeadline: newDeadline,
      },
    });

    const [subAdmins, districtAdmins] = await Promise.all([
      jurisdiction.subDistrictId
        ? activeAdmins("SUB_DISTRICT_ADMIN", { subDistrictId: jurisdiction.subDistrictId })
        : Promise.resolve([] as AdminContact[]),
      activeAdmins("DISTRICT_ADMIN", { districtId: jurisdiction.districtId }),
    ]);

    const ticket = complaint.ticketNumber;
    const data = { complaintId, ticketNumber: ticket, escalationLevel: "1" };

    await Promise.all([
      notifyAll(
        subAdmins,
        "\u26A0\uFE0F SLA Breached — Ticket Escalated",
        `Ticket #${ticket} has been escalated to your District Admin due to missed deadline.`,
        data,
      ),
      notifyAll(
        districtAdmins,
        "\uD83D\uDD3A Escalation Received",
        `Ticket #${ticket} (${complaint.category}, ${complaint.severity}) from ` +
          `${jurisdiction.subDistrictName ?? "a sub-district"} missed its SLA deadline. ` +
          `New deadline: ${newDeadline.toISOString()}.`,
        data,
      ),
    ]);

    return { action: "escalated:district" };
  }

  // ---- Level 1 → 2: district missed extended SLA, escalate to super --------
  if (complaint.escalationLevel < 2) {
    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        escalationLevel: 2,
        status: "ESCALATED",
        escalatedAt: new Date(),
        escalationReason: "SLA_BREACH_DISTRICT",
      },
    });

    // Audit flag → drives the public "Unresolved" list + accountability.
    await prisma.auditFlag.create({
      data: {
        complaintId,
        districtId: jurisdiction.districtId,
        subDistrictId: jurisdiction.subDistrictId,
        reason: "DOUBLE_SLA_BREACH",
      },
    });

    const [districtAdmins, superAdmins] = await Promise.all([
      jurisdiction.districtId
        ? activeAdmins("DISTRICT_ADMIN", { districtId: jurisdiction.districtId })
        : Promise.resolve([] as AdminContact[]),
      activeAdmins("SUPER_ADMIN", {}),
    ]);

    const ticket = complaint.ticketNumber;
    const data = { complaintId, ticketNumber: ticket, escalationLevel: "2" };

    await Promise.all([
      notifyAll(
        districtAdmins,
        "\u26A0\uFE0F SLA Breached — Escalated to Super Admin",
        `Ticket #${ticket} has been escalated to the Super Admin due to a missed district deadline.`,
        data,
      ),
      notifyAll(
        superAdmins,
        "\uD83D\uDD3A Escalation Received (District SLA Breach)",
        `Ticket #${ticket} (${complaint.category}, ${complaint.severity}) breached its ` +
          `district SLA and has been flagged as Unresolved.`,
        data,
      ),
    ]);

    return { action: "escalated:super" };
  }

  return { action: "skipped:max-level" };
}

/**
 * Scan for complaints whose SLA deadline has lapsed and escalate each one.
 *
 * Intended to be invoked on a schedule by the SLA worker. Selects non-terminal
 * complaints with a `slaDeadline` in the past and an escalation level below the
 * ceiling, then processes them one by one.
 *
 * @param now Reference time (defaults to now); injectable for tests.
 * @returns The number of complaints escalated.
 */
export async function scanAndEscalateBreaches(
  now: Date = new Date(),
): Promise<number> {
  const due = await prisma.complaint.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["RESOLVED", "REJECTED"] },
      escalationLevel: { lt: 2 },
      slaDeadline: { lt: now },
    },
    select: { id: true },
    take: 200,
  });

  let escalated = 0;
  for (const c of due) {
    const { action } = await processSlaEscalation(c.id);
    if (action.startsWith("escalated")) escalated += 1;
  }
  return escalated;
}

/**
 * SLA Engine — scheduled BullMQ worker.
 *
 * Runs every hour as a repeatable job, performing three sequential checks:
 *   1. **Warning notifications** — alert admins about approaching SLA deadlines.
 *   2. **Auto-escalation** — escalate breached tickets to the next tier.
 *   3. **Max escalation alert** — flag tickets that have breached all SLA levels.
 *
 * Concurrency is locked to 1 so only one SLA check runs at any time.
 *
 * Run standalone: `tsx src/workers/slaEngine.worker.ts`
 * (or via the worker registry in `src/workers/index.ts`).
 */

import { Worker, Queue } from "bullmq";
import { prisma } from "../config/prisma.js";
import {
  connection,
  QUEUE_NAMES,
  notificationUserQueue,
} from "../jobs/queues.js";
import {
  getWarningThreshold,
  getEscalatedSlaDeadline,
  getSuperAdminSlaDeadline,
  getDaysRemaining,
} from "../utils/sla.js";
import { logger } from "../utils/logger.js";
import type { SeverityLevel, TicketStatus } from "@prisma/client";

// ─── Constants ───────────────────────────────────────────────────────────────

/** How often the SLA engine runs (1 hour). */
const REPEAT_INTERVAL_MS = 60 * 60 * 1000;

/** Unique job ID to prevent duplicate scheduled jobs. */
const JOB_ID = "sla-engine-cron";

/** Statuses eligible for SLA checks (not resolved/rejected). */
const ACTIVE_STATUSES: TicketStatus[] = ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"];

// ─── Notification Helpers ────────────────────────────────────────────────────

/** Shape of the notification payload pushed to the notification-user queue. */
interface SlaNotificationPayload {
  type: string;
  ticketId: string;
  ticketNumber: string;
  priority: SeverityLevel;
  [key: string]: unknown;
}

/**
 * Push a notification job to the notification-user queue (fire and forget).
 *
 * @param payload Notification data.
 */
async function pushNotification(payload: SlaNotificationPayload): Promise<void> {
  if (!notificationUserQueue) return;
  try {
    await notificationUserQueue.add(QUEUE_NAMES.notificationUser, payload);
  } catch (error) {
    logger.error("Failed to push SLA notification", {
      type: payload.type,
      ticketId: payload.ticketId,
      error: String(error),
    });
  }
}

// ─── CHECK 1: Warning Notifications ─────────────────────────────────────────

/**
 * Find tickets approaching their SLA deadline and send warning notifications.
 *
 * Thresholds by priority:
 * - CRITICAL: 2 days before
 * - HIGH: 5 days before
 * - MEDIUM: 10 days before
 * - LOW: 10 days before
 *
 * @param now Reference time.
 * @returns Number of warnings sent.
 */
async function checkWarnings(now: Date): Promise<number> {
  const priorities: SeverityLevel[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  let totalWarned = 0;

  for (const priority of priorities) {
    const thresholdMs = getWarningThreshold(priority);
    const warningCutoff = new Date(now.getTime() + thresholdMs);

    const tickets = await prisma.ticket.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        priority,
        slaWarningNotifiedAt: null,
        slaDeadline: {
          lte: warningCutoff,
          gt: now,
        },
      },
      select: {
        id: true,
        ticketNumber: true,
        priority: true,
        slaDeadline: true,
        assignedAdminId: true,
        districtId: true,
      },
    });

    for (const ticket of tickets) {
      const daysRemaining = getDaysRemaining(ticket.slaDeadline, now);

      // Fetch the district admin for the notification
      let districtAdminId: string | null = null;
      if (ticket.districtId) {
        const districtAdmin = await prisma.adminUser.findFirst({
          where: {
            districtId: ticket.districtId,
            role: "DISTRICT_ADMIN",
            isActive: true,
          },
          select: { id: true },
        });
        districtAdminId = districtAdmin?.id ?? null;
      }

      await pushNotification({
        type: "SLA_WARNING",
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        priority: ticket.priority,
        slaDeadline: ticket.slaDeadline.toISOString(),
        daysRemaining,
        subDistrictAdminId: ticket.assignedAdminId,
        districtAdminId,
      });

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { slaWarningNotifiedAt: now },
      });

      totalWarned++;
    }
  }

  if (totalWarned > 0) {
    logger.info(`SLA Engine CHECK 1: Sent ${totalWarned} warning notification(s).`);
  }

  return totalWarned;
}

// ─── CHECK 2: Auto-Escalation (SLA Breached) ────────────────────────────────

/**
 * Find tickets that have breached their SLA deadline and escalate them.
 *
 * Level 0 → 1: Sub-district missed SLA → reassign to District Admin.
 * Level 1 → 2: District Admin missed SLA → reassign to Super Admin.
 *
 * @param now Reference time.
 * @returns Number of tickets escalated.
 */
async function checkEscalations(now: Date): Promise<number> {
  const breachedTickets = await prisma.ticket.findMany({
    where: {
      status: { in: ACTIVE_STATUSES },
      slaDeadline: { lt: now },
      escalationLevel: { lt: 2 },
    },
    select: {
      id: true,
      ticketNumber: true,
      complaintId: true,
      priority: true,
      escalationLevel: true,
      assignedAdminId: true,
      subDistrictId: true,
      districtId: true,
    },
  });

  let escalated = 0;

  for (const ticket of breachedTickets) {
    try {
      if (ticket.escalationLevel === 0) {
        await escalateToDistrict(ticket, now);
        escalated++;
      } else if (ticket.escalationLevel === 1) {
        await escalateToSuperAdmin(ticket, now);
        escalated++;
      }
    } catch (error) {
      logger.error(`SLA Engine CHECK 2: Failed to escalate ticket ${ticket.ticketNumber}`, {
        ticketId: ticket.id,
        escalationLevel: ticket.escalationLevel,
        error: String(error),
      });
    }
  }

  if (escalated > 0) {
    logger.info(`SLA Engine CHECK 2: Escalated ${escalated} ticket(s).`);
  }

  return escalated;
}

/** Ticket shape returned by the CHECK 2 query. */
interface BreachedTicket {
  id: string;
  ticketNumber: string;
  complaintId: string;
  priority: SeverityLevel;
  escalationLevel: number;
  assignedAdminId: string | null;
  subDistrictId: string | null;
  districtId: string | null;
}

/**
 * Escalate a ticket from Level 0 to Level 1 (sub-district → district).
 *
 * @param ticket  The breached ticket record.
 * @param now     Reference time.
 */
async function escalateToDistrict(ticket: BreachedTicket, now: Date): Promise<void> {
  // Find the District Admin
  const districtAdmin = await prisma.adminUser.findFirst({
    where: {
      districtId: ticket.districtId,
      role: "DISTRICT_ADMIN",
      isActive: true,
    },
    select: { id: true },
  });

  if (!districtAdmin) {
    logger.warn(
      `SLA Engine: No active District Admin found for ticket ${ticket.ticketNumber} (districtId=${ticket.districtId}). Skipping escalation.`,
    );
    return;
  }

  const newDeadline = getEscalatedSlaDeadline(ticket.priority, now);

  // Prisma transaction: update ticket + complaint + status history
  await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        escalationLevel: 1,
        status: "ESCALATED",
        escalatedAt: now,
        previousAdminId: ticket.assignedAdminId,
        assignedAdminId: districtAdmin.id,
        slaDeadline: newDeadline,
        slaWarningNotifiedAt: null,
      },
    });

    await tx.complaint.update({
      where: { id: ticket.complaintId },
      data: { status: "ESCALATED" },
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        status: "ESCALATED",
        changedById: "SYSTEM",
        note: `SLA breached at Level 0. Escalated to District Admin (${districtAdmin.id}). New deadline: ${newDeadline.toISOString()}.`,
      },
    });
  });

  // Single notification with both recipients
  await pushNotification({
    type: "SLA_ESCALATED_LEVEL_1",
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    priority: ticket.priority,
    newSlaDeadline: newDeadline.toISOString(),
    subDistrictAdminId: ticket.assignedAdminId,
    districtAdminId: districtAdmin.id,
  });
}

/**
 * Escalate a ticket from Level 1 to Level 2 (district → super admin).
 *
 * @param ticket  The breached ticket record.
 * @param now     Reference time.
 */
async function escalateToSuperAdmin(ticket: BreachedTicket, now: Date): Promise<void> {
  // Find a Super Admin
  const superAdmin = await prisma.adminUser.findFirst({
    where: {
      role: "SUPER_ADMIN",
      isActive: true,
    },
    select: { id: true },
  });

  if (!superAdmin) {
    logger.warn(
      `SLA Engine: No active Super Admin found for ticket ${ticket.ticketNumber}. Skipping escalation.`,
    );
    return;
  }

  const newDeadline = getSuperAdminSlaDeadline(now);

  // Prisma transaction: update ticket + create audit flag + status history
  await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        escalationLevel: 2,
        status: "ESCALATED",
        escalatedAt: now,
        previousAdminId: ticket.assignedAdminId,
        assignedAdminId: superAdmin.id,
        slaDeadline: newDeadline,
        slaWarningNotifiedAt: null,
      },
    });

    await tx.auditFlag.create({
      data: {
        complaintId: ticket.complaintId,
        districtId: ticket.districtId,
        subDistrictId: ticket.subDistrictId,
        reason: "DOUBLE_SLA_BREACH",
      },
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        status: "ESCALATED",
        changedById: "SYSTEM",
        note: `SLA breached at Level 1. Escalated to Super Admin (${superAdmin.id}). Audit flag raised: DOUBLE_SLA_BREACH.`,
      },
    });
  });

  // Notification
  await pushNotification({
    type: "SLA_ESCALATED_LEVEL_2",
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    priority: ticket.priority,
    districtAdminId: ticket.assignedAdminId,
    superAdminId: superAdmin.id,
  });
}

// ─── CHECK 3: Max Escalation Alert ──────────────────────────────────────────

/**
 * Find tickets at max escalation (Level 2) that have breached again.
 *
 * No further escalation occurs — only an audit flag upsert + notification +
 * error log to draw immediate human attention.
 *
 * @param now Reference time.
 * @returns Number of max-escalation alerts sent.
 */
async function checkMaxEscalation(now: Date): Promise<number> {
  const maxEscalatedTickets = await prisma.ticket.findMany({
    where: {
      escalationLevel: 2,
      slaDeadline: { lt: now },
      status: { notIn: ["RESOLVED", "REJECTED"] },
    },
    select: {
      id: true,
      ticketNumber: true,
      complaintId: true,
      priority: true,
      assignedAdminId: true,
      districtId: true,
      subDistrictId: true,
    },
  });

  let alertCount = 0;

  for (const ticket of maxEscalatedTickets) {
    try {
      // Keep status ESCALATED (no further escalation possible)
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: "ESCALATED" },
      });

      // Upsert audit flag
      const existingFlag = await prisma.auditFlag.findFirst({
        where: {
          complaintId: ticket.complaintId,
          reason: "MAX_ESCALATION_REACHED",
        },
      });

      if (!existingFlag) {
        await prisma.auditFlag.create({
          data: {
            complaintId: ticket.complaintId,
            districtId: ticket.districtId,
            subDistrictId: ticket.subDistrictId,
            reason: "MAX_ESCALATION_REACHED",
          },
        });
      }

      // Notification
      await pushNotification({
        type: "MAX_ESCALATION_REACHED",
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        priority: ticket.priority,
        superAdminId: ticket.assignedAdminId,
      });

      logger.error(
        `MAX ESCALATION: ticket ${ticket.ticketNumber} has breached all SLA levels`,
        { ticketId: ticket.id, complaintId: ticket.complaintId },
      );

      alertCount++;
    } catch (error) {
      logger.error(`SLA Engine CHECK 3: Failed to process ticket ${ticket.ticketNumber}`, {
        ticketId: ticket.id,
        error: String(error),
      });
    }
  }

  if (alertCount > 0) {
    logger.info(`SLA Engine CHECK 3: Sent ${alertCount} max-escalation alert(s).`);
  }

  return alertCount;
}

// ─── Main Job Processor ──────────────────────────────────────────────────────

/**
 * Main SLA Engine job processor. Runs all three checks sequentially.
 *
 * Each check is wrapped independently — a failure in one does NOT block the others.
 */
async function processSlaEngineJob(): Promise<void> {
  const now = new Date();
  logger.info("SLA Engine: Starting scheduled run.", { timestamp: now.toISOString() });

  // CHECK 1 — Warning Notifications
  try {
    await checkWarnings(now);
  } catch (error) {
    logger.error("SLA Engine CHECK 1 (warnings) failed.", { error: String(error) });
  }

  // CHECK 2 — Auto-Escalation
  try {
    await checkEscalations(now);
  } catch (error) {
    logger.error("SLA Engine CHECK 2 (escalations) failed.", { error: String(error) });
  }

  // CHECK 3 — Max Escalation Alert
  try {
    await checkMaxEscalation(now);
  } catch (error) {
    logger.error("SLA Engine CHECK 3 (max escalation) failed.", { error: String(error) });
  }

  logger.info("SLA Engine: Scheduled run complete.");
}

// ─── Worker Bootstrap ────────────────────────────────────────────────────────

/**
 * Start the SLA Engine BullMQ worker and register the repeatable cron job.
 *
 * - Queue: `sla-engine`
 * - Repeat: every 1 hour
 * - Concurrency: 1 (never run two SLA checks simultaneously)
 * - Attempts: 1 (cron jobs don't retry — next run in 1 hour)
 *
 * @returns The running {@link Worker}, or `null` when Redis is unconfigured.
 */
export function startSlaEngineWorker(): Worker | null {
  if (!connection) {
    logger.warn("SLA Engine: REDIS_URL not set — worker not started.");
    return null;
  }

  // Create a dedicated queue instance for registering the repeatable job.
  const slaEngineQueue = new Queue(QUEUE_NAMES.slaEngine, { connection });

  // Register the repeatable job (idempotent — BullMQ deduplicates by jobId).
  void slaEngineQueue.upsertJobScheduler(
    JOB_ID,
    { every: REPEAT_INTERVAL_MS },
    {
      name: "sla-engine-check",
      opts: {
        attempts: 1,
        removeOnComplete: { age: 24 * 3600, count: 24 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    },
  ).then(() => {
    logger.info("SLA Engine: Repeatable job registered (every 1 hour).");
  }).catch((error) => {
    logger.error("SLA Engine: Failed to register repeatable job.", { error: String(error) });
  });

  const worker = new Worker(
    QUEUE_NAMES.slaEngine,
    async () => {
      await processSlaEngineJob();
    },
    {
      connection,
      concurrency: 1,
    },
  );

  worker.on("completed", (job) => {
    logger.debug(`SLA Engine: Job ${job.id} completed.`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`SLA Engine: Job ${job?.id} failed.`, { error: err.message });
  });

  logger.info("SLA Engine: Worker started (concurrency: 1, interval: 1h).");
  return worker;
}

// Allow running this module directly as a standalone worker process.
const scriptPath = `file://${process.argv[1]}`;
const isDirectRun =
  import.meta.url === scriptPath ||
  import.meta.url === `file://${encodeURI(process.argv[1]!)}` ||
  import.meta.url.replace(/%20/g, " ") === scriptPath;

if (isDirectRun) {
  startSlaEngineWorker();
}

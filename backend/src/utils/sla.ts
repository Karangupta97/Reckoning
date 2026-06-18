/**
 * SLA (Service Level Agreement) utilities for ticket deadline computation.
 *
 * Provides deterministic deadline calculation from severity, warning thresholds
 * for approaching deadlines, and escalated SLA deadlines for each tier.
 */

import type { SeverityLevel } from "@prisma/client";

/** Milliseconds in one day. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** SLA durations in days, keyed by severity. */
const SLA_DAYS: Record<SeverityLevel, number> = {
  CRITICAL: 7,
  HIGH: 30,
  MEDIUM: 60,
  LOW: 90,
};

/**
 * Warning threshold in days before SLA deadline, keyed by severity.
 * A warning notification is sent this many days before the deadline.
 */
const WARNING_THRESHOLD_DAYS: Record<SeverityLevel, number> = {
  CRITICAL: 2,
  HIGH: 5,
  MEDIUM: 10,
  LOW: 10,
};

/**
 * Escalated SLA deadlines in days when a ticket is escalated from
 * sub-district to district (Level 0 → 1), keyed by severity.
 */
const ESCALATED_SLA_DAYS: Record<SeverityLevel, number> = {
  CRITICAL: 3,
  HIGH: 15,
  MEDIUM: 30,
  LOW: 45,
};

/**
 * Fixed SLA extension in days when a ticket is escalated from
 * district to super admin (Level 1 → 2). Same for all priorities.
 */
const SUPER_ADMIN_SLA_DAYS = 7;

/**
 * Compute the SLA deadline for a given severity level.
 *
 * @param severity Severity of the complaint / ticket.
 * @param from     Reference point (defaults to now).
 * @returns The absolute deadline as a `Date`.
 */
export function getSlaDeadline(
  severity: SeverityLevel,
  from: Date = new Date(),
): Date {
  const days = SLA_DAYS[severity];
  const deadline = new Date(from);
  deadline.setDate(deadline.getDate() + days);
  return deadline;
}

/**
 * Compute the number of days remaining until a deadline.
 *
 * Returns 0 when the deadline has already passed.
 *
 * @param deadline  The SLA deadline.
 * @param from      Reference point (defaults to now).
 * @returns Remaining days (integer, floored), minimum 0.
 */
export function getDaysRemaining(
  deadline: Date,
  from: Date = new Date(),
): number {
  const diff = deadline.getTime() - from.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get the warning threshold duration in milliseconds for a priority level.
 *
 * The warning is fired when `slaDeadline - threshold <= now < slaDeadline`.
 *
 * @param priority The ticket priority / severity.
 * @returns Warning threshold in milliseconds.
 */
export function getWarningThreshold(priority: SeverityLevel): number {
  return WARNING_THRESHOLD_DAYS[priority] * DAY_MS;
}

/**
 * Compute a new SLA deadline for an escalated ticket (Level 0 → 1).
 *
 * Used when a sub-district admin misses the SLA and the ticket is reassigned
 * to the district admin.
 *
 * @param priority The ticket priority / severity.
 * @param from     Reference point (defaults to now).
 * @returns The new absolute SLA deadline.
 */
export function getEscalatedSlaDeadline(
  priority: SeverityLevel,
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + ESCALATED_SLA_DAYS[priority] * DAY_MS);
}

/**
 * Compute the fixed SLA deadline for a Level 1 → 2 escalation (to super admin).
 *
 * Always 7 days regardless of priority.
 *
 * @param from Reference point (defaults to now).
 * @returns The new absolute SLA deadline.
 */
export function getSuperAdminSlaDeadline(from: Date = new Date()): Date {
  return new Date(from.getTime() + SUPER_ADMIN_SLA_DAYS * DAY_MS);
}

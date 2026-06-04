/**
 * SLA (Service Level Agreement) utilities for ticket deadline computation.
 *
 * Provides deterministic deadline calculation from severity and a helper to
 * compute remaining days until a deadline from a reference point.
 */

import type { SeverityLevel } from "@prisma/client";

/** SLA durations in days, keyed by severity. */
const SLA_DAYS: Record<SeverityLevel, number> = {
  CRITICAL: 7,
  HIGH: 30,
  MEDIUM: 60,
  LOW: 90,
};

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

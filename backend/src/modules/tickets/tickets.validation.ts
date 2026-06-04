/**
 * Zod validation schemas for the tickets module.
 *
 * Defines body, query, and param schemas consumed by the `validate` middleware.
 */

import { z } from "zod";

/** Valid ticket statuses for filtering. */
const ticketStatusEnum = z.enum([
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
  "UNASSIGNED",
  "ESCALATED",
]);

/** Valid severity levels for filtering. */
const severityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

/** Query params for GET /api/tickets (Sub-District Admin). */
export const listTicketsQuerySchema = z.object({
  status: ticketStatusEnum.optional(),
  priority: severityEnum.optional(),
  page: z
    .string()
    .regex(/^\d+$/)
    .transform((v) => Math.max(1, Number.parseInt(v, 10)))
    .default("1"),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform((v) => Math.min(100, Math.max(1, Number.parseInt(v, 10))))
    .default("20"),
});

/** Query params for GET /api/admin/tickets (Super Admin). */
export const superAdminListTicketsQuerySchema = z.object({
  status: ticketStatusEnum.optional(),
  priority: severityEnum.optional(),
  subDistrictId: z.string().min(1).optional(),
  districtId: z.string().min(1).optional(),
  page: z
    .string()
    .regex(/^\d+$/)
    .transform((v) => Math.max(1, Number.parseInt(v, 10)))
    .default("1"),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform((v) => Math.min(100, Math.max(1, Number.parseInt(v, 10))))
    .default("20"),
});

/** Path param for ticket-specific routes. */
export const ticketIdParamSchema = z.object({
  id: z.string().min(1, "Ticket id is required"),
});

/** Path param for complaint ticket citizen endpoint. */
export const complaintIdParamSchema = z.object({
  id: z.string().min(1, "Complaint id is required"),
});

/** Allowed status transitions (from → to[]). */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  OPEN: ["ACKNOWLEDGED"],
  ACKNOWLEDGED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED", "REJECTED"],
};

/** Body for PATCH /api/tickets/:id/status. */
export const updateTicketStatusSchema = z
  .object({
    status: ticketStatusEnum,
    note: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      // REJECTED requires a note (rejection reason)
      if (data.status === "REJECTED" && (!data.note || data.note.trim().length === 0)) {
        return false;
      }
      return true;
    },
    { message: "A rejection reason (note) is required when rejecting a ticket", path: ["note"] },
  );

/** Body for POST /api/tickets/:id/notes. */
export const createTicketNoteSchema = z.object({
  content: z
    .string()
    .min(1, "Note content is required")
    .max(1000, "Note content must not exceed 1000 characters"),
});

export { ALLOWED_TRANSITIONS };

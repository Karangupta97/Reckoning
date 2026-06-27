/**
 * Zod schemas for the admin management endpoints (Part 5).
 *
 * Covers pagination/list queries, the `:id` path param, suspend/reactivate
 * actions, ticket-status updates, and resolution notes. Free text is
 * HTML-stripped to prevent stored XSS.
 */

import { z } from "zod";
import { AdminRole, ComplaintStatus } from "@prisma/client";
import sanitizeHtml from "sanitize-html";

/**
 * Remove ALL HTML/markup from a string, leaving plain text.
 *
 * @param value Raw user input.
 * @returns Sanitised, tag-free, trimmed text.
 */
function stripHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  }).trim();
}

/** Generic `:id` path-param schema (cuid-shaped, kept permissive). */
export const idParamSchema = z
  .object({
    id: z.string().trim().min(1, "id is required."),
  })
  .strict();

/** `GET /api/admin/admins` list query — pagination + optional filters. */
export const listAdminsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    role: z.nativeEnum(AdminRole).optional(),
    status: z
      .enum(["PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"])
      .optional(),
    search: z
      .string()
      .trim()
      .max(120)
      .transform(stripHtml)
      .optional(),
  })
  .strict();

/** Generic paginated list query (page + limit only). */
export const paginationQuerySchema = z
  .object({
    page:   z.coerce.number().int().min(1).default(1),
    limit:  z.coerce.number().int().min(1).max(100).default(20),
    // Allow an optional status filter (used by GET /my-district/escalations)
    status: z.string().optional(),
  })
  .passthrough(); // allow other query params without rejecting

/** `PATCH /tickets/:id/status` body schema — sub-district status transitions. */
export const updateTicketStatusSchema = z
  .object({
    status: z.nativeEnum(ComplaintStatus, { message: "Invalid status." }),
    note: z
      .string()
      .trim()
      .max(1000, "Note must be at most 1000 characters.")
      .transform(stripHtml)
      .optional(),
  })
  .strict();

/** `POST /tickets/:id/notes` body schema — resolution note. */
export const addNoteSchema = z
  .object({
    note: z
      .string()
      .trim()
      .min(1, "A note is required.")
      .max(2000, "Note must be at most 2000 characters.")
      .transform(stripHtml)
      .pipe(z.string().min(1, "A note is required.")),
    /** Optionally resolve/reject the ticket in the same action. */
    status: z
      .enum(["RESOLVED", "REJECTED", "IN_PROGRESS"])
      .optional(),
  })
  .strict();

/** Inferred type for the list-admins query. */
export type ListAdminsQuery = z.infer<typeof listAdminsQuerySchema>;
/** Inferred type for the generic pagination query. */
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
/** Inferred type for the update-ticket-status body. */
export type UpdateTicketStatusBody = z.infer<typeof updateTicketStatusSchema>;
/** Inferred type for the add-note body. */
export type AddNoteBody = z.infer<typeof addNoteSchema>;

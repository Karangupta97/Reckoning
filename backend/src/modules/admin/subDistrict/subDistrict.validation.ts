/**
 * Zod schemas for the Sub-District onboarding endpoints.
 *
 * Reuses the shared government-email, phone, password, geofence, and clean-text
 * rules from the district validation module so both invite flows stay
 * consistent. The geofence containment check (ST_Within) is enforced in the
 * service, not here (it needs the DB).
 */

import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import {
  geofenceSchema,
  govEmailSchema,
  phoneSchema,
  strongPasswordSchema,
} from "../district/district.validation.js";

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

/** A trimmed, HTML-stripped string between `min` and `max` characters. */
function cleanText(min: number, max: number, label: string) {
  return z
    .string()
    .trim()
    .transform(stripHtml)
    .pipe(
      z
        .string()
        .min(min, `${label} must be at least ${min} characters.`)
        .max(max, `${label} must be at most ${max} characters.`),
    );
}

/** `POST /api/admin/sub-district/invite` body schema. */
export const subDistrictInviteSchema = z
  .object({
    fullName: cleanText(2, 80, "Full name"),
    email: govEmailSchema,
    phone: phoneSchema,
    designation: cleanText(2, 120, "Designation"),
    department: cleanText(2, 120, "Department"),
    subDistrictName: cleanText(2, 120, "Sub-district name"),
    geofence: geofenceSchema,
  })
  .strict();

/** A raw invite/activation token (UUID-shaped, kept permissive). */
const tokenSchema = z
  .string()
  .trim()
  .min(20, "A valid activation token is required.")
  .max(200, "Activation token is too long.");

/** `POST /api/admin/sub-district/activate` body schema. */
export const subDistrictActivateSchema = z
  .object({
    token: tokenSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/** Inferred type for the sub-district invite body. */
export type SubDistrictInviteBody = z.infer<typeof subDistrictInviteSchema>;
/** Inferred type for the sub-district activate body. */
export type SubDistrictActivateBody = z.infer<typeof subDistrictActivateSchema>;

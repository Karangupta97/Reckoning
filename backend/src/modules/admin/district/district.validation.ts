/**
 * Zod schemas for the District onboarding endpoints.
 *
 * Strict validation of the invite payload (government email enforced via
 * {@link isGovEmail}, E.164 phone, GeoJSON Polygon geofence), the token-based
 * activation payload (strong password + confirmation), and resend.
 */

import { z } from "zod";
import { Country } from "@prisma/client";
import sanitizeHtml from "sanitize-html";
import { isGovEmail } from "../../../utils/govEmail.js";
import { isGeoJsonPolygon } from "../geofence.js";

/**
 * Remove ALL HTML/markup from a string, leaving plain text. Used on free-text
 * fields (name, designation, department, district name) to prevent stored XSS.
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

/** Government email: normalised, valid, and not a personal webmail provider. */
export const govEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .max(254, "Email is too long.")
  .refine(isGovEmail, {
    message:
      "Use an official government email address (personal providers are not allowed).",
  });

/** E.164 phone number, e.g. `+919876543210`. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Phone must be in E.164 format, e.g. +919876543210.");

/**
 * Strong-password rule: 10+ chars with at least one uppercase letter, one
 * digit, and one special character.
 */
export const strongPasswordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .max(128, "Password must be at most 128 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

/** A GeoJSON Polygon geofence (structural check; PostGIS validates geometry). */
export const geofenceSchema = z
  .unknown()
  .refine(isGeoJsonPolygon, {
    message: "geofence must be a closed GeoJSON Polygon (SRID 4326).",
  });

/** `POST /api/admin/district/invite` body schema. */
export const districtInviteSchema = z
  .object({
    fullName: cleanText(2, 80, "Full name"),
    email: govEmailSchema,
    phone: phoneSchema,
    designation: cleanText(2, 120, "Designation"),
    department: cleanText(2, 120, "Department"),
    country: z.nativeEnum(Country, { message: "Country must be a BIMSTEC member state." }),
    districtName: cleanText(2, 120, "District name"),
    geofence: geofenceSchema,
  })
  .strict();

/** A raw invite/activation token (UUID-shaped, kept permissive). */
const tokenSchema = z
  .string()
  .trim()
  .min(20, "A valid activation token is required.")
  .max(200, "Activation token is too long.");

/** `POST /api/admin/district/activate` body schema. */
export const districtActivateSchema = z
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

/** `POST /api/admin/district/resend-invite` body schema. */
export const districtResendSchema = z
  .object({
    adminId: z.string().trim().min(1, "adminId is required."),
  })
  .strict();

/** Inferred type for the district invite body. */
export type DistrictInviteBody = z.infer<typeof districtInviteSchema>;
/** Inferred type for the district activate body. */
export type DistrictActivateBody = z.infer<typeof districtActivateSchema>;
/** Inferred type for the district resend body. */
export type DistrictResendBody = z.infer<typeof districtResendSchema>;

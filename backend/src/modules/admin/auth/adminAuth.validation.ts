/**
 * Zod schemas for the admin auth endpoints (login / refresh / logout).
 *
 * These mirror the citizen auth schemas but live in the admin realm. Login
 * deliberately avoids strong-password regex so all failures look identical
 * (no format leak — see {@link loginPasswordSchema}).
 */

import { z } from "zod";

/** Normalised email: trimmed + lower-cased for consistent uniqueness checks. */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .max(254, "Email is too long.");

/**
 * Login password: only required to be non-empty. The registration strength
 * rules are NOT applied — a strength failure would leak that the value isn't
 * even a valid password format, and all auth failures must look identical.
 */
const loginPasswordSchema = z
  .string()
  .min(1, "Password is required.")
  .max(128, "Password is too long.");

/** A refresh-token JWT string. */
const refreshTokenSchema = z
  .string()
  .trim()
  .min(20, "A valid refresh token is required.")
  .max(4096, "Refresh token is too long.");

/** `POST /api/admin/auth/login` body schema. */
export const adminLoginSchema = z
  .object({
    email: emailSchema,
    password: loginPasswordSchema,
  })
  .strict();

/** `POST /api/admin/auth/refresh` body schema. */
export const adminRefreshSchema = z
  .object({
    refreshToken: refreshTokenSchema,
  })
  .strict();

/**
 * `POST /api/admin/auth/logout` body schema.
 *
 * Either `refreshToken` (log out one device) or `allDevices: true` (log out
 * everywhere). Both optional; with neither, logout is a no-op success.
 */
export const adminLogoutSchema = z
  .object({
    refreshToken: refreshTokenSchema.optional(),
    allDevices: z.boolean().optional(),
  })
  .strict();

/** Inferred type for the admin login body. */
export type AdminLoginBody = z.infer<typeof adminLoginSchema>;
/** Inferred type for the admin refresh body. */
export type AdminRefreshBody = z.infer<typeof adminRefreshSchema>;
/** Inferred type for the admin logout body. */
export type AdminLogoutBody = z.infer<typeof adminLogoutSchema>;

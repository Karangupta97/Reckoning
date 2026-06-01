/**
 * Zod schemas for the auth endpoints.
 *
 * These are the single source of truth for request validation. The
 * {@link validate} middleware runs them and converts failures into
 * field-level 400 responses. Inferred types are exported for reuse.
 */

import { z } from "zod";

/** BIMSTEC member countries accepted at registration. */
export const COUNTRY_VALUES = [
  "INDIA",
  "BANGLADESH",
  "NEPAL",
  "SRI_LANKA",
  "MYANMAR",
  "THAILAND",
  "BHUTAN",
] as const;

/** Normalised email: trimmed + lower-cased for consistent uniqueness checks. */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .max(254, "Email is too long.");

/**
 * Strong-password rule: 8+ chars with at least one uppercase letter, one
 * digit, and one special character.
 */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be at most 128 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

/** Display name: 2–80 characters after trimming. */
const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters.")
  .max(80, "Full name must be at most 80 characters.");

/** Six-digit numeric OTP. */
const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "OTP must be exactly 6 digits.");

/** Login email: normalised but NOT subjected to the strong-password regex. */
const loginEmailSchema = emailSchema;

/**
 * Login password: only required to be non-empty. We deliberately do NOT apply
 * the registration strength rules here — failing strength checks would leak
 * that the supplied value isn't even a valid password format, and all auth
 * failures must look identical ("Invalid email or password").
 */
const loginPasswordSchema = z
  .string()
  .min(1, "Password is required.")
  .max(128, "Password is too long.");

/** Optional device metadata captured at login for session auditing. */
const deviceInfoSchema = z
  .object({
    userAgent: z.string().max(512).optional(),
    platform: z.string().max(128).optional(),
    timezone: z.string().max(128).optional(),
  })
  .strict();

/** A refresh-token JWT string. */
const refreshTokenSchema = z
  .string()
  .trim()
  .min(20, "A valid refresh token is required.")
  .max(4096, "Refresh token is too long.");

/** `POST /api/auth/register` body schema. */
export const registerSchema = z
  .object({
    country: z.enum(COUNTRY_VALUES, {
      message: "Country must be a valid BIMSTEC member state.",
    }),
    email: emailSchema,
    password: passwordSchema,
    fullName: fullNameSchema,
  })
  .strict();

/** `POST /api/auth/verify-otp` body schema. */
export const verifyOtpSchema = z
  .object({
    email: emailSchema,
    otp: otpSchema,
  })
  .strict();

/** `POST /api/auth/resend-otp` body schema. */
export const resendOtpSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

/** `POST /api/auth/login` body schema. */
export const loginSchema = z
  .object({
    email: loginEmailSchema,
    password: loginPasswordSchema,
    deviceInfo: deviceInfoSchema.optional(),
  })
  .strict();

/** `POST /api/auth/refresh` body schema. */
export const refreshSchema = z
  .object({
    refreshToken: refreshTokenSchema,
  })
  .strict();

/**
 * `POST /api/auth/logout` body schema.
 *
 * Either `refreshToken` (log out one device) or `allDevices: true` (log out
 * everywhere). Both are optional; with neither, logout is a no-op success.
 */
export const logoutSchema = z
  .object({
    refreshToken: refreshTokenSchema.optional(),
    allDevices: z.boolean().optional(),
  })
  .strict();

/** Inferred type for the register body. */
export type RegisterBody = z.infer<typeof registerSchema>;
/** Inferred type for the verify-otp body. */
export type VerifyOtpBody = z.infer<typeof verifyOtpSchema>;
/** Inferred type for the resend-otp body. */
export type ResendOtpBody = z.infer<typeof resendOtpSchema>;
/** Inferred type for the login body. */
export type LoginBody = z.infer<typeof loginSchema>;
/** Inferred type for the refresh body. */
export type RefreshBody = z.infer<typeof refreshSchema>;
/** Inferred type for the logout body. */
export type LogoutBody = z.infer<typeof logoutSchema>;

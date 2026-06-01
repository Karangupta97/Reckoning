/**
 * One-time-password (OTP) utilities.
 *
 * OTPs are 6-digit numeric codes. They are NEVER stored or logged in
 * plaintext — only a bcrypt hash is persisted, and verification is done via
 * `bcrypt.compare`, which is constant-time and therefore resistant to timing
 * attacks. The plaintext code lives only long enough to be emailed.
 */

import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";

/** Number of digits in a generated OTP. */
const OTP_LENGTH = 6;

/** bcrypt cost factor for hashing OTPs (lower than passwords: short-lived). */
const OTP_SALT_ROUNDS = 10;

/** Lifetime of an OTP, in minutes, before it expires server-side. */
export const OTP_TTL_MINUTES = 10;

/**
 * Generate a cryptographically-random 6-digit numeric OTP.
 *
 * Uses `crypto.randomInt` (CSPRNG) rather than `Math.random`. The result is
 * zero-padded so it is always exactly {@link OTP_LENGTH} characters, e.g.
 * `"048291"`.
 *
 * @returns A 6-character numeric string.
 */
export function generateOtp(): string {
  const max = 10 ** OTP_LENGTH; // exclusive upper bound: 1_000_000
  return randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
}

/**
 * Hash an OTP with bcrypt for at-rest storage.
 *
 * @param otp Plaintext 6-digit OTP.
 * @returns The bcrypt hash to persist in `PendingVerification.otpHash`.
 */
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, OTP_SALT_ROUNDS);
}

/**
 * Constant-time comparison of a candidate OTP against its stored hash.
 *
 * @param otp  Plaintext OTP supplied by the user.
 * @param hash bcrypt hash previously produced by {@link hashOtp}.
 * @returns `true` when the OTP matches, `false` otherwise.
 */
export async function compareOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

/**
 * Compute the absolute expiry timestamp for a freshly-issued OTP.
 *
 * @param from Reference time (defaults to now).
 * @returns A `Date` set {@link OTP_TTL_MINUTES} minutes after `from`.
 */
export function otpExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + OTP_TTL_MINUTES * 60 * 1000);
}

/**
 * Shared service helpers for the admin module.
 *
 * Centralises cross-cutting concerns reused by the auth, district,
 * sub-district, and management services:
 *   - {@link adminDbGuard} — Prisma error → {@link AppError} wrapping.
 *   - {@link toAdminProfile} — public-safe admin projection (never `passwordHash`).
 *   - {@link storeAdminRefreshToken} — persist a refresh-token SHA-256 hash.
 *   - {@link issueAdminSession} — mint a token pair + persist its refresh hash.
 *   - {@link ADMIN_ACCESS_EXPIRES_SECONDS} — advertised access lifetime.
 */

import { Prisma } from "@prisma/client";
import { AppError } from "../../utils/AppError.js";
import { sha256 } from "../../utils/hash.js";
import {
  signAdminTokenPair,
  verifyAdminRefreshToken,
  type AdminCountry,
  type AdminRole,
} from "../../utils/adminJwt.js";
import type { AdminProfile, RequestContext } from "./admin.types.js";

/** Access-token lifetime advertised to clients, in seconds (15 minutes). */
export const ADMIN_ACCESS_EXPIRES_SECONDS = 900;

/** Refresh-token lifetime fallback, in milliseconds (7 days). */
const ADMIN_REFRESH_FALLBACK_MS = 7 * 24 * 60 * 60 * 1000;

/** bcrypt cost factor for admin password hashing. */
export const ADMIN_PASSWORD_SALT_ROUNDS = 12;

/**
 * Run a DB operation, converting unexpected Prisma/driver errors into a
 * generic 500 {@link AppError} while letting deliberate `AppError`s pass.
 *
 * @param operation Async DB work to execute.
 * @param context   Short label used in server-side logs.
 * @returns The operation's result.
 */
export async function adminDbGuard<T>(
  operation: () => Promise<T>,
  context: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) throw error;
    // eslint-disable-next-line no-console
    console.error(`[admin.service] DB error during ${context}:`, error);
    throw new AppError("A database error occurred. Please try again.", 500, {
      cause: error,
    });
  }
}

/** Admin row shape (with relations) needed to build a profile projection. */
export interface AdminProfileRow {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  status: AdminProfile["status"];
  designation: string | null;
  department: string | null;
  phone: string | null;
  districtId: string | null;
  subDistrictId: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  district?: { name: string; country: AdminProfile["country"] } | null;
  subDistrict?: { name: string } | null;
}

/**
 * Project an admin row (with optional district/sub-district relations) into the
 * public-safe profile shape. Never includes `passwordHash` or invite secrets.
 *
 * @param row Admin row with relations selected.
 * @returns The client-safe {@link AdminProfile}.
 */
export function toAdminProfile(row: AdminProfileRow): AdminProfile {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    status: row.status,
    designation: row.designation,
    department: row.department,
    phone: row.phone,
    districtId: row.districtId,
    districtName: row.district?.name ?? null,
    subDistrictId: row.subDistrictId,
    subDistrictName: row.subDistrict?.name ?? null,
    country: row.district?.country ?? null,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
  };
}

/** Prisma `select` that hydrates everything {@link toAdminProfile} needs. */
export const ADMIN_PROFILE_SELECT = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  designation: true,
  department: true,
  phone: true,
  districtId: true,
  subDistrictId: true,
  lastLoginAt: true,
  createdAt: true,
  district: { select: { name: true, country: true } },
  subDistrict: { select: { name: true } },
} satisfies Prisma.AdminUserSelect;

/**
 * Compute a refresh token's absolute expiry from its decoded `exp`, falling
 * back to a fixed 7-day window if the claim is somehow absent.
 *
 * @param token Signed admin refresh-token JWT.
 * @returns The expiry `Date`.
 */
function adminRefreshExpiryOf(token: string): Date {
  const decoded = verifyAdminRefreshToken(token);
  return decoded.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + ADMIN_REFRESH_FALLBACK_MS);
}

/**
 * Persist a freshly-issued admin refresh token (as a SHA-256 hash) with session
 * metadata. The raw token is never stored.
 *
 * @param tx           Prisma client or transaction client.
 * @param adminId      Owner admin id.
 * @param refreshToken Raw refresh-token JWT (hashed before storage).
 * @param ctx          Request context (IP / user-agent).
 */
export async function storeAdminRefreshToken(
  tx: Prisma.TransactionClient,
  adminId: string,
  refreshToken: string,
  ctx: RequestContext,
): Promise<void> {
  await tx.adminRefreshToken.create({
    data: {
      tokenHash: sha256(refreshToken),
      adminId,
      expiresAt: adminRefreshExpiryOf(refreshToken),
      ipAddress: ctx.ipAddress ?? null,
      userAgent: ctx.userAgent ?? null,
    },
  });
}

/** Minimal identity needed to mint an admin session. */
export interface SessionSubject {
  id: string;
  email: string;
  role: AdminRole;
  districtId: string | null;
  subDistrictId: string | null;
  country: AdminCountry | null;
}

/**
 * Mint an admin access/refresh token pair and persist the refresh-token hash
 * inside the supplied transaction.
 *
 * @param tx      Prisma transaction client.
 * @param subject Admin identity + jurisdiction to embed in the tokens.
 * @param ctx     Request context (IP / user-agent) for session auditing.
 * @returns The raw access + refresh tokens.
 */
export async function issueAdminSession(
  tx: Prisma.TransactionClient,
  subject: SessionSubject,
  ctx: RequestContext,
): Promise<{ accessToken: string; refreshToken: string }> {
  const tokens = signAdminTokenPair(subject);
  await storeAdminRefreshToken(tx, subject.id, tokens.refreshToken, ctx);
  return tokens;
}

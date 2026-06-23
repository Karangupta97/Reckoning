/**
 * Admin auth service — login / refresh / logout / me for all admin tiers.
 *
 * Shares the security posture of the citizen auth service:
 *   - timing-attack resistance (always run a bcrypt compare, even on miss),
 *   - user-enumeration resistance (one generic failure message),
 *   - DB-backed lockout (5 failures → 15-minute lock),
 *   - refresh-token rotation with at-rest SHA-256 hashing.
 *
 * Status gating is admin-specific: PENDING / SUSPENDED / DEACTIVATED accounts
 * are rejected with distinct, actionable 403s.
 */

import bcrypt from "bcryptjs";
import { prisma } from "../../../config/prisma.js";
import { env } from "../../../config/env.js";
import { AppError } from "../../../utils/AppError.js";
import { sha256 } from "../../../utils/hash.js";
import {
  signAdminAccessToken,
  signAdminRefreshToken,
  verifyAdminRefreshToken,
  type AdminCountry,
  type AdminRole,
} from "../../../utils/adminJwt.js";
import {
  ADMIN_ACCESS_EXPIRES_SECONDS,
  ADMIN_PROFILE_SELECT,
  adminDbGuard,
  issueAdminSession,
  storeAdminRefreshToken,
  toAdminProfile,
} from "../admin.shared.js";
import type {
  AdminAuthResult,
  AdminProfile,
  AdminRefreshResult,
  RequestContext,
} from "../admin.types.js";

/** Failed login attempts allowed before the account is locked. */
const MAX_LOGIN_ATTEMPTS = 5;

/** Account lockout duration, in milliseconds (15 minutes). */
const LOCKOUT_MS = 15 * 60 * 1000;

/** Generic auth-failure error reused everywhere to prevent user enumeration. */
function invalidCredentials(): AppError {
  return new AppError("Invalid email or password", 401, {
    code: "INVALID_CREDENTIALS",
  });
}

/** `POST /api/admin/auth/login` input (validated body). */
export interface AdminLoginInput {
  email: string;
  password: string;
}

/** `POST /api/admin/auth/logout` input. */
export interface AdminLogoutInput {
  adminId: string;
  refreshToken?: string;
  allDevices?: boolean;
}

/**
 * Resolve the jurisdiction country for an admin from its district relation.
 *
 * @param district District relation (or null for SUPER_ADMIN).
 * @returns The country code, or null.
 */
function countryOf(
  district: { country: AdminCountry } | null | undefined,
): AdminCountry | null {
  return district?.country ?? null;
}

/**
 * Authenticate an admin with email + password (shared across all tiers).
 *
 * @param input Validated login body.
 * @param ctx   Request context (IP / user-agent) for session auditing.
 * @returns Tokens + the admin profile.
 * @throws {AppError} 401 INVALID_CREDENTIALS, 403 status-gated errors,
 *         423 ACCOUNT_LOCKED.
 */
export async function login(
  input: AdminLoginInput,
  ctx: RequestContext,
): Promise<AdminAuthResult> {
  const { email, password } = input;

  const admin = await adminDbGuard(
    () =>
      prisma.adminUser.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          role: true,
          status: true,
          districtId: true,
          subDistrictId: true,
          loginAttempts: true,
          lockedUntil: true,
          district: { select: { country: true } },
        },
      }),
    "adminLogin:findAdmin",
  );

  // Unknown email: burn equivalent time on a dummy compare, then fail with a
  // specific error indicating there is no account.
  if (!admin || !admin.passwordHash) {
    await bcrypt.compare(password, env.DUMMY_HASH);
    throw new AppError("There is no account with this email.", 404, {
      code: "USER_NOT_FOUND",
    });
  }

  // Lockout check (acceptable to expose — the email was already proven known).
  if (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now()) {
    const minutesRemaining = Math.max(
      1,
      Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60_000),
    );
    throw new AppError(
      `Account temporarily locked. Try again in ${minutesRemaining} minutes.`,
      423,
      { code: "ACCOUNT_LOCKED", meta: { minutesRemaining } },
    );
  }

  // Status gating (distinct, actionable messages).
  switch (admin.status) {
    case "PENDING":
      throw new AppError(
        "Account not activated yet. Please check your invite email.",
        403,
        { code: "ACCOUNT_PENDING" },
      );
    case "SUSPENDED":
      throw new AppError(
        "Account suspended. Contact your administrator.",
        403,
        { code: "ACCOUNT_SUSPENDED" },
      );
    case "DEACTIVATED":
      throw new AppError("Account deactivated.", 403, {
        code: "ACCOUNT_DEACTIVATED",
      });
    default:
      break; // ACTIVE — proceed.
  }

  const passwordOk = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordOk) {
    const attempts = admin.loginAttempts + 1;
    const shouldLock = attempts >= MAX_LOGIN_ATTEMPTS;
    await adminDbGuard(
      () =>
        prisma.adminUser.update({
          where: { id: admin.id },
          data: {
            loginAttempts: attempts,
            lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MS) : null,
          },
        }),
      "adminLogin:incrementAttempts",
    );
    throw invalidCredentials();
  }

  // Success: reset failure counter, clear lock, stamp lastLoginAt, persist a
  // rotated session — atomically — and return a fresh profile.
  const now = new Date();
  const profile = await adminDbGuard(
    () =>
      prisma.$transaction(async (tx) => {
        const updated = await tx.adminUser.update({
          where: { id: admin.id },
          data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: now },
          select: ADMIN_PROFILE_SELECT,
        });
        return updated;
      }),
    "adminLogin:finalize",
  );

  // Mint + persist the session in its own short transaction (after the profile
  // update so we never store a session for a failed update).
  const tokens = await adminDbGuard(
    () =>
      prisma.$transaction((tx) =>
        issueAdminSession(
          tx,
          {
            id: admin.id,
            email: admin.email,
            role: admin.role as AdminRole,
            districtId: admin.districtId,
            subDistrictId: admin.subDistrictId,
            country: countryOf(admin.district as { country: AdminCountry } | null),
          },
          ctx,
        ),
      ),
    "adminLogin:session",
  );

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: ADMIN_ACCESS_EXPIRES_SECONDS,
    tokenType: "Bearer",
    admin: toAdminProfile(profile),
  };
}

/**
 * Rotate admin tokens using a valid refresh token.
 *
 * Verifies the JWT, confirms the hashed token is present, unused, unexpired,
 * and owned by the subject, then revokes it and issues a brand-new pair. Also
 * re-checks the admin is still ACTIVE.
 *
 * @param refreshToken Raw refresh-token JWT from the request body.
 * @param ctx          Request context for the new session.
 * @returns A new access/refresh pair and the access lifetime.
 * @throws {AppError} 401 INVALID_REFRESH_TOKEN.
 */
export async function refresh(
  refreshToken: string,
  ctx: RequestContext,
): Promise<AdminRefreshResult> {
  const decoded = verifyAdminRefreshToken(refreshToken);
  const adminId = decoded.sub;
  if (!adminId) {
    throw new AppError("Invalid refresh token.", 401, {
      code: "INVALID_REFRESH_TOKEN",
    });
  }

  const tokenHash = sha256(refreshToken);
  const stored = await adminDbGuard(
    () =>
      prisma.adminRefreshToken.findUnique({
        where: { tokenHash },
        select: { tokenHash: true, revoked: true, expiresAt: true, adminId: true },
      }),
    "adminRefresh:findToken",
  );

  if (
    !stored ||
    stored.revoked ||
    stored.expiresAt.getTime() <= Date.now() ||
    stored.adminId !== adminId
  ) {
    throw new AppError("Invalid refresh token.", 401, {
      code: "INVALID_REFRESH_TOKEN",
    });
  }

  const admin = await adminDbGuard(
    () =>
      prisma.adminUser.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          districtId: true,
          subDistrictId: true,
          district: { select: { country: true } },
        },
      }),
    "adminRefresh:findAdmin",
  );
  if (!admin || admin.status !== "ACTIVE") {
    throw new AppError("Invalid refresh token.", 401, {
      code: "INVALID_REFRESH_TOKEN",
    });
  }

  const subject = {
    id: admin.id,
    email: admin.email,
    role: admin.role as AdminRole,
    districtId: admin.districtId,
    subDistrictId: admin.subDistrictId,
    country: countryOf(admin.district as { country: AdminCountry } | null),
  };
  const accessToken = signAdminAccessToken(subject);
  const newRefreshToken = signAdminRefreshToken(subject);

  await adminDbGuard(
    () =>
      prisma.$transaction(async (tx) => {
        await tx.adminRefreshToken.update({
          where: { tokenHash },
          data: { revoked: true, revokedAt: new Date() },
        });
        await storeAdminRefreshToken(tx, admin.id, newRefreshToken, ctx);
      }),
    "adminRefresh:rotate",
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: ADMIN_ACCESS_EXPIRES_SECONDS,
  };
}

/**
 * Log out the current device or every device for an admin.
 *
 * Revoking is idempotent: revoking an unknown/already-revoked token is a silent
 * success so logout never leaks token validity.
 *
 * @param input Acting admin id + revoke target.
 * @returns A confirmation message.
 */
export async function logout(
  input: AdminLogoutInput,
): Promise<{ message: string }> {
  const { adminId, refreshToken, allDevices } = input;

  if (allDevices) {
    await adminDbGuard(
      () =>
        prisma.adminRefreshToken.updateMany({
          where: { adminId, revoked: false },
          data: { revoked: true, revokedAt: new Date() },
        }),
      "adminLogout:allDevices",
    );
  } else if (refreshToken) {
    await adminDbGuard(
      () =>
        prisma.adminRefreshToken.updateMany({
          where: { tokenHash: sha256(refreshToken), adminId, revoked: false },
          data: { revoked: true, revokedAt: new Date() },
        }),
      "adminLogout:singleDevice",
    );
  }

  return { message: "Logged out successfully" };
}

/**
 * Fetch the authenticated admin's fresh profile from the DB.
 *
 * @param adminId Authenticated admin id (from `req.admin`).
 * @returns The current admin profile.
 * @throws {AppError} 404 ADMIN_NOT_FOUND when the account no longer exists.
 */
export async function getMe(adminId: string): Promise<AdminProfile> {
  const admin = await adminDbGuard(
    () =>
      prisma.adminUser.findUnique({
        where: { id: adminId },
        select: ADMIN_PROFILE_SELECT,
      }),
    "adminGetMe:find",
  );
  if (!admin) {
    throw new AppError("Admin not found.", 404, { code: "ADMIN_NOT_FOUND" });
  }
  return toAdminProfile(admin);
}

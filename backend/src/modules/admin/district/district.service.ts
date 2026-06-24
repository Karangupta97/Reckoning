/**
 * District onboarding service.
 *
 * Implements the Super-Admin-driven District Admin invite flow:
 *   - {@link inviteDistrictAdmin}  — create District + PENDING AdminUser, email invite.
 *   - {@link activateDistrictAdmin} — token-based activation → ACTIVE + session.
 *   - {@link resendDistrictInvite}  — re-issue a token (max 3), re-email.
 *
 * Security invariants:
 *   - Government email enforced upstream (Zod) and re-checked is unnecessary.
 *   - Invite tokens stored ONLY as SHA-256 hashes; raw token lives in the email.
 *   - Passwords hashed with bcrypt (cost 12).
 *   - District geofence written via PostGIS `ST_GeomFromGeoJSON` (SRID 4326).
 */

import bcrypt from "bcryptjs";
import { prisma } from "../../../config/prisma.js";
import { AppError } from "../../../utils/AppError.js";
import { env } from "../../../config/env.js";
import {
  buildActivationUrl,
  generateInvite,
  hashInviteToken,
  INVITE_TTL_HOURS,
  MAX_INVITE_RESENDS,
} from "../../../utils/inviteToken.js";
import type { AdminCountry } from "../../../utils/adminJwt.js";
import { sendDistrictInviteEmail } from "../../../services/email.service.js";
import {
  ADMIN_ACCESS_EXPIRES_SECONDS,
  ADMIN_PASSWORD_SALT_ROUNDS,
  ADMIN_PROFILE_SELECT,
  adminDbGuard,
  issueAdminSession,
  toAdminProfile,
} from "../admin.shared.js";
import { setDistrictGeofence } from "../geofence.js";
import type {
  AdminAuthResult,
  GeoJsonPolygon,
  InviteResult,
  RequestContext,
} from "../admin.types.js";

/** Validated payload accepted by {@link inviteDistrictAdmin}. */
export interface DistrictInviteInput {
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  country: AdminCountry;
  districtName: string;
  geofence: GeoJsonPolygon;
}

/** Validated payload accepted by {@link activateDistrictAdmin}. */
export interface DistrictActivateInput {
  token: string;
  password: string;
}

/**
 * Invite a new District Administrator (Super Admin only).
 *
 * Creates the District (with its PostGIS geofence) and a PENDING AdminUser in a
 * single transaction, then sends the invite email. The raw invite token is
 * returned to the invitee solely via that email.
 *
 * @param invitedById Authenticated Super Admin id (the inviter).
 * @param input       Validated invite payload.
 * @returns The invite result (adminId, districtId, expiry).
 * @throws {AppError} 409 when the email is already in use; 422 on bad geofence.
 */
export async function inviteDistrictAdmin(
  invitedById: string,
  input: DistrictInviteInput,
): Promise<InviteResult> {
  // Reject duplicate admin emails up front (also enforced by the unique index).
  const existing = await adminDbGuard(
    () => prisma.adminUser.findUnique({ where: { email: input.email }, select: { id: true } }),
    "districtInvite:findExisting",
  );
  if (existing) {
    throw new AppError("An admin with this email already exists.", 409, {
      code: "EMAIL_IN_USE",
    });
  }

  const invite = generateInvite();

  const result = await adminDbGuard(
    () =>
      prisma.$transaction(async (tx) => {
        const district = await tx.district.create({
          data: { name: input.districtName, country: input.country },
          select: { id: true },
        });

        // Set the PostGIS polygon (Prisma can't write Unsupported columns).
        await setDistrictGeofence(tx, district.id, input.geofence);

        const invitation = await tx.adminInvitation.create({
          data: {
            token: invite.token,
            email: input.email,
            role: "DISTRICT_ADMIN",
            districtId: district.id,
            invitedById,
            expiresAt: invite.expiresAt,
          },
          select: { id: true },
        });

        return { districtId: district.id, adminId: invitation.id };
      }),
    "districtInvite:transaction",
  );

  // Send the invite email (outside the txn — never hold a txn open on SMTP).
  const activationUrl = buildActivationUrl(env.ADMIN_ACTIVATION_BASE_URL, invite.token);
  await sendDistrictInviteEmail({
    to: input.email,
    fullName: input.fullName,
    districtName: input.districtName,
    country: input.country,
    designation: input.designation,
    activationUrl,
    expiryHours: INVITE_TTL_HOURS,
  });

  return {
    message: `Invite sent to ${input.email}`,
    adminId: result.adminId,
    districtId: result.districtId,
    inviteExpiresAt: invite.expiresAt.toISOString(),
  };
}

/**
 * Activate a District Administrator account using the emailed invite token.
 *
 * @param input Validated `{ token, password }` (confirm checked upstream).
 * @param ctx   Request context for the new session.
 * @returns Tokens + the activated admin profile.
 * @throws {AppError} 404 unknown token, 400 already activated, 410 expired.
 */
export async function activateDistrictAdmin(
  input: DistrictActivateInput,
  ctx: RequestContext,
): Promise<AdminAuthResult> {
  return activateAdminByToken(input.token, input.password, "DISTRICT_ADMIN", ctx);
}

/**
 * Re-issue a District Admin invite (Super Admin only).
 *
 * Enforces a hard cap of {@link MAX_INVITE_RESENDS} resends, invalidates the
 * previous token by overwriting its hash, resets the 48-hour expiry, and
 * re-sends the email.
 *
 * @param adminId Target PENDING admin id.
 * @returns The new invite result (adminId, districtId, expiry).
 * @throws {AppError} 404 not found, 400 already activated, 429 cap reached.
 */
export async function resendDistrictInvite(invitationId: string): Promise<InviteResult> {
  const invitation = await adminDbGuard(
    () =>
      prisma.adminInvitation.findUnique({
        where: { id: invitationId },
        include: {
          district: { select: { name: true, country: true } },
        },
      }),
    "districtResend:findInvitation",
  );

  if (!invitation || invitation.role !== "DISTRICT_ADMIN") {
    throw new AppError("District admin invitation not found.", 404, { code: "NOT_FOUND" });
  }
  if (invitation.usedAt !== null) {
    throw new AppError("This account has already been activated.", 400, {
      code: "ALREADY_ACTIVATED",
    });
  }

  const invite = generateInvite();
  await adminDbGuard(
    () =>
      prisma.adminInvitation.update({
        where: { id: invitationId },
        data: {
          token: invite.token,
          expiresAt: invite.expiresAt,
        },
      }),
    "districtResend:update",
  );

  const activationUrl = buildActivationUrl(env.ADMIN_ACTIVATION_BASE_URL, invite.token);
  await sendDistrictInviteEmail({
    to: invitation.email,
    fullName: invitation.email.split("@")[0]?.replace(/[._]/g, " ") ?? "District Admin",
    districtName: invitation.district?.name ?? "your district",
    country: (invitation.district?.country ?? "INDIA") as string,
    designation: "District Administrator",
    activationUrl,
    expiryHours: INVITE_TTL_HOURS,
  });

  return {
    message: `Invite re-sent to ${invitation.email}`,
    adminId: invitation.id,
    ...(invitation.districtId ? { districtId: invitation.districtId } : {}),
    inviteExpiresAt: invite.expiresAt.toISOString(),
  };
}

/**
 * Shared token-based activation used by both district and sub-district flows.
 *
 * Validates the token, gates on PENDING status + expiry, sets the bcrypt
 * password hash, flips the account to ACTIVE/verified, clears the invite token,
 * and mints a session — all atomically.
 *
 * @param token        Raw invite token from the email link.
 * @param password     New plaintext password (validated upstream).
 * @param expectedRole The role this activation endpoint is for.
 * @param ctx          Request context for the new session.
 * @returns Tokens + the activated admin profile.
 * @throws {AppError} 404 unknown token, 400 already activated/role mismatch,
 *         410 expired.
 */
export async function activateAdminByToken(
  token: string,
  password: string,
  expectedRole: "DISTRICT_ADMIN" | "SUB_DISTRICT_ADMIN",
  ctx: RequestContext,
): Promise<AdminAuthResult> {
  const invitation = await adminDbGuard(
    () =>
      prisma.adminInvitation.findUnique({
        where: { token },
        include: {
          district: { select: { country: true } },
        },
      }),
    "activate:findByToken",
  );

  if (!invitation || invitation.role !== expectedRole) {
    throw new AppError("Invalid or unknown activation link.", 404, {
      code: "INVALID_INVITE",
    });
  }
  if (invitation.usedAt !== null) {
    throw new AppError("This account has already been activated.", 400, {
      code: "ALREADY_ACTIVATED",
    });
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    throw new AppError("Invite link expired.", 410, { code: "INVITE_EXPIRED" });
  }

  const passwordHash = await bcrypt.hash(password, ADMIN_PASSWORD_SALT_ROUNDS);
  const country = (invitation.district?.country ?? null) as AdminCountry | null;

  const { profile, tokens } = await adminDbGuard(
    () =>
      prisma.$transaction(async (tx) => {
        const created = await tx.adminUser.create({
          data: {
            email: invitation.email,
            passwordHash,
            role: invitation.role,
            districtId: invitation.districtId,
            subDistrictId: invitation.subDistrictId,
            invitedById: invitation.invitedById,
            isActive: true,
          },
        });

        await tx.adminInvitation.update({
          where: { id: invitation.id },
          data: { usedAt: new Date() },
        });

        const adminProfile = await tx.adminUser.findUniqueOrThrow({
          where: { id: created.id },
          select: ADMIN_PROFILE_SELECT,
        });

        const session = await issueAdminSession(
          tx,
          {
            id: created.id,
            email: created.email,
            role: created.role,
            districtId: created.districtId,
            subDistrictId: created.subDistrictId,
            country,
          },
          ctx,
        );

        return { profile: adminProfile, tokens: session };
      }),
    "activate:transaction",
  );

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: ADMIN_ACCESS_EXPIRES_SECONDS,
    tokenType: "Bearer",
    admin: toAdminProfile(profile),
  };
}

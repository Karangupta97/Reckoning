/**
 * Sub-District onboarding service.
 *
 * Implements the District-Admin-driven Sub-District Admin invite flow:
 *   - {@link inviteSubDistrictAdmin}  — validate geofence containment, create
 *     SubDistrict + PENDING AdminUser (inheriting the district + country),
 *     email invite.
 *   - {@link activateSubDistrictAdmin} — token-based activation (shared logic).
 *
 * The defining rule: the sub-district geofence MUST be fully within the
 * inviting District Admin's own district boundary, enforced with PostGIS
 * `ST_Within` before any record is created.
 */

import { prisma } from "../../../config/prisma.js";
import { AppError } from "../../../utils/AppError.js";
import { env } from "../../../config/env.js";
import {
  buildActivationUrl,
  generateInvite,
  INVITE_TTL_HOURS,
} from "../../../utils/inviteToken.js";
import { sendSubDistrictInviteEmail } from "../../../services/email.service.js";
import { adminDbGuard } from "../admin.shared.js";
import {
  isWithinDistrict,
  setSubDistrictGeofence,
} from "../geofence.js";
import { activateAdminByToken } from "../district/district.service.js";
import type {
  AdminAuthResult,
  GeoJsonPolygon,
  InviteResult,
  RequestContext,
} from "../admin.types.js";

/** Validated payload accepted by {@link inviteSubDistrictAdmin}. */
export interface SubDistrictInviteInput {
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  subDistrictName: string;
  geofence: GeoJsonPolygon;
}

/** Validated payload accepted by {@link activateSubDistrictAdmin}. */
export interface SubDistrictActivateInput {
  token: string;
  password: string;
}

/**
 * Invite a new Sub-District Administrator (District Admin only).
 *
 * Steps:
 *   1. Confirm the inviting admin has a district.
 *   2. Validate the sub-district geofence is within the district boundary
 *      (`ST_Within`) → 422 if not.
 *   3. Create SubDistrict (+ PostGIS geofence) and a PENDING AdminUser that
 *      inherits the creator's district + country, in one transaction.
 *   4. Send the invite email.
 *
 * @param actingDistrictId The District Admin's own district id (from JWT).
 * @param invitedById      The District Admin's admin id (the inviter).
 * @param input            Validated invite payload.
 * @returns The invite result (adminId, subDistrictId, expiry).
 * @throws {AppError} 400 missing district, 409 email in use, 422 not contained.
 */
export async function inviteSubDistrictAdmin(
  actingDistrictId: string | null,
  invitedById: string,
  input: SubDistrictInviteInput,
): Promise<InviteResult> {
  if (!actingDistrictId) {
    throw new AppError("Your account is not assigned to a district.", 400, {
      code: "NO_DISTRICT",
    });
  }

  // Reject duplicate admin emails up front.
  const existing = await adminDbGuard(
    () => prisma.adminUser.findUnique({ where: { email: input.email }, select: { id: true } }),
    "subDistrictInvite:findExisting",
  );
  if (existing) {
    throw new AppError("An admin with this email already exists.", 409, {
      code: "EMAIL_IN_USE",
    });
  }

  // Resolve the parent district (for country inheritance + email rendering).
  const district = await adminDbGuard(
    () =>
      prisma.district.findUnique({
        where: { id: actingDistrictId },
        select: { id: true, name: true, country: true },
      }),
    "subDistrictInvite:findDistrict",
  );
  if (!district) {
    throw new AppError("Your district could not be found.", 404, {
      code: "DISTRICT_NOT_FOUND",
    });
  }

  // The defining containment rule: sub-district MUST be within the district.
  const within = await isWithinDistrict(prisma, actingDistrictId, input.geofence);
  if (!within) {
    throw new AppError(
      "Sub-district boundary must be within your district boundary.",
      422,
      { code: "GEOFENCE_NOT_CONTAINED" },
    );
  }

  const invite = generateInvite();

  const result = await adminDbGuard(
    () =>
      prisma.$transaction(async (tx) => {
        const subDistrict = await tx.subDistrict.create({
          data: { name: input.subDistrictName, districtId: actingDistrictId },
          select: { id: true },
        });

        await setSubDistrictGeofence(tx, subDistrict.id, input.geofence);

        const admin = await tx.adminUser.create({
          data: {
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            designation: input.designation,
            department: input.department,
            role: "SUB_DISTRICT_ADMIN",
            status: "PENDING",
            isVerified: false,
            districtId: actingDistrictId, // inherit from creator
            subDistrictId: subDistrict.id,
            inviteTokenHash: invite.tokenHash,
            inviteTokenExpiry: invite.expiresAt,
            invitedById,
          },
          select: { id: true },
        });

        return { subDistrictId: subDistrict.id, adminId: admin.id };
      }),
    "subDistrictInvite:transaction",
  );

  const activationUrl = buildActivationUrl(env.ADMIN_ACTIVATION_BASE_URL, invite.token);
  await sendSubDistrictInviteEmail({
    to: input.email,
    fullName: input.fullName,
    subDistrictName: input.subDistrictName,
    districtName: district.name,
    country: district.country,
    designation: input.designation,
    activationUrl,
    expiryHours: INVITE_TTL_HOURS,
  });

  return {
    message: `Invite sent to ${input.email}`,
    adminId: result.adminId,
    subDistrictId: result.subDistrictId,
    inviteExpiresAt: invite.expiresAt.toISOString(),
  };
}

/**
 * Activate a Sub-District Administrator account using the emailed invite token.
 *
 * Delegates to the shared {@link activateAdminByToken} with the
 * SUB_DISTRICT_ADMIN role guard.
 *
 * @param input Validated `{ token, password }`.
 * @param ctx   Request context for the new session.
 * @returns Tokens + the activated admin profile.
 * @throws {AppError} 404 unknown token, 400 already activated, 410 expired.
 */
export async function activateSubDistrictAdmin(
  input: SubDistrictActivateInput,
  ctx: RequestContext,
): Promise<AdminAuthResult> {
  return activateAdminByToken(input.token, input.password, "SUB_DISTRICT_ADMIN", ctx);
}

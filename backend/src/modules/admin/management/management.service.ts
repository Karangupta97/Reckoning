/**
 * Admin management service (Part 5 + ticket actions).
 *
 * Three role-scoped surfaces, each enforcing the hierarchy rules:
 *
 *   SUPER_ADMIN      — list/detail/suspend/reactivate/soft-delete ANY admin,
 *                      list all districts with stats.
 *   DISTRICT_ADMIN   — own district info, own sub-admins, suspend a sub-admin,
 *                      ONLY escalated complaints, district stats.
 *   SUB_DISTRICT_ADMIN — complaints/tickets within their geofence (citizen
 *                      identity NEVER exposed), update status, add notes.
 *
 * Geofence-scoped complaint queries use parameterised PostGIS SQL
 * (`ST_Within` on the point/polygon) so a sub-district admin can never see a
 * complaint outside their zone.
 */

import { Prisma, type ComplaintStatus } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";
import { query } from "../../../config/db.js";
import { AppError } from "../../../utils/AppError.js";
import {
  ADMIN_PROFILE_SELECT,
  adminDbGuard,
  toAdminProfile,
} from "../admin.shared.js";
import type { AdminProfile, PaginationMeta } from "./management.types.js";

/** Public label used wherever an anonymous reporter would otherwise appear. */
const ANONYMOUS_LABEL = "Anonymous Citizen" as const;

/**
 * Build a pagination metadata block.
 *
 * @param total Total matching rows.
 * @param page  Current 1-based page.
 * @param limit Page size.
 * @returns Pagination metadata.
 */
function paginate(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// ===========================================================================
// SUPER_ADMIN — admin + district management
// ===========================================================================

/** Filters accepted by {@link listAdmins}. */
export interface ListAdminsFilters {
  page: number;
  limit: number;
  role?: "SUPER_ADMIN" | "DISTRICT_ADMIN" | "SUB_DISTRICT_ADMIN";
  status?: "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  search?: string;
}

/** Paginated list of admin profiles. */
export interface AdminListResult {
  admins: AdminProfile[];
  pagination: PaginationMeta;
}

/**
 * List all admins (Super Admin only), paginated and filterable.
 *
 * @param filters Pagination + optional role/status/search filters.
 * @returns A paginated list of admin profiles.
 */
export async function listAdmins(
  filters: ListAdminsFilters,
): Promise<AdminListResult> {
  const { page, limit, role, status, search } = filters;
  const where: Prisma.AdminUserWhereInput = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await adminDbGuard(
    () =>
      prisma.$transaction([
        prisma.adminUser.count({ where }),
        prisma.adminUser.findMany({
          where,
          select: ADMIN_PROFILE_SELECT,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]),
    "listAdmins",
  );

  return {
    admins: rows.map(toAdminProfile),
    pagination: paginate(total, page, limit),
  };
}

/**
 * Fetch a single admin's profile by id (Super Admin only).
 *
 * @param id Target admin id.
 * @returns The admin profile.
 * @throws {AppError} 404 when not found.
 */
export async function getAdminById(id: string): Promise<AdminProfile> {
  const row = await adminDbGuard(
    () => prisma.adminUser.findUnique({ where: { id }, select: ADMIN_PROFILE_SELECT }),
    "getAdminById",
  );
  if (!row) {
    throw new AppError("Admin not found.", 404, { code: "NOT_FOUND" });
  }
  return toAdminProfile(row);
}

/**
 * Transition an admin's status, enforcing the SUPER_ADMIN-immutability rule.
 *
 * A SUPER_ADMIN can NEVER be suspended/deactivated via the API (only directly
 * in the DB). Self-targeting is also rejected.
 *
 * @param actingAdminId The Super Admin performing the action.
 * @param targetId      The admin whose status changes.
 * @param next          Target status.
 * @returns The updated admin profile.
 * @throws {AppError} 404 not found, 403 protected/self, 400 invalid transition.
 */
async function transitionAdminStatus(
  actingAdminId: string,
  targetId: string,
  next: "SUSPENDED" | "ACTIVE" | "DEACTIVATED",
): Promise<AdminProfile> {
  if (actingAdminId === targetId) {
    throw new AppError("You cannot change your own account status.", 403, {
      code: "SELF_ACTION_FORBIDDEN",
    });
  }

  const target = await adminDbGuard(
    () => prisma.adminUser.findUnique({ where: { id: targetId }, select: { id: true, role: true, isActive: true } }),
    "transitionAdminStatus:find",
  );
  if (!target) {
    throw new AppError("Admin not found.", 404, { code: "NOT_FOUND" });
  }
  if (target.role === "SUPER_ADMIN") {
    throw new AppError(
      "The Super Admin account cannot be modified via the API.",
      403,
      { code: "SUPER_ADMIN_PROTECTED" },
    );
  }

  if (next === "ACTIVE" && target.isActive) {
    throw new AppError("Only suspended accounts can be reactivated.", 400, {
      code: "INVALID_TRANSITION",
    });
  }

  const updated = await adminDbGuard(
    () =>
      prisma.adminUser.update({
        where: { id: targetId },
        data: {
          isActive: next === "ACTIVE",
          // Reactivation clears any lockout/failed-attempt state.
          ...(next === "ACTIVE" ? { failedLoginAttempts: 0, lockedUntil: null } : {}),
        },
        select: ADMIN_PROFILE_SELECT,
      }),
    "transitionAdminStatus:update",
  );

  // Suspending/deactivating revokes all active sessions immediately.
  if (next !== "ACTIVE") {
    await adminDbGuard(
      () =>
        prisma.adminRefreshToken.updateMany({
          where: { adminUserId: targetId, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
      "transitionAdminStatus:revokeSessions",
    );
  }


  return toAdminProfile(updated);
}

/**
 * Suspend any admin (Super Admin only). SUPER_ADMIN is protected.
 *
 * @param actingAdminId Super Admin id.
 * @param targetId      Admin to suspend.
 * @returns The updated profile.
 */
export async function suspendAdmin(
  actingAdminId: string,
  targetId: string,
): Promise<AdminProfile> {
  return transitionAdminStatus(actingAdminId, targetId, "SUSPENDED");
}

/**
 * Reactivate a suspended admin (Super Admin only).
 *
 * @param actingAdminId Super Admin id.
 * @param targetId      Admin to reactivate.
 * @returns The updated profile.
 */
export async function reactivateAdmin(
  actingAdminId: string,
  targetId: string,
): Promise<AdminProfile> {
  return transitionAdminStatus(actingAdminId, targetId, "ACTIVE");
}

/**
 * Soft-delete an admin → DEACTIVATED (Super Admin only). SUPER_ADMIN protected.
 *
 * @param actingAdminId Super Admin id.
 * @param targetId      Admin to deactivate.
 * @returns A confirmation message.
 */
export async function deleteAdmin(
  actingAdminId: string,
  targetId: string,
): Promise<{ message: string }> {
  await transitionAdminStatus(actingAdminId, targetId, "DEACTIVATED");
  return { message: "Admin account deactivated." };
}

/** A district summary row with aggregate counts. */
export interface DistrictSummary {
  id: string;
  name: string;
  country: string;
  isActive: boolean;
  createdAt: Date;
  adminCount: number;
  subDistrictCount: number;
}

/** Paginated list of district summaries. */
export interface DistrictListResult {
  districts: DistrictSummary[];
  pagination: PaginationMeta;
}

/**
 * List all districts with admin + sub-district counts (Super Admin only).
 *
 * @param page  1-based page.
 * @param limit Page size.
 * @returns A paginated list of district summaries.
 */
export async function listDistricts(
  page: number,
  limit: number,
): Promise<DistrictListResult> {
  const [total, rows] = await adminDbGuard(
    () =>
      prisma.$transaction([
        prisma.district.count(),
        prisma.district.findMany({
          select: {
            id: true,
            name: true,
            country: true,
            isActive: true,
            createdAt: true,
            _count: { select: { admins: true, subDistricts: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]),
    "listDistricts",
  );

  return {
    districts: rows.map((d) => ({
      id: d.id,
      name: d.name,
      country: d.country,
      isActive: d.isActive,
      createdAt: d.createdAt,
      adminCount: d._count.admins,
      subDistrictCount: d._count.subDistricts,
    })),
    pagination: paginate(total, page, limit),
  };
}

// ===========================================================================
// DISTRICT_ADMIN — own district, sub-admins, escalations, stats
// ===========================================================================

/**
 * Fetch the District Admin's own district (info + geofence as GeoJSON).
 *
 * @param districtId The acting admin's district id.
 * @returns District info including the geofence GeoJSON.
 * @throws {AppError} 400 when unassigned, 404 when the district is missing.
 */
export async function getMyDistrict(districtId: string | null): Promise<{
  id: string;
  name: string;
  country: string;
  isActive: boolean;
  createdAt: Date;
  geofence: unknown | null;
}> {
  if (!districtId) {
    throw new AppError("Your account is not assigned to a district.", 400, {
      code: "NO_DISTRICT",
    });
  }

  const meta = await adminDbGuard(
    () =>
      prisma.district.findUnique({
        where: { id: districtId },
        select: { id: true, name: true, country: true, isActive: true, createdAt: true },
      }),
    "getMyDistrict:meta",
  );
  if (!meta) {
    throw new AppError("District not found.", 404, { code: "NOT_FOUND" });
  }

  const geo = await adminDbGuard(
    () =>
      query<{ geofence: string | null }>(
        `SELECT ST_AsGeoJSON(boundary) AS geofence FROM "districts" WHERE id = $1`,
        [districtId],
      ),
    "getMyDistrict:geofence",
  );
  const raw = geo.rows[0]?.geofence ?? null;

  return {
    ...meta,
    geofence: raw ? (JSON.parse(raw) as unknown) : null,
  };
}

/**
 * List the District Admin's own sub-district admins (paginated).
 *
 * @param districtId The acting admin's district id.
 * @param page       1-based page.
 * @param limit      Page size.
 * @returns A paginated list of sub-district admin profiles.
 */
export async function getMySubAdmins(
  districtId: string | null,
  page: number,
  limit: number,
): Promise<AdminListResult> {
  if (!districtId) {
    throw new AppError("Your account is not assigned to a district.", 400, {
      code: "NO_DISTRICT",
    });
  }

  const where: Prisma.AdminUserWhereInput = {
    role: "SUB_DISTRICT_ADMIN",
    districtId,
  };

  const [total, rows] = await adminDbGuard(
    () =>
      prisma.$transaction([
        prisma.adminUser.count({ where }),
        prisma.adminUser.findMany({
          where,
          select: ADMIN_PROFILE_SELECT,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]),
    "getMySubAdmins",
  );

  return {
    admins: rows.map(toAdminProfile),
    pagination: paginate(total, page, limit),
  };
}

/**
 * Suspend a sub-district admin that belongs to the acting District Admin.
 *
 * Enforces ownership: the target MUST be a SUB_DISTRICT_ADMIN in the acting
 * admin's district.
 *
 * @param districtId The acting admin's district id.
 * @param targetId   The sub-district admin to suspend.
 * @returns The updated profile.
 * @throws {AppError} 400 unassigned, 404 not found/out-of-district.
 */
export async function suspendMySubAdmin(
  districtId: string | null,
  targetId: string,
): Promise<AdminProfile> {
  if (!districtId) {
    throw new AppError("Your account is not assigned to a district.", 400, {
      code: "NO_DISTRICT",
    });
  }

  const target = await adminDbGuard(
    () =>
      prisma.adminUser.findUnique({
        where: { id: targetId },
        select: { id: true, role: true, districtId: true },
      }),
    "suspendMySubAdmin:find",
  );
  if (
    !target ||
    target.role !== "SUB_DISTRICT_ADMIN" ||
    target.districtId !== districtId
  ) {
    throw new AppError("Sub-district admin not found in your district.", 404, {
      code: "NOT_FOUND",
    });
  }

  const updated = await adminDbGuard(
    () =>
      prisma.adminUser.update({
        where: { id: targetId },
        data: { isActive: false },
        select: ADMIN_PROFILE_SELECT,
      }),
    "suspendMySubAdmin:update",
  );

  await adminDbGuard(
    () =>
      prisma.adminRefreshToken.updateMany({
        where: { adminUserId: targetId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    "suspendMySubAdmin:revoke",
  );

  return toAdminProfile(updated);
}

/**
 * Reactivate a suspended sub-district admin that belongs to the acting District Admin.
 *
 * @param districtId The acting admin's district id.
 * @param targetId   The sub-district admin to reactivate.
 * @returns The updated profile.
 * @throws {AppError} 400 unassigned, 404 not found/out-of-district, 400 not suspended.
 */
export async function reactivateMySubAdmin(
  districtId: string | null,
  targetId: string,
): Promise<AdminProfile> {
  if (!districtId) {
    throw new AppError("Your account is not assigned to a district.", 400, {
      code: "NO_DISTRICT",
    });
  }

  const target = await adminDbGuard(
    () =>
      prisma.adminUser.findUnique({
        where: { id: targetId },
        select: { id: true, role: true, districtId: true, isActive: true },
      }),
    "reactivateMySubAdmin:find",
  );
  if (
    !target ||
    target.role !== "SUB_DISTRICT_ADMIN" ||
    target.districtId !== districtId
  ) {
    throw new AppError("Sub-district admin not found in your district.", 404, {
      code: "NOT_FOUND",
    });
  }

  if (target.isActive) {
    throw new AppError("Only suspended accounts can be reactivated.", 400, {
      code: "INVALID_TRANSITION",
    });
  }

  const updated = await adminDbGuard(
    () =>
      prisma.adminUser.update({
        where: { id: targetId },
        data: {
          isActive: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
        select: ADMIN_PROFILE_SELECT,
      }),
    "reactivateMySubAdmin:update",
  );

  return toAdminProfile(updated);
}



/** A complaint row shaped for an admin surface (no citizen identity). */
export interface AdminComplaintView {
  id: string;
  ticketNumber: string;
  category: string;
  severity: string;
  status: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  country: string;
  escalationLevel: number;
  escalatedAt: Date | null;
  escalatedBy: string | null;
  escalationReason: string | null;
  slaDeadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** Pre-signed S3 URLs for citizen + officer media (up to 8). */
  mediaUrls: string[];
  /** AI analysis result for the complaint, if available. */
  aiResult: {
    annotatedImageUrl: string | null;
    confidence: number | null;
    suggestedCategory: string | null;
    suggestedSeverity: string | null;
  } | null;
}

/** Paginated list of admin complaint views. */
export interface AdminComplaintListResult {
  complaints: AdminComplaintView[];
  pagination: PaginationMeta;
}

/**
 * Map a Prisma complaint row to the citizen-identity-free admin view.
 * Async because it generates pre-signed S3 URLs for media and AI images.
 *
 * @param c Complaint row with the selected admin fields.
 * @returns An {@link AdminComplaintView}.
 */
async function toAdminComplaintView(c: {
  id: string;
  ticketNumber: string;
  category: string;
  severity: string;
  status: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  country: string;
  escalationLevel: number;
  escalatedAt: Date | null;
  escalatedBy: string | null;
  escalationReason: string | null;
  slaDeadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isAnonymous?: boolean;
  media?: { media: { s3Key: string } }[];
  aiResult?: {
    annotatedImageS3Key: string | null;
    confidence: number | null;
    suggestedCategory: string | null;
    suggestedSeverity: string | null;
  } | null;
}): Promise<AdminComplaintView> {
  // Generate pre-signed URLs for media attachments (citizen + officer uploads)
  const { getSignedDownloadUrl } = await import("../../../config/s3.js");
  const mediaUrls = await Promise.all(
    (c.media ?? []).map(async (m) => {
      try {
        return await getSignedDownloadUrl(m.media.s3Key, 3600);
      } catch {
        return null;
      }
    }),
  ).then((urls) => urls.filter((u): u is string => u !== null));

  // AI result with annotated image URL
  let aiResult: AdminComplaintView["aiResult"] = null;
  if (c.aiResult) {
    const annotatedImageUrl = c.aiResult.annotatedImageS3Key
      ? await getSignedDownloadUrl(c.aiResult.annotatedImageS3Key, 3600).catch(() => null)
      : null;
    aiResult = {
      annotatedImageUrl,
      confidence: c.aiResult.confidence,
      suggestedCategory: c.aiResult.suggestedCategory,
      suggestedSeverity: c.aiResult.suggestedSeverity,
    };
  }

  return {
    id: c.id,
    ticketNumber: c.ticketNumber,
    category: c.category,
    severity: c.severity,
    status: c.status,
    description: c.description,
    address: c.address,
    latitude: c.latitude,
    longitude: c.longitude,
    country: c.country,
    escalationLevel: c.escalationLevel,
    escalatedAt: c.escalatedAt,
    escalatedBy: c.escalatedBy,
    escalationReason: c.escalationReason,
    slaDeadline: c.slaDeadline,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    mediaUrls,
    aiResult,
  };
}

/** Fields selected for the admin complaint view (NEVER selects `userId`). */
const ADMIN_COMPLAINT_SELECT = {
  id: true,
  ticketNumber: true,
  category: true,
  severity: true,
  status: true,
  description: true,
  address: true,
  latitude: true,
  longitude: true,
  country: true,
  escalationLevel: true,
  escalatedAt: true,
  escalatedBy: true,
  escalationReason: true,
  slaDeadline: true,
  createdAt: true,
  updatedAt: true,
  isAnonymous: true,
  media: {
    select: {
      media: { select: { s3Key: true } },
    },
    take: 8,
  },
  aiResult: {
    select: {
      annotatedImageS3Key: true,
      confidence: true,
      suggestedCategory: true,
      suggestedSeverity: true,
    },
  },
} satisfies Prisma.ComplaintSelect;

/**
 * List ONLY escalated complaints routed to the District Admin's district.
 *
 * Returns complaints `WHERE escalatedToDistrictId = districtId` — never the
 * non-escalated sub-district traffic. Citizen identity is never exposed.
 * Optionally filter by `status` (e.g. `ESCALATED_TO_DISTRICT`).
 *
 * @param districtId The acting admin's district id.
 * @param page       1-based page.
 * @param limit      Page size.
 * @param status     Optional status filter string.
 * @returns A paginated list of escalated complaints.
 */
export async function getDistrictEscalations(
  districtId: string | null,
  page: number,
  limit: number,
  status?: string,
): Promise<AdminComplaintListResult> {
  // No district assigned → return empty list rather than 400
  // so the district admin dashboard shows a clean empty state.
  if (!districtId) {
    return { complaints: [], pagination: paginate(0, page, limit) };
  }

  const where: Prisma.ComplaintWhereInput = {
    escalatedToDistrictId: districtId,
    deletedAt: null,
    ...(status ? { status: status as Prisma.EnumComplaintStatusFilter } : {}),
  };

  const [total, rows] = await adminDbGuard(
    () =>
      prisma.$transaction([
        prisma.complaint.count({ where }),
        prisma.complaint.findMany({
          where,
          select: ADMIN_COMPLAINT_SELECT,
          orderBy: { escalatedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]),
    "getDistrictEscalations",
  );

  return {
    complaints: await Promise.all(rows.map(toAdminComplaintView)),
    pagination: paginate(total, page, limit),
  };
}

/** District-level resolution / SLA statistics. */
export interface DistrictStats {
  escalatedTotal: number;
  resolved: number;
  rejected: number;
  open: number;
  slaBreached: number;
  resolutionRate: number;
}

/**
 * Compute resolution + SLA stats for the District Admin's escalations.
 *
 * @param districtId The acting admin's district id.
 * @returns Aggregate stats over the district's escalated complaints.
 */
export async function getDistrictStats(
  districtId: string | null,
): Promise<DistrictStats> {
  // No district assigned → return zero stats
  if (!districtId) {
    return { escalatedTotal: 0, resolved: 0, rejected: 0, open: 0, slaBreached: 0, resolutionRate: 0 };
  }

  const base: Prisma.ComplaintWhereInput = {
    escalatedToDistrictId: districtId,
    deletedAt: null,
  };

  const [escalatedTotal, resolved, rejected, slaBreached] = await adminDbGuard(
    () =>
      prisma.$transaction([
        prisma.complaint.count({ where: base }),
        prisma.complaint.count({ where: { ...base, status: "RESOLVED" } }),
        prisma.complaint.count({ where: { ...base, status: "REJECTED" } }),
        prisma.complaint.count({
          where: {
            ...base,
            status: { notIn: ["RESOLVED", "REJECTED"] },
            slaDeadline: { lt: new Date() },
          },
        }),
      ]),
    "getDistrictStats",
  );

  const open = escalatedTotal - resolved - rejected;
  const resolutionRate =
    escalatedTotal > 0 ? Math.round((resolved / escalatedTotal) * 100) : 0;

  return { escalatedTotal, resolved, rejected, open, slaBreached, resolutionRate };
}

/**
 * List sub-districts belonging to the District Admin's district, each with its
 * GeoJSON boundary (if set). Used by the "Add Sub-District" form to show
 * existing sub-districts and their boundaries on a map.
 *
 * @param districtId The acting admin's district id.
 * @returns Array of sub-districts with id, name, isActive, createdAt, geofence.
 * @throws {AppError} 400 when the admin has no district.
 */
export async function getMySubDistricts(
  districtId: string | null,
): Promise<Array<{
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  adminCount: number;
  geofence: unknown | null;
}>> {
  if (!districtId) {
    throw new AppError("Your account is not assigned to a district.", 400, {
      code: "NO_DISTRICT",
    });
  }

  const subDistricts = await adminDbGuard(
    () =>
      prisma.subDistrict.findMany({
        where: { districtId },
        select: {
          id: true,
          name: true,
          isActive: true,
          createdAt: true,
          _count: { select: { admins: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    "getMySubDistricts:list",
  );

  // Fetch GeoJSON boundaries via PostGIS for each sub-district
  const boundaries = await adminDbGuard(
    () =>
      query<{ id: string; geofence: string | null }>(
        `SELECT id, ST_AsGeoJSON(boundary) AS geofence FROM "sub_districts" WHERE "districtId" = $1`,
        [districtId],
      ),
    "getMySubDistricts:boundaries",
  );

  const boundaryMap = new Map(
    boundaries.rows.map((r) => [r.id, r.geofence ? JSON.parse(r.geofence) : null]),
  );

  return subDistricts.map((sd) => ({
    id: sd.id,
    name: sd.name,
    isActive: sd.isActive,
    createdAt: sd.createdAt,
    adminCount: sd._count.admins,
    geofence: boundaryMap.get(sd.id) ?? null,
  }));
}

// ===========================================================================
// SUB_DISTRICT_ADMIN — geofence-scoped complaints, tickets, stats, actions
// ===========================================================================

/**
 * Resolve the set of complaint ids that fall within a sub-district's geofence,
 * paginated, using PostGIS `ST_Within`. Parameterised — injection-safe.
 *
 * @param subDistrictId The acting admin's sub-district id.
 * @param page          1-based page.
 * @param limit         Page size.
 * @param onlyOpen      When true, restrict to non-terminal statuses (tickets).
 * @returns Ordered complaint ids for the page + total match count.
 */
async function zoneComplaintIds(
  subDistrictId: string,
  page: number,
  limit: number,
  onlyOpen: boolean,
): Promise<{ ids: string[]; total: number }> {
  const offset = (page - 1) * limit;
  const statusClause = onlyOpen
    ? `AND c.status::text NOT IN ('RESOLVED','REJECTED')`
    : "";

  const whereSql = `
    FROM "complaints" AS c
    JOIN "sub_districts" AS sd ON sd.id = $1
    WHERE c."deletedAt" IS NULL
      AND c.location IS NOT NULL
      AND sd.geofence IS NOT NULL
      AND ST_Within(c.location::geometry, sd.geofence)
      ${statusClause}`;

  const countResult = await adminDbGuard(
    () => query<{ count: string }>(`SELECT COUNT(*)::text AS count ${whereSql}`, [subDistrictId]),
    "zoneComplaintIds:count",
  );
  const total = Number.parseInt(countResult.rows[0]?.count ?? "0", 10);

  const rowsResult = await adminDbGuard(
    () =>
      query<{ id: string }>(
        `SELECT c.id ${whereSql} ORDER BY c."createdAt" DESC LIMIT $2 OFFSET $3`,
        [subDistrictId, limit, offset],
      ),
    "zoneComplaintIds:rows",
  );

  return { ids: rowsResult.rows.map((r) => r.id), total };
}

/**
 * Hydrate ordered complaint ids into citizen-identity-free admin views,
 * preserving the SQL ordering.
 *
 * @param ids Ordered complaint ids.
 * @returns Admin complaint views in the same order.
 */
async function hydrateAdminComplaints(
  ids: string[],
): Promise<AdminComplaintView[]> {
  if (ids.length === 0) return [];
  const rows = await adminDbGuard(
    () =>
      prisma.complaint.findMany({
        where: { id: { in: ids } },
        select: ADMIN_COMPLAINT_SELECT,
      }),
    "hydrateAdminComplaints",
  );
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((r): r is (typeof rows)[number] => Boolean(r));
  return Promise.all(ordered.map(toAdminComplaintView));
}

/**
 * List complaints inside the Sub-District Admin's geofence (paginated).
 *
 * @param subDistrictId The acting admin's sub-district id.
 * @param page          1-based page.
 * @param limit         Page size.
 * @returns A paginated list of geofence-scoped complaints.
 * @throws {AppError} 400 when the admin has no sub-district.
 */
export async function getZoneComplaints(
  subDistrictId: string | null,
  page: number,
  limit: number,
): Promise<AdminComplaintListResult> {
  if (!subDistrictId) {
    throw new AppError("Your account is not assigned to a sub-district.", 400, {
      code: "NO_SUB_DISTRICT",
    });
  }
  const { ids, total } = await zoneComplaintIds(subDistrictId, page, limit, false);
  return {
    complaints: await hydrateAdminComplaints(ids),
    pagination: paginate(total, page, limit),
  };
}

/**
 * List OPEN tickets inside the Sub-District Admin's geofence (paginated).
 *
 * @param subDistrictId The acting admin's sub-district id.
 * @param page          1-based page.
 * @param limit         Page size.
 * @returns A paginated list of open, geofence-scoped tickets.
 * @throws {AppError} 400 when the admin has no sub-district.
 */
export async function getZoneTickets(
  subDistrictId: string | null,
  page: number,
  limit: number,
): Promise<AdminComplaintListResult> {
  if (!subDistrictId) {
    throw new AppError("Your account is not assigned to a sub-district.", 400, {
      code: "NO_SUB_DISTRICT",
    });
  }
  const { ids, total } = await zoneComplaintIds(subDistrictId, page, limit, true);
  return {
    complaints: await hydrateAdminComplaints(ids),
    pagination: paginate(total, page, limit),
  };
}

/** Personal stats for a Sub-District Admin's zone. */
export interface ZoneStats {
  total: number;
  open: number;
  resolved: number;
  rejected: number;
  escalated: number;
  resolutionRate: number;
}

/**
 * Compute personal stats over the Sub-District Admin's geofence.
 *
 * @param subDistrictId The acting admin's sub-district id.
 * @returns Aggregate counts + resolution rate for the zone.
 * @throws {AppError} 400 when the admin has no sub-district.
 */
export async function getZoneStats(
  subDistrictId: string | null,
): Promise<ZoneStats> {
  if (!subDistrictId) {
    throw new AppError("Your account is not assigned to a sub-district.", 400, {
      code: "NO_SUB_DISTRICT",
    });
  }

  const rows = await adminDbGuard(
    () =>
      query<{ status: string; count: string }>(
        `SELECT c.status::text AS status, COUNT(*)::text AS count
         FROM "complaints" AS c
         JOIN "sub_districts" AS sd ON sd.id = $1
         WHERE c."deletedAt" IS NULL
           AND c.location IS NOT NULL
           AND sd.geofence IS NOT NULL
           AND ST_Within(c.location::geometry, sd.geofence)
         GROUP BY c.status`,
        [subDistrictId],
      ),
    "getZoneStats",
  );

  let total = 0;
  let resolved = 0;
  let rejected = 0;
  let escalated = 0;
  for (const r of rows.rows) {
    const n = Number.parseInt(r.count, 10);
    total += n;
    if (r.status === "RESOLVED") resolved += n;
    else if (r.status === "REJECTED") rejected += n;
    else if (r.status === "ESCALATED") escalated += n;
  }
  const open = total - resolved - rejected;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return { total, open, resolved, rejected, escalated, resolutionRate };
}

/**
 * Confirm a complaint lies within the Sub-District Admin's geofence.
 *
 * The authorization gate for every ticket action: a sub-district admin can
 * only mutate complaints inside their own zone.
 *
 * @param subDistrictId The acting admin's sub-district id.
 * @param complaintId   The target complaint id.
 * @returns `true` when the complaint is in the admin's zone.
 */
async function complaintInZone(
  subDistrictId: string,
  complaintId: string,
): Promise<boolean> {
  const rows = await adminDbGuard(
    () =>
      query<{ ok: boolean }>(
        `SELECT ST_Within(c.location::geometry, sd.geofence) AS ok
         FROM "complaints" AS c
         JOIN "sub_districts" AS sd ON sd.id = $2
         WHERE c.id = $1
           AND c."deletedAt" IS NULL
           AND c.location IS NOT NULL
           AND sd.geofence IS NOT NULL`,
        [complaintId, subDistrictId],
      ),
    "complaintInZone",
  );
  return rows.rows[0]?.ok === true;
}

/** Validated input for {@link updateTicketStatus}. */
export interface UpdateTicketStatusInput {
  status: ComplaintStatus;
  note?: string;
}

/**
 * Update a ticket's status (Sub-District Admin only, within their geofence).
 *
 * Stamps resolution metadata when moving to RESOLVED/REJECTED and records the
 * acting admin. Rejects complaints outside the admin's zone with 403.
 *
 * @param subDistrictId The acting admin's sub-district id.
 * @param adminId       The acting admin id (recorded on resolution).
 * @param complaintId   The target complaint id.
 * @param input         New status + optional note.
 * @returns The updated admin complaint view.
 * @throws {AppError} 400 unassigned, 403 out-of-zone, 404 missing.
 */
export async function updateTicketStatus(
  subDistrictId: string | null,
  adminId: string,
  complaintId: string,
  input: UpdateTicketStatusInput,
): Promise<AdminComplaintView> {
  if (!subDistrictId) {
    throw new AppError("Your account is not assigned to a sub-district.", 400, {
      code: "NO_SUB_DISTRICT",
    });
  }
  if (!(await complaintInZone(subDistrictId, complaintId))) {
    throw new AppError("This complaint is outside your zone.", 403, {
      code: "OUT_OF_ZONE",
    });
  }

  const isTerminal = input.status === "RESOLVED" || input.status === "REJECTED";
  const updated = await adminDbGuard(
    () =>
      prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status: input.status,
          ...(input.note !== undefined ? { resolutionNote: input.note } : {}),
          ...(isTerminal
            ? { resolvedAt: new Date(), resolvedByAdmin: adminId }
            : {}),
        },
        select: ADMIN_COMPLAINT_SELECT,
      }),
    "updateTicketStatus",
  );

  return toAdminComplaintView(updated);
}

/** Validated input for {@link addResolutionNote}. */
export interface AddNoteInput {
  note: string;
  status?: "RESOLVED" | "REJECTED" | "IN_PROGRESS";
}

/**
 * Add a resolution note to a ticket (Sub-District Admin only, within zone),
 * optionally transitioning its status in the same action.
 *
 * @param subDistrictId The acting admin's sub-district id.
 * @param adminId       The acting admin id.
 * @param complaintId   The target complaint id.
 * @param input         Note + optional status transition.
 * @returns The updated admin complaint view.
 * @throws {AppError} 400 unassigned, 403 out-of-zone, 404 missing.
 */
export async function addResolutionNote(
  subDistrictId: string | null,
  adminId: string,
  complaintId: string,
  input: AddNoteInput,
): Promise<AdminComplaintView> {
  if (!subDistrictId) {
    throw new AppError("Your account is not assigned to a sub-district.", 400, {
      code: "NO_SUB_DISTRICT",
    });
  }
  if (!(await complaintInZone(subDistrictId, complaintId))) {
    throw new AppError("This complaint is outside your zone.", 403, {
      code: "OUT_OF_ZONE",
    });
  }

  const isTerminal = input.status === "RESOLVED" || input.status === "REJECTED";
  const updated = await adminDbGuard(
    () =>
      prisma.complaint.update({
        where: { id: complaintId },
        data: {
          resolutionNote: input.note,
          ...(input.status ? { status: input.status } : {}),
          ...(isTerminal
            ? { resolvedAt: new Date(), resolvedByAdmin: adminId }
            : {}),
        },
        select: ADMIN_COMPLAINT_SELECT,
      }),
    "addResolutionNote",
  );

  return toAdminComplaintView(updated);
}

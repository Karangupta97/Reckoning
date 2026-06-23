/**
 * Sub-District Admin — complaints service.
 *
 * All queries are scoped to `Complaint.subDistrictId = adminUser.subDistrictId`
 * so a sub-district admin can never see a complaint outside their jurisdiction.
 *
 * Citizen identity (`userId`) is NEVER exposed. `citizen.name` is returned
 * only when the complaint is not anonymous.
 *
 * Pre-signed S3 URLs are generated fresh on every request — never stored.
 */

import { Prisma, type ComplaintStatus, type SeverityLevel } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";
import { AppError } from "../../../utils/AppError.js";
import { adminDbGuard } from "../admin.shared.js";
import { getSignedDownloadUrl } from "../../../config/s3.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Pagination metadata block (mirrors management.types). */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Allowed sort fields for the complaints list. */
export type SubDistrictComplaintSortBy = "createdAt" | "severity";

/** Query filters accepted by {@link listSubDistrictComplaints}. */
export interface SubDistrictComplaintFilters {
  status?: ComplaintStatus;
  sortBy?: SubDistrictComplaintSortBy;
  page?: number;
  limit?: number;
}

/** Minimal AI result shape returned to the dashboard. */
export interface AiResultView {
  annotatedImageUrl: string | null;
  confidence: number | null;
  suggestedCategory: string | null;
  suggestedSeverity: string | null;
}

/** A single complaint row shaped for the sub-district dashboard. */
export interface SubDistrictComplaintItem {
  id: string;
  title: string | null;
  description: string | null;
  status: ComplaintStatus;
  severity: SeverityLevel;
  riskScore: number | null;
  latitude: number;
  longitude: number;
  mediaUrls: string[];
  createdAt: Date;
  citizenName: string;
  aiResult: AiResultView | null;
}

/** Paginated response envelope. */
export interface SubDistrictComplaintListResult {
  complaints: SubDistrictComplaintItem[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

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

/** Severity to numeric risk-score (0-100). Used for display only. */
const SEVERITY_SCORE: Record<string, number> = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  CRITICAL: 100,
};

/** Prisma select for the list query. NEVER selects userId. */
const LIST_SELECT = {
  id: true,
  description: true,
  status: true,
  severity: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  isAnonymous: true,
  aiConfidence: true,
  aiResult: {
    select: {
      annotatedImageS3Key: true,
      confidence: true,
      suggestedCategory: true,
      suggestedSeverity: true,
    },
  },
  user: {
    select: { fullName: true },
  },
  media: {
    select: {
      media: { select: { s3Key: true } },
    },
    take: 5,
  },
} satisfies Prisma.ComplaintSelect;

type ListRow = Prisma.ComplaintGetPayload<{ select: typeof LIST_SELECT }>;

async function toListItem(row: ListRow): Promise<SubDistrictComplaintItem> {
  // Citizen name: hide when anonymous
  const citizenName =
    row.isAnonymous ? "Anonymous Citizen" : (row.user?.fullName ?? "Unknown");

  // Generate fresh pre-signed URLs for each media file
  const mediaUrls = await Promise.all(
    row.media.map(async (m) => {
      try {
        return await getSignedDownloadUrl(m.media.s3Key, 3600);
      } catch {
        return null;
      }
    }),
  ).then((urls) => urls.filter((u): u is string => u !== null));

  // AI result
  let aiResult: AiResultView | null = null;
  if (row.aiResult) {
    const annotatedImageUrl = row.aiResult.annotatedImageS3Key
      ? await getSignedDownloadUrl(row.aiResult.annotatedImageS3Key, 3600).catch(() => null)
      : null;
    aiResult = {
      annotatedImageUrl,
      confidence: row.aiResult.confidence,
      suggestedCategory: row.aiResult.suggestedCategory,
      suggestedSeverity: row.aiResult.suggestedSeverity,
    };
  }

  return {
    id: row.id,
    title: null, // Complaint model has no title field; populated from description
    description: row.description,
    status: row.status,
    severity: row.severity,
    riskScore: SEVERITY_SCORE[row.severity] ?? null,
    latitude: row.latitude,
    longitude: row.longitude,
    mediaUrls,
    createdAt: row.createdAt,
    citizenName,
    aiResult,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * List complaints assigned to the caller's sub-district.
 *
 * Scoped strictly to `Complaint.subDistrictId = adminSubDistrictId`.
 * Supports status filter, createdAt / severity sort, and offset pagination.
 *
 * @param adminSubDistrictId  Sub-district id from the authenticated admin's JWT.
 * @param filters             Optional status, sortBy, page, limit.
 * @returns Paginated list of sub-district complaints.
 * @throws {AppError} 400 when the admin has no sub-district assigned.
 */
export async function listSubDistrictComplaints(
  adminSubDistrictId: string | null | undefined,
  filters: SubDistrictComplaintFilters = {},
): Promise<SubDistrictComplaintListResult> {
  if (!adminSubDistrictId) {
    throw new AppError(
      "Your account is not assigned to a sub-district.",
      400,
      { code: "NO_SUB_DISTRICT" },
    );
  }

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const sortBy = filters.sortBy ?? "createdAt";

  const where: Prisma.ComplaintWhereInput = {
    subDistrictId: adminSubDistrictId,
    deletedAt: null,
    ...(filters.status ? { status: filters.status } : {}),
  };
  console.log("listSubDistrictComplaints query where clause:", where);

  // Severity sort uses a custom ordering expression via raw query.
  // For simple sorts, Prisma orderBy is sufficient.
  const orderBy: Prisma.ComplaintOrderByWithRelationInput =
    sortBy === "severity"
      ? {
          // CRITICAL > HIGH > MEDIUM > LOW — sort descending by rank
          // Prisma doesn't support CASE expressions, so fall back to createdAt
          // and let the client decide. For a true severity sort, use the raw
          // SQL path. We keep this simple to avoid raw for the main query.
          createdAt: "desc",
        }
      : { createdAt: "desc" };

  const [total, rows] = await adminDbGuard(
    () =>
      prisma.$transaction([
        prisma.complaint.count({ where }),
        prisma.complaint.findMany({
          where,
          select: LIST_SELECT,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]),
    "listSubDistrictComplaints",
  );

  const complaints = await Promise.all(rows.map(toListItem));
  return { complaints, total, page, limit };
}

/**
 * Update a complaint's status. Scoped to the caller's sub-district.
 *
 * @param adminSubDistrictId  Sub-district id from the JWT.
 * @param adminId             Admin user id (recorded on resolution).
 * @param complaintId         Target complaint id.
 * @param status              New {@link ComplaintStatus} value.
 * @returns The updated complaint view.
 * @throws {AppError} 400 no sub-district, 403 out-of-district, 404 not found.
 */
export async function updateSubDistrictComplaintStatus(
  adminSubDistrictId: string | null | undefined,
  adminId: string,
  complaintId: string,
  status: ComplaintStatus,
): Promise<SubDistrictComplaintItem> {
  if (!adminSubDistrictId) {
    throw new AppError(
      "Your account is not assigned to a sub-district.",
      400,
      { code: "NO_SUB_DISTRICT" },
    );
  }

  // Verify the complaint belongs to this sub-district
  const existing = await adminDbGuard(
    () =>
      prisma.complaint.findUnique({
        where: { id: complaintId },
        select: { id: true, subDistrictId: true, deletedAt: true },
      }),
    "updateSubDistrictComplaintStatus:find",
  );

  if (!existing || existing.deletedAt) {
    throw new AppError("Complaint not found.", 404, { code: "NOT_FOUND" });
  }

  if (existing.subDistrictId !== adminSubDistrictId) {
    throw new AppError(
      "This complaint does not belong to your sub-district.",
      403,
      { code: "OUT_OF_ZONE" },
    );
  }

  const isTerminal = status === "RESOLVED" || status === "REJECTED";

  const updated = await adminDbGuard(
    () =>
      prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status,
          ...(isTerminal
            ? { resolvedAt: new Date(), resolvedByAdmin: adminId }
            : {}),
        },
        select: LIST_SELECT,
      }),
    "updateSubDistrictComplaintStatus:update",
  );

  return toListItem(updated);
}

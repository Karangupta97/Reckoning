/**
 * Complaint service — all SmartReport business logic.
 *
 * Controllers stay thin and delegate everything here. The module owns:
 *   - media-ownership validation (IDOR + reuse prevention),
 *   - best-effort reverse geocoding,
 *   - PostGIS authority auto-assignment + nearby search,
 *   - severity heuristics and atomic per-country ticket numbering,
 *   - transactional complaint creation, and
 *   - public/owner/admin-aware response shaping that NEVER leaks `userId`.
 *
 * Identity model: `userId` is always persisted (moderation/abuse), but anonymous
 * complaints surface as {@link ANONYMOUS_LABEL} everywhere except to the owner.
 */

import { Prisma, type Country } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { query } from "../../config/db.js";
import { getSignedDownloadUrl } from "../../config/s3.js";
import { resolveMediaUrl } from "../../services/s3.service.js";
import { AppError } from "../../utils/AppError.js";
import { reverseGeocode, isoCodeForCountry } from "../../services/geocode.service.js";
import {
  enqueueAiAnalysis,
  enqueueAuthorityNotification,
  enqueueAdminNotification,
  enqueueComplaintConfirmation,
  enqueueAuthorityAssignment,
} from "../../services/queue.service.js";
import {
  composeAddress,
  computeSeverity,
  formatTicketNumber,
  isWithinCountryBounds,
  validateCoordinates,
} from "./complaint.helpers.js";
import {
  ANONYMOUS_LABEL,
  type ComplaintDetail,
  type ComplaintListItem,
  type ComplaintListResult,
  type ComplaintMediaView,
  type CreateComplaintInput,
  type CreateComplaintResult,
  type DuplicateWarning,
  type ListComplaintsQuery,
  type ListMyComplaintsQuery,
  type MyComplaintsStatsResult,
  type Requester,
  type UpdateComplaintInput,
} from "./complaint.types.js";

/** Radius (metres) within which a same-category report is a soft duplicate. */
const DUPLICATE_RADIUS_METERS = 500;

/**
 * Run a DB operation, converting unexpected Prisma/driver errors into a
 * generic 500 {@link AppError} while letting deliberate `AppError`s pass.
 *
 * @param operation Async DB work.
 * @param context   Short label for server-side logs.
 * @returns The operation's result.
 */
async function dbGuard<T>(operation: () => Promise<T>, context: string): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) throw error;
    // eslint-disable-next-line no-console
    console.error(`[complaint.service] DB error during ${context}:`, error);
    throw new AppError("A database error occurred. Please try again.", 500, {
      cause: error,
    });
  }
}

/** Prisma `include` shaping the relations needed to build a response. */
const COMPLAINT_INCLUDE = {
  media: {
    orderBy: { order: "asc" },
    include: {
      media: { select: { id: true, s3Key: true, url: true, mimeType: true } },
    },
  },
  authority: {
    select: { id: true, name: true, type: true, country: true },
  },
} satisfies Prisma.ComplaintInclude;

/** A complaint row with the {@link COMPLAINT_INCLUDE} relations attached. */
type ComplaintWithRelations = Prisma.ComplaintGetPayload<{
  include: typeof COMPLAINT_INCLUDE;
}>;

/**
 * Project linked media rows into the public media view (ordered, primary-first
 * by `order`). Generates **fresh** short-lived signed URLs from `s3Key` on
 * every call — the stored `url` column is treated as a fallback only.
 *
 * @param complaint A complaint with its `media` relation loaded.
 * @returns Ordered media views with fresh presigned URLs.
 */
async function toMediaViews(complaint: ComplaintWithRelations): Promise<ComplaintMediaView[]> {
  return Promise.all(
    complaint.media.map(async (link) => ({
      id: link.media.id,
      url: await resolveMediaUrl(link.media.s3Key),
      mimeType: link.media.mimeType,
      isPrimary: link.isPrimary,
      order: link.order,
    })),
  );
}

/**
 * Resolve the public reporter label, honouring anonymity.
 *
 * @param isAnonymous Whether the complaint is anonymous.
 * @param fullName    Reporter's name (only used when not anonymous).
 * @returns The name, or {@link ANONYMOUS_LABEL}.
 */
function reporterLabel(isAnonymous: boolean, fullName: string | null): string {
  return isAnonymous || !fullName ? ANONYMOUS_LABEL : fullName;
}

/**
 * Atomically obtain the next ticket sequence for a (country, year) pair.
 *
 * Uses an upsert with an atomic increment so concurrent submissions never
 * collide on a sequence value. Must run INSIDE the create transaction.
 *
 * @param tx      Prisma transaction client.
 * @param country Complaint country.
 * @param year    Four-digit year.
 * @returns The freshly-allocated sequence number (≥ 1).
 */
async function nextTicketSequence(
  tx: Prisma.TransactionClient,
  country: Country,
  year: number,
): Promise<number> {
  const counter = await tx.ticketCounter.upsert({
    where: { country_year: { country, year } },
    create: { country, year, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  return counter.lastSeq;
}

/**
 * STEP 1 — Validate that every media id belongs to `userId`, is not deleted,
 * and is not already linked to another complaint.
 *
 * @param mediaIds Ids supplied in the request (1–5).
 * @param userId   Authenticated owner id.
 * @returns The media rows (url + mimeType), in request order.
 * @throws {AppError} 400 when any id is invalid, foreign, deleted, or reused.
 */
async function validateMediaOwnership(
  mediaIds: string[],
  userId: string,
): Promise<Array<{ id: string; url: string; mimeType: string }>> {
  const unique = [...new Set(mediaIds)];
  if (unique.length !== mediaIds.length) {
    throw new AppError("Duplicate media ids are not allowed.", 400, {
      code: "INVALID_MEDIA",
    });
  }

  const rows = await dbGuard(
    () =>
      prisma.mediaUpload.findMany({
        where: { id: { in: unique } },
        select: { id: true, userId: true, url: true, mimeType: true, isDeleted: true, linkedAt: true },
      }),
    "validateMediaOwnership",
  );

  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const id of unique) {
    const row = byId.get(id);
    if (!row || row.userId !== userId || row.isDeleted || row.linkedAt) {
      throw new AppError("Invalid media files.", 400, { code: "INVALID_MEDIA" });
    }
  }

  // Preserve the caller's order (drives isPrimary/order on link rows).
  return mediaIds.map((id) => {
    const row = byId.get(id)!;
    return { id: row.id, url: row.url, mimeType: row.mimeType };
  });
}

/**
 * STEP 3 — Find the most-specific active authority whose PostGIS boundary
 * covers the point, scoped to the country.
 *
 * Uses `ST_Covers(boundary, point)` (the geography-native containment test).
 * Returns `null` when no authority matches (an admin assigns later).
 *
 * A 10-second statement timeout ensures this never blocks the request for
 * longer than acceptable even if the spatial index is missing or data is
 * unexpectedly complex.
 *
 * @param country   Complaint country.
 * @param latitude  Latitude in decimal degrees.
 * @param longitude Longitude in decimal degrees.
 * @returns The matching authority id, or `null`.
 */
async function findAssignedAuthority(
  country: Country,
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const result = await query<{ id: string }>(
      `SELECT id
       FROM "authorities"
       WHERE "isActive" = true
         AND country::text = $1
         AND boundary IS NOT NULL
         AND ST_Covers(
           boundary,
           ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography
         )
       ORDER BY type ASC
       LIMIT 1`,
      [country, latitude, longitude],
    );
    return result.rows[0]?.id ?? null;
  } catch (error) {
    // If the query times out or fails, log and continue — admin assigns later.
    // eslint-disable-next-line no-console
    console.warn(
      "[complaint.service] findAssignedAuthority failed; continuing without auto-assignment:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/**
 * Resolve the sub-district whose geofence contains the point.
 *
 * Attempt 1: ST_Contains — exact polygon containment.
 * Attempt 2: ST_DWithin nearest within 10 km — handles boundary-edge points.
 *
 * Returns `null` only when both attempts find no sub-district within 10 km
 * (i.e. the coordinates are outside any mapped zone entirely).
 *
 * @param latitude  WGS84 latitude.
 * @param longitude WGS84 longitude.
 * @returns The sub-district id, or `null`.
 */
async function findSubDistrictForPoint(
  latitude: number,
  longitude: number,
): Promise<{ subDistrictId: string; districtId: string } | null> {
  try {
    // Attempt 1 — exact containment
    const exact = await query<{ id: string; districtId: string }>(
      `SELECT id, "districtId"
       FROM "sub_districts"
       WHERE "isActive" = true
         AND boundary IS NOT NULL
         AND ST_Contains(
           boundary,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)
         )
       LIMIT 1`,
      [longitude, latitude],
    );
    if (exact.rows[0]?.id) {
      return { subDistrictId: exact.rows[0].id, districtId: exact.rows[0].districtId };
    }

    // Attempt 2 — nearest within 10 km
    const nearest = await query<{ id: string; districtId: string }>(
      `SELECT id, "districtId"
       FROM "sub_districts"
       WHERE "isActive" = true
         AND boundary IS NOT NULL
         AND ST_DWithin(
           boundary::geography,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           10000
         )
       ORDER BY ST_Distance(
         boundary::geography,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
       ) ASC
       LIMIT 1`,
      [longitude, latitude],
    );
    if (nearest.rows[0]?.id) {
      return { subDistrictId: nearest.rows[0].id, districtId: nearest.rows[0].districtId };
    }
    return null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      "[complaint.service] findSubDistrictForPoint failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/**
 * STEP (security) — Detect a soft duplicate: a same-category complaint by the
 * same user within {@link DUPLICATE_RADIUS_METERS} in the last 24 hours.
 *
 * A 10-second statement timeout ensures this never blocks the request.
 *
 * @param userId    Reporter id.
 * @param category  Issue category (compared as text).
 * @param latitude  Latitude in decimal degrees.
 * @param longitude Longitude in decimal degrees.
 * @returns A {@link DuplicateWarning} when one is found, else `null`.
 */
async function detectDuplicate(
  userId: string,
  category: string,
  latitude: number,
  longitude: number,
): Promise<DuplicateWarning | null> {
  try {
    const result = await query<{ ticketNumber: string }>(
      `SELECT "ticketNumber"
       FROM "complaints"
       WHERE "userId" = $1
         AND category::text = $2
         AND "deletedAt" IS NULL
         AND "createdAt" > NOW() - INTERVAL '24 hours'
         AND location IS NOT NULL
         AND ST_DWithin(
           location,
           ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography,
           $5
         )
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      [userId, category, latitude, longitude, DUPLICATE_RADIUS_METERS],
    );
    const ticket = result.rows[0]?.ticketNumber;
    return ticket ? { isDuplicate: true, existingTicket: ticket } : null;
  } catch (error) {
    // Duplicate detection is best-effort; never block submission.
    // eslint-disable-next-line no-console
    console.warn(
      "[complaint.service] detectDuplicate failed; continuing without check:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/**
 * Create a new complaint for an authenticated user.
 *
 * @param userId    Authenticated reporter id.
 * @param input     Validated complaint payload.
 * @param _ipAddress Client IP (reserved for future audit logging).
 * @returns The created-complaint response (plus a soft duplicate warning).
 * @throws {AppError} 400 on invalid media/coordinates/country mismatch.
 */
export async function createComplaint(
  userId: string,
  input: CreateComplaintInput,
  _ipAddress?: string,
): Promise<CreateComplaintResult> {
  const { latitude, longitude, mediaIds, category } = input;

  // 0. Local geospatial sanity check (rejects (0,0) and out-of-region points).
  const coordCheck = validateCoordinates(latitude, longitude);
  if (!coordCheck.ok) {
    throw new AppError(coordCheck.reason ?? "Invalid coordinates.", 400, {
      code: "INVALID_COORDINATES",
    });
  }

  // Authoritative user (name for the response, country for validation).
  const user = await dbGuard(
    () =>
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, country: true },
      }),
    "createComplaint:findUser",
  );
  if (!user) {
    throw new AppError("User not found.", 404, { code: "USER_NOT_FOUND" });
  }
  const country = user.country;

  // Complaint must be inside the user's registered country (cheap box check).
  if (!isWithinCountryBounds(country, latitude, longitude)) {
    throw new AppError(
      "Report location is outside your registered country.",
      400,
      { code: "COUNTRY_MISMATCH" },
    );
  }

  // 1. Media ownership + reuse validation.
  const media = await validateMediaOwnership(mediaIds, userId);

  // 2–4. Run independent I/O operations in parallel to drastically reduce
  // wall-clock time. Each of these is independent of the others:
  //   - Reverse geocode (external HTTP, best-effort)
  //   - Authority auto-assignment (PostGIS containment)
  //   - Sub-district resolution (PostGIS containment → nearest fallback)
  //   - Duplicate detection (PostGIS proximity)
  const [geo, assignedTo, subDistrictResult, duplicateWarning] = await Promise.all([
    reverseGeocode(latitude, longitude),
    findAssignedAuthority(country, latitude, longitude),
    findSubDistrictForPoint(latitude, longitude),
    detectDuplicate(userId, category, latitude, longitude),
  ]);

  if (!subDistrictResult || !subDistrictResult.subDistrictId || !subDistrictResult.districtId) {
    throw new AppError("Could not determine jurisdiction for provided coordinates", 422, {
      code: "LOCATION_UNRESOLVABLE",
    });
  }
  const { subDistrictId, districtId } = subDistrictResult;

  // Validate geocoded country only if we got a result with a country code.
  if (geo?.countryCode && geo.countryCode !== isoCodeForCountry(country)) {
    throw new AppError(
      "Report location does not match your registered country.",
      400,
      { code: "COUNTRY_MISMATCH" },
    );
  }
  const address =
    geo?.address ??
    composeAddress([input.roadName || geo?.roadName, geo?.district, geo?.state, geo?.countryName]);
  const roadName = input.roadName ?? geo?.roadName ?? undefined;

  // 4. Severity heuristic (synchronous, fast).
  const severity = computeSeverity({
    category,
    ...(input.aiConfidence !== undefined ? { aiConfidence: input.aiConfidence } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.suggestedFix !== undefined ? { suggestedFix: input.suggestedFix } : {}),
  });

  const aiDetected =
    input.aiCategory !== undefined || input.aiConfidence !== undefined;
  const year = new Date().getUTCFullYear();

  // 5 + 6. Atomic create: ticket sequence → complaint → location → media links.
  // Capped at 20 s so contention on the ticket counter never stalls the request
  // beyond a recoverable window.
  const complaint = await dbGuard(
    () =>
      prisma.$transaction(async (tx) => {
        const seq = await nextTicketSequence(tx, country, year);
        const ticketNumber = formatTicketNumber(country, year, seq);

        const created = await tx.complaint.create({
          data: {
            id: `CMP-${1000 + seq}`,
            userId,
            isAnonymous: input.isAnonymous ?? false,
            category,
            description: input.description ?? null,
            suggestedFix: input.suggestedFix ?? null,
            latitude,
            longitude,
            address: address ?? null,
            roadName: roadName ?? null,
            roadNumber: input.roadNumber ?? null,
            landmark: input.landmark ?? null,
            direction: input.direction ?? null,
            country,
            aiDetected,
            aiCategory: input.aiCategory ?? null,
            aiConfidence: input.aiConfidence ?? null,
            aiRawResult: input.aiRawResult
              ? (input.aiRawResult as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            aiAnnotatedImageKey: input.aiAnnotatedImageKey ?? null,
            severity,
            assignedTo,
            subDistrictId,
            districtId,
            ticketNumber,
          },
          select: {
            id: true,
            ticketNumber: true,
            category: true,
            severity: true,
            status: true,
            isAnonymous: true,
            createdAt: true,
          },
        });

        // Set the PostGIS geography point (Prisma can't write Unsupported cols).
        await tx.$executeRaw`
          UPDATE "complaints"
          SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
          WHERE id = ${created.id}
        `;

        await tx.complaintMedia.createMany({
          data: media.map((m, index) => ({
            complaintId: created.id,
            mediaId: m.id,
            isPrimary: index === 0,
            order: index,
          })),
        });

        // Mark media as used so it can never be linked to another complaint.
        await tx.mediaUpload.updateMany({
          where: { id: { in: media.map((m) => m.id) } },
          data: { linkedAt: new Date() },
        });

        return created;
      }, { timeout: 20_000 }),
    "createComplaint:transaction",
  );

  // 7. Fire-and-forget background jobs — run all in parallel since they are
  // independent. None of these should block the HTTP response.
  const backgroundJobs: Array<Promise<void>> = [
    enqueueAiAnalysis(complaint.id),
    enqueueAdminNotification(complaint.id),
    enqueueComplaintConfirmation(complaint.id, userId),
    enqueueAuthorityAssignment(complaint.id),
  ];
  if (assignedTo) {
    backgroundJobs.push(enqueueAuthorityNotification(complaint.id, assignedTo));
  }
  // Await all in parallel — each is individually safe (catches internally).
  await Promise.all(backgroundJobs);

  // 8. Response.
  return {
    id: complaint.id,
    ticketNumber: complaint.ticketNumber,
    category: complaint.category,
    severity: complaint.severity,
    status: complaint.status,
    location: { latitude, longitude, address: address ?? null },
    isAnonymous: complaint.isAnonymous,
    media: media.map((m, index) => ({
      url: m.url,
      mimeType: m.mimeType,
      isPrimary: index === 0,
    })),
    submittedBy: reporterLabel(complaint.isAnonymous, user.fullName),
    createdAt: complaint.createdAt,
    ...(duplicateWarning ? { duplicateWarning } : {}),
  };
}

/** A single row returned by the nearby raw-SQL pre-filter. */
interface NearbyRow {
  id: string;
  distance: number;
}

/**
 * Run the PostGIS-backed nearby pre-filter, returning matching ids (ordered +
 * paginated) and the total match count.
 *
 * Built with parameterised SQL ($1, $2, …) — values are never interpolated —
 * so it is injection-safe despite the dynamic filters.
 *
 * @param q      Validated list query (must include `lat`/`lng`).
 * @param offset Pagination offset.
 * @returns Ordered `{ id, distance }` rows for the page, plus the total.
 */
async function nearbyComplaintIds(
  q: ListComplaintsQuery,
  offset: number,
): Promise<{ rows: NearbyRow[]; total: number }> {
  const params: unknown[] = [q.lng, q.lat, q.radius];
  const conditions: string[] = [
    `"deletedAt" IS NULL`,
    `location IS NOT NULL`,
    `ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`,
  ];

  const addFilter = (column: string, value: unknown, cast = ""): void => {
    params.push(value);
    conditions.push(`${column}${cast} = $${params.length}`);
  };

  if (q.category) addFilter(`category`, q.category, "::text");
  if (q.status) addFilter(`status`, q.status, "::text");
  if (q.severity) addFilter(`severity`, q.severity, "::text");
  if (q.country) addFilter(`country`, q.country, "::text");
  if (q.startDate) {
    params.push(q.startDate);
    conditions.push(`"createdAt" >= $${params.length}`);
  }
  if (q.endDate) {
    params.push(q.endDate);
    conditions.push(`"createdAt" <= $${params.length}`);
  }

  const where = conditions.join(" AND ");
  const orderBy = buildRawOrderBy(q);

  const countResult = await dbGuard(
    () => query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "complaints" WHERE ${where}`, params),
    "nearbyComplaintIds:count",
  );
  const total = Number.parseInt(countResult.rows[0]?.count ?? "0", 10);

  const pageParams = [...params, q.limit, offset];
  const limitPlaceholder = `$${pageParams.length - 1}`;
  const offsetPlaceholder = `$${pageParams.length}`;

  const rowsResult = await dbGuard(
    () =>
      query<NearbyRow>(
        `SELECT id,
                ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance
         FROM "complaints"
         WHERE ${where}
         ${orderBy}
         LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
        pageParams,
      ),
    "nearbyComplaintIds:rows",
  );

  return { rows: rowsResult.rows.map((r) => ({ id: r.id, distance: Number(r.distance) })), total };
}

/**
 * Build the `ORDER BY` clause for the raw nearby query, honouring `sortBy`.
 * Severity sorts by rank; distance is the implicit tiebreaker for nearby.
 *
 * @param q Validated list query.
 * @returns A SQL `ORDER BY ...` fragment (no user input interpolated).
 */
function buildRawOrderBy(q: ListComplaintsQuery): string {
  const dir = q.sortOrder === "asc" ? "ASC" : "DESC";
  if (q.sortBy === "severity") {
    return `ORDER BY CASE severity::text
              WHEN 'CRITICAL' THEN 3 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 1 ELSE 0 END ${dir},
              distance ASC`;
  }
  if (q.sortBy === "upvotes") {
    return `ORDER BY upvotes ${dir}, distance ASC`;
  }
  return `ORDER BY "createdAt" ${dir}, distance ASC`;
}

/**
 * Build the Prisma `orderBy` for the non-spatial list path.
 *
 * @param q Validated list query.
 * @returns A Prisma order-by object.
 */
function buildPrismaOrderBy(q: ListComplaintsQuery): Prisma.ComplaintOrderByWithRelationInput {
  return { [q.sortBy]: q.sortOrder } as Prisma.ComplaintOrderByWithRelationInput;
}

/**
 * Map a complaint (with relations) to a public list item, attaching distance
 * when provided. Never exposes `userId`.
 *
 * @param c        Complaint with relations.
 * @param fullName Reporter name (for the non-anonymous label).
 * @param distance Optional distance in metres from the query point.
 * @returns A public {@link ComplaintListItem}.
 */
async function toListItem(
  c: ComplaintWithRelations & { user?: { fullName: string } | null },
  fullName: string | null,
  distance?: number,
): Promise<ComplaintListItem> {
  const primary = c.media.find((m) => m.isPrimary) ?? c.media[0];
  const primaryMedia = primary
    ? { url: await resolveMediaUrl(primary.media.s3Key), mimeType: primary.media.mimeType }
    : null;
  return {
    id: c.id,
    ticketNumber: c.ticketNumber,
    category: c.category,
    severity: c.severity,
    status: c.status,
    description: c.description,
    location: {
      latitude: c.latitude,
      longitude: c.longitude,
      address: c.address,
      ...(distance !== undefined ? { distance: Math.round(distance) } : {}),
    },
    country: c.country,
    submittedBy: reporterLabel(c.isAnonymous, fullName),
    primaryMedia,
    upvotes: c.upvotes,
    viewCount: c.viewCount,
    assignedAuthority: c.authority ? { name: c.authority.name, type: c.authority.type } : null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

/**
 * List complaints with filtering, optional PostGIS nearby search, sorting, and
 * offset pagination. Always excludes soft-deleted rows and never exposes
 * reporter ids.
 *
 * @param q Validated list query.
 * @returns A paginated list result.
 */
export async function listComplaints(q: ListComplaintsQuery): Promise<ComplaintListResult> {
  const offset = (q.page - 1) * q.limit;

  // Spatial path: PostGIS pre-filter for ids + distance, then hydrate.
  if (q.lat !== undefined && q.lng !== undefined) {
    const { rows, total } = await nearbyComplaintIds(q, offset);
    const ids = rows.map((r) => r.id);
    const distanceById = new Map(rows.map((r) => [r.id, r.distance]));

    const records = ids.length
      ? await dbGuard(
          () =>
            prisma.complaint.findMany({
              where: { id: { in: ids } },
              include: { ...COMPLAINT_INCLUDE, user: { select: { fullName: true } } },
            }),
          "listComplaints:hydrateNearby",
        )
      : [];

    // Preserve the SQL ordering (findMany does not guarantee `in` order).
    const byId = new Map(records.map((r) => [r.id, r]));
    const complaints = await Promise.all(
      ids
        .map((id) => byId.get(id))
        .filter((r): r is (typeof records)[number] => Boolean(r))
        .map((r) => toListItem(r, r.user?.fullName ?? null, distanceById.get(r.id))),
    );

    return { complaints, pagination: paginate(total, q.page, q.limit) };
  }

  // Non-spatial path: pure Prisma.
  const where: Prisma.ComplaintWhereInput = {
    deletedAt: null,
    ...(q.category ? { category: q.category } : {}),
    ...(q.status ? { status: q.status } : {}),
    ...(q.severity ? { severity: q.severity } : {}),
    ...(q.country ? { country: q.country } : {}),
    ...(q.startDate || q.endDate
      ? {
          createdAt: {
            ...(q.startDate ? { gte: new Date(q.startDate) } : {}),
            ...(q.endDate ? { lte: new Date(q.endDate) } : {}),
          },
        }
      : {}),
  };

  const [total, records] = await dbGuard(
    () =>
      prisma.$transaction([
        prisma.complaint.count({ where }),
        prisma.complaint.findMany({
          where,
          include: { ...COMPLAINT_INCLUDE, user: { select: { fullName: true } } },
          orderBy: buildPrismaOrderBy(q),
          skip: offset,
          take: q.limit,
        }),
      ]),
    "listComplaints:query",
  );

  const complaints = await Promise.all(records.map((r) => toListItem(r, r.user?.fullName ?? null)));
  return { complaints, pagination: paginate(total, q.page, q.limit) };
}

/**
 * Build a pagination metadata block.
 *
 * @param total Total matching rows.
 * @param page  Current 1-based page.
 * @param limit Page size.
 * @returns Pagination metadata.
 */
function paginate(total: number, page: number, limit: number) {
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

/**
 * Build the full detail view for a single complaint, applying identity rules.
 *
 * @param c         Complaint with relations + reporter name.
 * @param requester The caller, when authenticated.
 * @returns A {@link ComplaintDetail} (owner sees `isAnonymous`).
 */
async function toDetail(
  c: ComplaintWithRelations & { user: { fullName: string } | null },
  requester?: Requester,
): Promise<ComplaintDetail> {
  const isOwner = requester?.id === c.userId;
  const fullName = c.user?.fullName ?? null;

  // Generate presigned URL for annotated image if available.
  const aiAnnotatedImage = c.aiAnnotatedImageKey
    ? await getSignedDownloadUrl(c.aiAnnotatedImageKey, 3600).catch(() => null)
    : null;

  const detail: ComplaintDetail = {
    id: c.id,
    ticketNumber: c.ticketNumber,
    category: c.category,
    severity: c.severity,
    status: c.status,
    description: c.description,
    suggestedFix: c.suggestedFix,
    location: {
      latitude: c.latitude,
      longitude: c.longitude,
      address: c.address,
      roadName: c.roadName,
      roadNumber: c.roadNumber,
      landmark: c.landmark,
      direction: c.direction,
    },
    country: c.country,
    submittedBy: reporterLabel(c.isAnonymous, fullName),
    media: await toMediaViews(c),
    aiDetected: c.aiDetected,
    aiCategory: c.aiCategory,
    aiConfidence: c.aiConfidence,
    aiAnnotatedImage,
    aiRawResult: c.aiRawResult ?? null,
    upvotes: c.upvotes,
    viewCount: c.viewCount,
    assignedAuthority: c.authority
      ? { id: c.authority.id, name: c.authority.name, type: c.authority.type, country: c.authority.country }
      : null,
    timeline: [], // populated by the workflow layer (SOON)
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };

  // Only the owner learns the anonymity setting of their own complaint.
  if (isOwner) detail.isAnonymous = c.isAnonymous;
  return detail;
}

/**
 * Fetch a single complaint by id, increment its view count, and shape the
 * response according to the requester's relationship to it.
 *
 * @param id        Complaint id.
 * @param requester The caller, when authenticated (optional).
 * @returns The complaint detail.
 * @throws {AppError} 404 when missing or soft-deleted (existence not revealed).
 */
export async function getComplaintById(
  id: string,
  requester?: Requester,
): Promise<ComplaintDetail> {
  const complaint = await dbGuard(
    () =>
      prisma.complaint.findUnique({
        where: { id },
        include: { ...COMPLAINT_INCLUDE, user: { select: { fullName: true } } },
      }),
    "getComplaintById:find",
  );

  if (!complaint || complaint.deletedAt) {
    throw new AppError("Complaint not found.", 404, { code: "NOT_FOUND" });
  }

  // Atomic view-count bump (don't block the response on a failure).
  await dbGuard(
    () => prisma.complaint.update({ where: { id }, data: { viewCount: { increment: 1 } }, select: { id: true } }),
    "getComplaintById:incrementView",
  );
  complaint.viewCount += 1;

  return toDetail(complaint, requester);
}

/**
 * Update an owner's complaint (or any complaint for an ADMIN).
 *
 * Only the limited set of citizen-editable fields may change; status, severity,
 * assignment, and AI fields are managed by the workflow/admin layer.
 *
 * @param id        Complaint id.
 * @param requester Authenticated caller.
 * @param input     Validated update payload.
 * @returns The updated complaint detail.
 * @throws {AppError} 404 when missing/deleted; 403 when not owner/admin.
 */
export async function updateComplaint(
  id: string,
  requester: Requester,
  input: UpdateComplaintInput,
): Promise<ComplaintDetail> {
  const existing = await dbGuard(
    () => prisma.complaint.findUnique({ where: { id }, select: { id: true, userId: true, deletedAt: true } }),
    "updateComplaint:find",
  );
  if (!existing || existing.deletedAt) {
    throw new AppError("Complaint not found.", 404, { code: "NOT_FOUND" });
  }
  if (existing.userId !== requester.id && requester.role !== "ADMIN") {
    throw new AppError("You can only edit your own complaints.", 403, {
      code: "FORBIDDEN",
    });
  }

  const data: Prisma.ComplaintUpdateInput = {
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.suggestedFix !== undefined ? { suggestedFix: input.suggestedFix } : {}),
    ...(input.roadName !== undefined ? { roadName: input.roadName } : {}),
    ...(input.roadNumber !== undefined ? { roadNumber: input.roadNumber } : {}),
    ...(input.landmark !== undefined ? { landmark: input.landmark } : {}),
    ...(input.direction !== undefined ? { direction: input.direction } : {}),
    ...(input.isAnonymous !== undefined ? { isAnonymous: input.isAnonymous } : {}),
  };

  const updated = await dbGuard(
    () =>
      prisma.complaint.update({
        where: { id },
        data,
        include: { ...COMPLAINT_INCLUDE, user: { select: { fullName: true } } },
      }),
    "updateComplaint:update",
  );

  return toDetail(updated, requester);
}

/**
 * Soft-delete a complaint (owner or ADMIN). The row is retained (with
 * `deletedAt`/`deletedBy` stamped) so moderation history survives; media is
 * left intact for audit.
 *
 * @param id        Complaint id.
 * @param requester Authenticated caller.
 * @returns A confirmation message.
 * @throws {AppError} 404 when missing/already deleted; 403 when not owner/admin.
 */
export async function deleteComplaint(
  id: string,
  requester: Requester,
): Promise<{ message: string }> {
  const existing = await dbGuard(
    () => prisma.complaint.findUnique({ where: { id }, select: { id: true, userId: true, deletedAt: true } }),
    "deleteComplaint:find",
  );
  if (!existing || existing.deletedAt) {
    throw new AppError("Complaint not found.", 404, { code: "NOT_FOUND" });
  }
  if (existing.userId !== requester.id && requester.role !== "ADMIN") {
    throw new AppError("You can only delete your own complaints.", 403, {
      code: "FORBIDDEN",
    });
  }

  await dbGuard(
    () =>
      prisma.complaint.update({
        where: { id },
        data: { deletedAt: new Date(), deletedBy: requester.id },
        select: { id: true },
      }),
    "deleteComplaint:softDelete",
  );

  return { message: "Complaint deleted." };
}

// ─── Citizen /my endpoints ──────────────────────────────────────────────────

/**
 * List the authenticated user's own complaints with search, status filter,
 * sorting, and pagination.
 *
 * @param userId Authenticated reporter id.
 * @param q      Validated query parameters.
 * @returns A paginated list of the user's complaints.
 */
export async function listMyComplaints(
  userId: string,
  q: ListMyComplaintsQuery,
): Promise<ComplaintListResult> {
  const offset = (q.page - 1) * q.limit;

  const where: Prisma.ComplaintWhereInput = {
    userId,
    deletedAt: null,
    ...(q.status ? { status: q.status } : {}),
    ...(q.search
      ? {
          OR: [
            { description: { contains: q.search, mode: "insensitive" as const } },
            { address: { contains: q.search, mode: "insensitive" as const } },
            { ticketNumber: { contains: q.search, mode: "insensitive" as const } },
            { roadName: { contains: q.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  // Map sort field to Prisma orderBy
  const sortField =
    q.sort === "severity"
      ? "severity"
      : q.sort === "status"
        ? "status"
        : "createdAt";
  const orderBy = { [sortField]: q.sortOrder } as Prisma.ComplaintOrderByWithRelationInput;

  const [total, records] = await dbGuard(
    () =>
      prisma.$transaction([
        prisma.complaint.count({ where }),
        prisma.complaint.findMany({
          where,
          include: { ...COMPLAINT_INCLUDE, user: { select: { fullName: true } } },
          orderBy,
          skip: offset,
          take: q.limit,
        }),
      ]),
    "listMyComplaints:query",
  );

  const complaints = await Promise.all(
    records.map(async (r) => {
      const item = await toListItem(r, r.user?.fullName ?? null);
      const annotatedImage = r.aiAnnotatedImageKey
        ? await getSignedDownloadUrl(r.aiAnnotatedImageKey, 3600).catch(() => null)
        : null;
      return {
        ...item,
        media: await Promise.all(
          r.media.map(async (m) => ({
            id: m.media.id,
            url: await resolveMediaUrl(m.media.s3Key),
            mimeType: m.media.mimeType,
            isPrimary: m.isPrimary,
          })),
        ),
        aiDetected: r.aiDetected,
        aiCategory: r.aiCategory,
        aiConfidence: r.aiConfidence,
        aiAnnotatedImage: annotatedImage,
        aiRawResult: r.aiRawResult ?? null,
      };
    })
  );

  return { complaints, pagination: paginate(total, q.page, q.limit) };
}

/**
 * Aggregate stats for the authenticated user's complaints: counts per status,
 * hazard breakdown by category, resolution rate, and recent activity events.
 *
 * @param userId Authenticated reporter id.
 * @returns The aggregated stats.
 */
export async function getMyStats(
  userId: string,
): Promise<MyComplaintsStatsResult> {
  // Status counts via groupBy
  const statusCounts = await dbGuard(
    () =>
      prisma.complaint.groupBy({
        by: ["status"],
        where: { userId, deletedAt: null },
        _count: { id: true },
      }),
    "getMyStats:statusCounts",
  );

  const countByStatus = new Map(
    statusCounts.map((row) => [row.status, row._count.id]),
  );

  const total = [...countByStatus.values()].reduce((a, b) => a + b, 0);
  const resolved = countByStatus.get("RESOLVED" as any) ?? 0;
  const rejected = countByStatus.get("REJECTED" as any) ?? 0;
  const inProgress = countByStatus.get("IN_PROGRESS" as any) ?? 0;
  const open =
    (countByStatus.get("SUBMITTED" as any) ?? 0) +
    (countByStatus.get("VERIFIED" as any) ?? 0) +
    (countByStatus.get("ASSIGNED" as any) ?? 0);

  // Hazard breakdown by category
  const categoryCounts = await dbGuard(
    () =>
      prisma.complaint.groupBy({
        by: ["category"],
        where: { userId, deletedAt: null },
        _count: { id: true },
      }),
    "getMyStats:categoryCounts",
  );

  const hazardBreakdown: MyComplaintsStatsResult["hazardBreakdown"] =
    categoryCounts.map((row) => ({
      category: row.category,
      count: row._count.id,
    }));

  // Resolution rate
  const resolutionRate =
    total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Recent activity: last 5 status changes from statusHistory if available,
  // otherwise fall back to the 5 most recently updated complaints.
  const recentComplaints = await dbGuard(
    () =>
      prisma.complaint.findMany({
        where: { userId, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          ticketNumber: true,
          status: true,
          category: true,
          updatedAt: true,
        },
      }),
    "getMyStats:recentActivity",
  );

  const statusToActivityType: Record<string, MyComplaintsStatsResult["recentActivity"][number]["type"]> = {
    RESOLVED: "resolved",
    ASSIGNED: "assigned",
    REJECTED: "rejected",
    VERIFIED: "verified",
    IN_PROGRESS: "response",
    SUBMITTED: "response",
  };

  const recentActivity: MyComplaintsStatsResult["recentActivity"] =
    recentComplaints.map((c) => ({
      text: `${c.ticketNumber} — ${c.status.toLowerCase().replace("_", " ")}`,
      type: statusToActivityType[c.status] ?? "response",
      createdAt: c.updatedAt,
    }));

  return {
    total,
    open,
    inProgress,
    resolved,
    rejected,
    hazardBreakdown,
    resolutionRate,
    recentActivity,
  };
}

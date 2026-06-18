/**
 * Geofence helpers — GeoJSON validation + PostGIS persistence.
 *
 * Districts and sub-districts store their boundary in a
 * `geometry(Polygon, 4326)` column that Prisma models as `Unsupported` and
 * cannot write directly. These helpers:
 *
 *   - validate an incoming GeoJSON Polygon shape (structure only — PostGIS does
 *     the authoritative geometry validation), and
 *   - write the geometry via `ST_GeomFromGeoJSON` inside a transaction, and
 *   - run the `ST_Within` containment check for sub-district boundaries.
 *
 * All raw SQL is parameterised — GeoJSON is passed as a JSON string bind
 * parameter, never interpolated — so it is injection-safe.
 */

import type { Prisma } from "@prisma/client";
import { AppError } from "../../utils/AppError.js";
import type { GeoJsonPolygon } from "./admin.types.js";

/** Minimum positions in a valid (closed) linear ring. */
const MIN_RING_POSITIONS = 4;

/**
 * Validate the structural shape of a GeoJSON Polygon.
 *
 * Checks the `type`, ring counts, position arity, coordinate ranges, and ring
 * closure. Geometry validity (self-intersection, winding) is left to PostGIS.
 *
 * @param value Candidate value (already JSON-parsed).
 * @returns `true` when the value is a structurally-valid Polygon.
 */
export function isGeoJsonPolygon(value: unknown): value is GeoJsonPolygon {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { type?: unknown; coordinates?: unknown };
  if (candidate.type !== "Polygon") return false;
  if (!Array.isArray(candidate.coordinates) || candidate.coordinates.length === 0) {
    return false;
  }

  for (const ring of candidate.coordinates) {
    if (!Array.isArray(ring) || ring.length < MIN_RING_POSITIONS) return false;
    for (const position of ring) {
      if (
        !Array.isArray(position) ||
        position.length < 2 ||
        typeof position[0] !== "number" ||
        typeof position[1] !== "number" ||
        position[0] < -180 ||
        position[0] > 180 ||
        position[1] < -90 ||
        position[1] > 90
      ) {
        return false;
      }
    }
    // Ring must be closed: first position === last position.
    const first = ring[0] as number[];
    const last = ring[ring.length - 1] as number[];
    if (first[0] !== last[0] || first[1] !== last[1]) return false;
  }
  return true;
}

/**
 * Assert that a value is a valid GeoJSON Polygon, throwing a 422 otherwise.
 *
 * @param value    Candidate geofence value.
 * @param fieldErr Field name surfaced in the error message.
 * @returns The value narrowed to {@link GeoJsonPolygon}.
 * @throws {AppError} 422 INVALID_GEOFENCE when the shape is invalid.
 */
export function assertGeoJsonPolygon(
  value: unknown,
  fieldErr = "geofence",
): GeoJsonPolygon {
  if (!isGeoJsonPolygon(value)) {
    throw new AppError(
      `Invalid ${fieldErr}: a closed GeoJSON Polygon (SRID 4326) is required.`,
      422,
      { code: "INVALID_GEOFENCE" },
    );
  }
  return value;
}

/**
 * Set a district's `geofence` column from a GeoJSON Polygon.
 *
 * Uses `ST_GeomFromGeoJSON` (which raises on malformed geometry) and forces
 * SRID 4326. MUST run inside the create/update transaction.
 *
 * @param tx       Prisma transaction client.
 * @param id       District id whose geofence to set.
 * @param geofence GeoJSON Polygon to persist.
 * @throws {AppError} 422 when PostGIS rejects the geometry.
 */
export async function setDistrictGeofence(
  tx: Prisma.TransactionClient,
  id: string,
  geofence: GeoJsonPolygon,
): Promise<void> {
  await runGeofenceWrite(
    () =>
      tx.$executeRaw`
        UPDATE "districts"
        SET geofence = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geofence)}), 4326)
        WHERE id = ${id}
      `,
  );
}

/**
 * Set a sub-district's `geofence` column from a GeoJSON Polygon.
 *
 * @param tx       Prisma transaction client.
 * @param id       Sub-district id whose geofence to set.
 * @param geofence GeoJSON Polygon to persist.
 * @throws {AppError} 422 when PostGIS rejects the geometry.
 */
export async function setSubDistrictGeofence(
  tx: Prisma.TransactionClient,
  id: string,
  geofence: GeoJsonPolygon,
): Promise<void> {
  await runGeofenceWrite(
    () =>
      tx.$executeRaw`
        UPDATE "sub_districts"
        SET geofence = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geofence)}), 4326)
        WHERE id = ${id}
      `,
  );
}

/**
 * Check whether a candidate sub-district polygon is fully contained within a
 * district's stored geofence (`ST_Within`).
 *
 * @param tx         Prisma transaction client (or base client).
 * @param districtId District whose boundary is the container.
 * @param geofence   Candidate sub-district GeoJSON Polygon.
 * @returns `true` when the candidate is within the district boundary.
 * @throws {AppError} 422 when the geometry is malformed; 404 when the district
 *         has no stored boundary to test against.
 */
export async function isWithinDistrict(
  tx: Prisma.TransactionClient,
  districtId: string,
  geofence: GeoJsonPolygon,
): Promise<boolean> {
  const rows = await runGeofenceQuery<{ within: boolean | null }>(
    () =>
      tx.$queryRaw<Array<{ within: boolean | null }>>`
        SELECT ST_Within(
                 ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geofence)}), 4326),
                 districts.geofence
               ) AS within
        FROM "districts" AS districts
        WHERE districts.id = ${districtId}
          AND districts.geofence IS NOT NULL
      `,
  );

  if (rows.length === 0) {
    throw new AppError(
      "Your district boundary is not configured. Contact your Super Admin.",
      404,
      { code: "DISTRICT_BOUNDARY_MISSING" },
    );
  }
  return rows[0]?.within === true;
}

/**
 * Execute a geofence write, mapping PostGIS geometry errors to a 422.
 *
 * @param op Async raw write returning the affected-row count.
 * @throws {AppError} 422 INVALID_GEOFENCE on a PostGIS geometry error.
 */
async function runGeofenceWrite(op: () => Promise<number>): Promise<void> {
  try {
    await op();
  } catch (error) {
    throw geofenceError(error);
  }
}

/**
 * Execute a geofence query, mapping PostGIS geometry errors to a 422.
 *
 * @param op Async raw query returning rows.
 * @returns The query rows.
 * @throws {AppError} 422 INVALID_GEOFENCE on a PostGIS geometry error.
 */
async function runGeofenceQuery<T>(op: () => Promise<T[]>): Promise<T[]> {
  try {
    return await op();
  } catch (error) {
    throw geofenceError(error);
  }
}

/**
 * Normalise a raw PostGIS error into a client-safe {@link AppError}.
 *
 * @param error Underlying driver error.
 * @returns A 422 when it looks like a geometry problem, else a generic 500.
 */
function geofenceError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const message = error instanceof Error ? error.message : String(error);
  // PostGIS geometry parse/validity failures surface as driver errors.
  if (/geojson|geometry|st_|invalid|srid/i.test(message)) {
    return new AppError("Invalid geofence geometry.", 422, {
      code: "INVALID_GEOFENCE",
      cause: error,
    });
  }
  // eslint-disable-next-line no-console
  console.error("[geofence] Unexpected PostGIS error:", error);
  return new AppError("A database error occurred. Please try again.", 500, {
    cause: error,
  });
}

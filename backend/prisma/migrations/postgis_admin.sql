-- ===========================================================================
-- Admin onboarding — PostGIS geometry columns + spatial indexes
-- ===========================================================================
-- District/SubDistrict boundaries are `geometry(Polygon, 4326)` columns that
-- Prisma models as `Unsupported(...)`. Prisma CAN create the columns but
-- CANNOT create the GIST indexes they need for fast ST_Within / ST_Covers
-- queries. This script:
--
--   1. ensures the PostGIS extension exists,
--   2. (idempotently) adds the geometry columns in case they are missing, and
--   3. creates the GIST indexes.
--
-- It is IDEMPOTENT — safe to run repeatedly. Apply it AFTER syncing the Prisma
-- schema (`prisma migrate dev` or `prisma db push`):
--
--   psql "$DIRECT_URL" -f prisma/migrations/postgis_admin.sql
--
-- Table names use Prisma's @@map values ("districts", "sub_districts").
-- ===========================================================================

-- 1. PostGIS extension (also declared in the datasource `extensions` block).
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Geometry columns (no-op when Prisma already created them).
ALTER TABLE "districts"     ADD COLUMN IF NOT EXISTS "geofence" geometry(Polygon, 4326);
ALTER TABLE "sub_districts" ADD COLUMN IF NOT EXISTS "geofence" geometry(Polygon, 4326);

-- 3. GIST spatial indexes (the part Prisma cannot express).
CREATE INDEX IF NOT EXISTS "districts_geofence_idx"
  ON "districts" USING GIST ("geofence");

CREATE INDEX IF NOT EXISTS "sub_districts_geofence_idx"
  ON "sub_districts" USING GIST ("geofence");

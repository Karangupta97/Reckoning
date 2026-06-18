-- ===========================================================================
-- SmartReport — PostGIS geography columns + spatial indexes
-- ===========================================================================
-- Prisma models geography columns as `Unsupported("geography(...)")?`, which
-- it CAN create, but it CANNOT create the GIST indexes they need for fast
-- spatial queries (ST_DWithin / ST_Covers). This script:
--
--   1. ensures the PostGIS extension exists,
--   2. (idempotently) adds the geography columns in case they are missing, and
--   3. creates the GIST indexes.
--
-- It is IDEMPOTENT — safe to run repeatedly. Apply it AFTER syncing the Prisma
-- schema (`prisma migrate dev` or `prisma db push`):
--
--   psql "$DIRECT_URL" -f prisma/migrations/postgis_smartreport.sql
--
-- Table names use Prisma's @@map values ("complaints", "authorities").
-- ===========================================================================

-- 1. PostGIS extension (also declared in the datasource `extensions` block).
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Geography columns (no-op when Prisma already created them).
ALTER TABLE "complaints"  ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326);
ALTER TABLE "authorities" ADD COLUMN IF NOT EXISTS "boundary" geography(Polygon, 4326);

-- 3. GIST spatial indexes (the part Prisma cannot express).
CREATE INDEX IF NOT EXISTS "complaint_location_idx"
  ON "complaints" USING GIST ("location");

CREATE INDEX IF NOT EXISTS "authority_boundary_idx"
  ON "authorities" USING GIST ("boundary");

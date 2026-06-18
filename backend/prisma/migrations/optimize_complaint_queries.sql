-- ===========================================================================
-- Optimize complaint submission query performance
-- ===========================================================================
-- Additional indexes to speed up the two PostGIS queries that run during
-- complaint creation:
--
--   1. findAssignedAuthority — covered by `authority_boundary_idx` (GIST) +
--      a new B-tree on (country, "isActive") to narrow the scan first.
--
--   2. detectDuplicate — needs a composite index on (userId, category,
--      createdAt DESC) so the planner can skip rows before the expensive
--      ST_DWithin geography computation.
--
-- Both queries already have GIST spatial indexes from postgis_smartreport.sql;
-- these additional B-tree indexes let PostgreSQL eliminate rows cheaply before
-- touching the spatial index.
--
-- IDEMPOTENT — safe to run repeatedly.
--
--   psql "$DIRECT_URL" -f prisma/migrations/optimize_complaint_queries.sql
-- ===========================================================================

-- Speed up findAssignedAuthority: filter by country + isActive before spatial.
CREATE INDEX IF NOT EXISTS "authority_country_active_idx"
  ON "authorities" ("country", "isActive")
  WHERE "isActive" = true AND "boundary" IS NOT NULL;

-- Speed up detectDuplicate: narrow by user + category + recent time window
-- before the expensive ST_DWithin computation.
CREATE INDEX IF NOT EXISTS "complaint_user_category_created_idx"
  ON "complaints" ("userId", "category", "createdAt" DESC)
  WHERE "deletedAt" IS NULL AND "location" IS NOT NULL;

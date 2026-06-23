/**
 * Add `subDistrictId` column (nullable FK to sub_districts) to complaints.
 *
 * Run: npx tsx prisma/migrations/applySubDistrictComplaint.ts
 */

import { query, closeDbPool } from "../../src/config/db.js";

async function main(): Promise<void> {
  console.log("Applying subDistrictId to complaints...");

  // Add the nullable foreign-key column
  await query(`
    ALTER TABLE "complaints"
    ADD COLUMN IF NOT EXISTS "subDistrictId" text
      REFERENCES "sub_districts"(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  `);

  // Create a regular B-tree index for fast lookups by sub-district
  await query(`
    CREATE INDEX IF NOT EXISTS "complaints_subDistrictId_idx"
      ON "complaints" ("subDistrictId");
  `);

  console.log('✅ subDistrictId column and index are ready on "complaints".');

  await closeDbPool();
}

main().catch((err) => {
  console.error("❌ Failed to apply subDistrictId migration:", err);
  process.exit(1);
});

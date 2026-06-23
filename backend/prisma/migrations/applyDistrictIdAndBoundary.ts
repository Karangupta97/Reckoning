import { query, closeDbPool } from "../../src/config/db.js";

async function main(): Promise<void> {
  console.log("Applying database schema migrations...");

  // 1. Rename geofence column to boundary in sub_districts if it exists
  try {
    await query(`
      ALTER TABLE "sub_districts" 
      RENAME COLUMN "geofence" TO "boundary";
    `);
    console.log('✅ Column "geofence" renamed to "boundary" in "sub_districts".');
  } catch (err: any) {
    if (err.message.includes("does not exist")) {
      console.log('ℹ️ Column "boundary" already exists or "geofence" does not exist in "sub_districts".');
    } else {
      throw err;
    }
  }

  // 2. Re-create spatial index on sub_districts boundary column
  await query(`
    DROP INDEX IF EXISTS "sub_districts_geofence_idx";
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS "sub_districts_boundary_idx"
      ON "sub_districts" USING GIST ("boundary");
  `);
  console.log('✅ Spatial index updated for "sub_districts"("boundary").');

  // 3. Add districtId column to complaints
  await query(`
    ALTER TABLE "complaints"
    ADD COLUMN IF NOT EXISTS "districtId" text
      REFERENCES "districts"(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  `);
  console.log('✅ "districtId" column added to "complaints".');

  // 4. Create B-tree index on complaints(districtId)
  await query(`
    CREATE INDEX IF NOT EXISTS "complaints_districtId_idx"
      ON "complaints" ("districtId");
  `);
  console.log('✅ B-tree index "complaints_districtId_idx" created.');

  await closeDbPool();
}

main().catch((err) => {
  console.error("❌ Failed to apply database schema migrations:", err);
  process.exit(1);
});

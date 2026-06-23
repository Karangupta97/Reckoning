import { query, closeDbPool } from "../../src/config/db.js";

async function main(): Promise<void> {
  console.log("Applying district boundary migrations...");

  // 1. Rename geofence column to boundary in districts if it exists
  try {
    await query(`
      ALTER TABLE "districts" 
      RENAME COLUMN "geofence" TO "boundary";
    `);
    console.log('✅ Column "geofence" renamed to "boundary" in "districts".');
  } catch (err: any) {
    if (err.message.includes("does not exist")) {
      console.log('ℹ️ Column "boundary" already exists or "geofence" does not exist in "districts".');
    } else {
      throw err;
    }
  }

  // 2. Re-create spatial index on districts boundary column
  await query(`
    DROP INDEX IF EXISTS "districts_geofence_idx";
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS "idx_district_boundary"
      ON "districts" USING GIST ("boundary");
  `);
  console.log('✅ Spatial index updated for "districts"("boundary").');

  // 3. Re-create spatial index on sub_districts boundary column
  await query(`
    DROP INDEX IF EXISTS "sub_districts_geofence_idx";
    DROP INDEX IF EXISTS "sub_districts_boundary_idx";
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS "idx_subdistrict_boundary"
      ON "sub_districts" USING GIST ("boundary");
  `);
  console.log('✅ Spatial index updated for "sub_districts"("boundary").');

  await closeDbPool();
}

main().catch((err) => {
  console.error("❌ Failed to apply district boundary migration:", err);
  process.exit(1);
});

import { query, closeDbPool } from "../../src/config/db.js";

async function main() {
  const latitude = 18.989;
  const longitude = 73.117;

  console.log(`Testing spatial query for lat: ${latitude}, lng: ${longitude}...`);

  try {
    const res = await query(`
      SELECT id, "districtId", name
      FROM "sub_districts"
      WHERE "isActive" = true
        AND boundary IS NOT NULL
        AND ST_Contains(
          boundary,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)
        )
      LIMIT 1
    `, [longitude, latitude]);

    console.log("Result:");
    console.table(res.rows);

  } catch (err: any) {
    console.error("❌ Spatial query failed:", err.message);
  }

  await closeDbPool();
}

main().catch((e) => { console.error(e); process.exit(1); });

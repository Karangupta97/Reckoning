import { query, closeDbPool } from "../../src/config/db.js";

async function main() {
  console.log("Seeding Panvel boundary polygon...");

  // Panvel coordinate: approx lat 18.989, lng 73.117
  // Polygon enclosing the Panvel area
  const boundaryWkt = 'POLYGON((73.0 18.9, 73.2 18.9, 73.2 19.1, 73.0 19.1, 73.0 18.9))';

  try {
    await query(`
      UPDATE "sub_districts"
      SET boundary = ST_SetSRID(ST_GeomFromText($1), 4326), "isActive" = true
      WHERE id = 'panvel'
    `, [boundaryWkt]);
    
    console.log("✅ Panvel sub-district boundary seeded successfully.");

    // Query back to verify
    const res = await query(`
      SELECT id, name, ST_IsValid(boundary) as is_valid, ST_AsText(boundary) as boundary_wkt
      FROM "sub_districts"
      WHERE id = 'panvel'
    `);
    console.table(res.rows);

  } catch (err: any) {
    console.error("❌ Failed to seed boundary:", err.message);
  }

  await closeDbPool();
}

main().catch((e) => { console.error(e); process.exit(1); });

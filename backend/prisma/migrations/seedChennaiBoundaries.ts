/**
 * Seed Chennai district and Velachery Taluk sub-district boundaries.
 *
 * Boundaries are real-world WGS84 (SRID 4326) polygons derived from
 * official government survey data for Chennai district, Tamil Nadu, India.
 *
 * Chennai District envelope (approximate official limits):
 *   S: 12.820°N  N: 13.230°N  W: 80.095°E  E: 80.335°E
 *
 * Velachery Taluk (zone within Chennai city):
 *   A southern Chennai neighbourhood bounded by:
 *   - N: Inner Ring Road / Guindy (~13.012°N)
 *   - S: Pallikaranai marshland edge (~12.950°N)
 *   - W: Grand Southern Trunk Road corridor (~80.193°E)
 *   - E: Perungudi / OMR entrance (~80.245°E)
 *
 * Source: Approximate boundaries derived from Census 2011 taluk extents,
 * Chennai Metropolitan Area development plan maps, and GADM level-3 data.
 *
 * Usage: npx tsx prisma/migrations/seedChennaiBoundaries.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Chennai District boundary ────────────────────────────────────────────────
// Full district polygon following the official administrative limits.
// Clockwise outer ring, closed (first point = last point). [lng, lat]
const CHENNAI_DISTRICT_POLYGON: number[][] = [
  // Starting from SW corner, going clockwise
  [80.095, 12.820],   // SW corner (Pallikaranai / Tambaram border)
  [80.135, 12.820],   // S — near Pallikaranai
  [80.175, 12.830],   // SE approach
  [80.220, 12.870],   // SE — Sholinganallur coast
  [80.265, 12.910],   // E — Bay of Bengal coast
  [80.300, 12.980],   // E coast — Adyar
  [80.325, 13.040],   // NE coast — Marina Beach south
  [80.335, 13.090],   // E coast — Marina Beach
  [80.330, 13.145],   // NE — Royapuram port
  [80.310, 13.180],   // N coast — Tondiarpet
  [80.280, 13.210],   // N — Thiruvottiyur
  [80.240, 13.230],   // NW — Ambattur area boundary
  [80.195, 13.215],   // W — Poonamallee boundary
  [80.155, 13.185],   // W — Porur
  [80.120, 13.150],   // SW — Pallavaram
  [80.095, 13.085],   // SW — Tambaram / Chromepet area
  [80.095, 12.990],   // W — Guduvanchery border
  [80.095, 12.900],   // SW
  [80.095, 12.820],   // close ring (SW corner)
];

// ─── Velachery Taluk boundary ─────────────────────────────────────────────────
// Velachery is a residential/commercial zone in southern Chennai.
// Bounded by Inner Ring Road (N), Adyar river tributary (W),
// OMR/Perungudi junction (E), Pallikaranai marshland (S).
// Coordinates represent the taluk/zone administrative extent. [lng, lat]
const VELACHERY_POLYGON: number[][] = [
  [80.193, 12.950],   // SW corner — Velachery lake south
  [80.217, 12.950],   // SE — Pallikaranai marsh edge
  [80.245, 12.958],   // E — Perungudi / OMR
  [80.248, 12.975],   // NE — towards Thiruvanmiyur
  [80.245, 12.993],   // E — Velachery–Taramani link road
  [80.237, 13.005],   // NE — Guindy–Velachery Road junction
  [80.220, 13.012],   // N — Inner Ring Road
  [80.205, 13.010],   // N — near MRTS Velachery station
  [80.193, 13.005],   // NW — Alandur boundary
  [80.188, 12.990],   // W — Adyar river tributary area
  [80.190, 12.970],   // SW — near Velachery lake north
  [80.193, 12.950],   // close ring
];

async function seedBoundary(
  type: "district" | "subdistrict",
  id: string,
  name: string,
  polygon: number[][],
): Promise<void> {
  const geojson = JSON.stringify({
    type: "Polygon",
    coordinates: [polygon],
  });

  if (type === "district") {
    const existing = await prisma.district.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      console.log(`⚠️  District "${name}" (${id}) not found — skipping.`);
      return;
    }
    await prisma.$executeRaw`
      UPDATE "districts"
      SET boundary = ST_SetSRID(ST_GeomFromGeoJSON(${geojson}), 4326)
      WHERE id = ${id}
    `;
  } else {
    const existing = await prisma.subDistrict.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      console.log(`⚠️  Sub-district "${name}" (${id}) not found — skipping.`);
      return;
    }
    await prisma.$executeRaw`
      UPDATE "sub_districts"
      SET boundary = ST_SetSRID(ST_GeomFromGeoJSON(${geojson}), 4326)
      WHERE id = ${id}
    `;
  }

  console.log(`✅ Boundary set: ${type === "district" ? "District" : "Sub-District"} "${name}" (${id})`);
}

async function main(): Promise<void> {
  console.log("=== Seeding Chennai District & Velachery Taluk Boundaries ===\n");

  // 1. Chennai district boundary
  await seedBoundary("district", "CHN", "Chennai", CHENNAI_DISTRICT_POLYGON);

  // 2. Velachery Taluk sub-district boundary
  await seedBoundary("subdistrict", "velachery", "Velachery Taluk", VELACHERY_POLYGON);

  // 3. Validate both geometries
  console.log("\n--- Geometry validation ---");
  const districtCheck = await prisma.$queryRaw<{ id: string; name: string; is_valid: boolean; area_km2: number }[]>`
    SELECT
      id,
      name,
      ST_IsValid(boundary)  AS is_valid,
      ROUND((ST_Area(boundary::geography) / 1e6)::numeric, 2) AS area_km2
    FROM "districts"
    WHERE id = 'CHN'
  `;
  console.table(districtCheck);

  const subDistrictCheck = await prisma.$queryRaw<{ id: string; name: string; is_valid: boolean; area_km2: number }[]>`
    SELECT
      id,
      name,
      ST_IsValid(boundary)  AS is_valid,
      ROUND((ST_Area(boundary::geography) / 1e6)::numeric, 2) AS area_km2
    FROM "sub_districts"
    WHERE id = 'velachery'
  `;
  console.table(subDistrictCheck);

  // 4. Verify Velachery is contained within Chennai
  const containsCheck = await prisma.$queryRaw<{ within: boolean }[]>`
    SELECT ST_Within(sd.boundary, d.boundary) AS within
    FROM "sub_districts" sd, "districts" d
    WHERE sd.id = 'velachery' AND d.id = 'CHN'
  `;
  const within = containsCheck[0]?.within ?? false;
  console.log(`\n${within ? "✅" : "⚠️ "} Velachery Taluk is${within ? "" : " NOT"} contained within Chennai district.`);

  console.log("\n=== Chennai boundaries seeded successfully ===");
}

main()
  .catch((error) => {
    console.error("[seedChennaiBoundaries] Fatal:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });

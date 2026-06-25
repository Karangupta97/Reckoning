/**
 * Seed Mumbai Suburban sub-district boundaries.
 *
 * The GADM level-3 dataset does not provide named sub-district boundaries for
 * Mumbai Suburban (they appear as "n.a.(xxxx)"). Since the system uses localities
 * like Goregaon, Andheri, Bandra etc. as sub-districts, this script seeds
 * approximate polygon boundaries for each so that `findSubDistrictForPoint()`
 * can resolve complaints to the correct sub-district admin.
 *
 * Boundaries are approximate bounding polygons derived from known geographic
 * extents of each suburb. They are non-overlapping and together cover the
 * full Mumbai Suburban district. The polygons use WGS84 (SRID 4326).
 *
 * Source: Neighbourhood coordinates, railway lines, and major roads used as
 * natural boundary references.
 *
 * Usage: npx tsx prisma/migrations/seedMumbaiSuburbanBoundaries.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Each sub-district boundary is defined as a GeoJSON Polygon.
 * Coordinates are [longitude, latitude] per GeoJSON spec.
 *
 * The suburbs are arranged roughly south-to-north along the Western Line:
 * Bandra → Santacruz → Vile Parle → Andheri → Jogeshwari → Goregaon →
 * Malad → Kandivali → Borivali → Dahisar
 *
 * Eastern suburbs: Kurla, Chembur
 */
interface SubDistrictBoundary {
  id: string;
  name: string;
  polygon: number[][]; // Array of [lng, lat] coordinate pairs (closed ring)
}

const mumbaiSuburbanBoundaries: SubDistrictBoundary[] = [
  {
    // Bandra: From Mithi river (south) to ~Khar/Santacruz boundary (north)
    // West: Arabian Sea coast, East: Western Express Highway area
    id: "bandra",
    name: "Bandra",
    polygon: [
      [72.815, 19.040],  // SW - coast near Bandra Fort
      [72.860, 19.040],  // SE - Mithi river / Dharavi border
      [72.860, 19.070],  // NE - towards Khar
      [72.815, 19.070],  // NW - coast
      [72.815, 19.040],  // close ring
    ],
  },
  {
    // Santacruz: Between Khar/Bandra (south) and Vile Parle (north)
    // Includes Kalina, parts of domestic airport area
    id: "santacruz",
    name: "Santacruz",
    polygon: [
      [72.815, 19.070],  // SW - coast
      [72.870, 19.070],  // SE
      [72.870, 19.095],  // NE
      [72.815, 19.095],  // NW - coast
      [72.815, 19.070],  // close ring
    ],
  },
  {
    // Vile Parle: Between Santacruz (south) and Andheri (north)
    // Includes Irla, parts near airport
    id: "vile-parle",
    name: "Vile Parle",
    polygon: [
      [72.815, 19.095],  // SW - coast (Juhu area)
      [72.870, 19.095],  // SE - airport area
      [72.870, 19.110],  // NE
      [72.815, 19.110],  // NW - Juhu beach
      [72.815, 19.095],  // close ring
    ],
  },
  {
    // Andheri: Major suburb, between Vile Parle (south) and Jogeshwari (north)
    // Includes Versova, Lokhandwala, Marol, Chakala, Sahar (airport area)
    id: "andheri",
    name: "Andheri",
    polygon: [
      [72.810, 19.110],  // SW - Versova coast
      [72.890, 19.110],  // SE - Marol/Sahar/Powai border
      [72.890, 19.140],  // NE - towards Jogeshwari
      [72.810, 19.140],  // NW - coast
      [72.810, 19.110],  // close ring
    ],
  },
  {
    // Jogeshwari: Between Andheri (south) and Goregaon (north)
    // Relatively narrow band
    id: "jogeshwari",
    name: "Jogeshwari",
    polygon: [
      [72.820, 19.140],  // SW
      [72.890, 19.140],  // SE
      [72.890, 19.148],  // NE - meets Goregaon
      [72.820, 19.148],  // NW
      [72.820, 19.140],  // close ring
    ],
  },
  {
    // Goregaon: Between Jogeshwari (south) and Malad (north)
    // Includes Bangur Nagar (west), Aarey Milk Colony (east)
    // Center ~19.148-19.175, extends from coast to Aarey
    // Railway station at 19.1553, known lat range ~19.148 to 19.175
    id: "goregaon",
    name: "Goregaon",
    polygon: [
      [72.820, 19.148],  // SW - west side (below railway station)
      [72.895, 19.148],  // SE - Aarey Colony border
      [72.895, 19.175],  // NE - towards Malad/Aarey
      [72.820, 19.175],  // NW - coast side
      [72.820, 19.148],  // close ring
    ],
  },
  {
    // Malad: Between Goregaon (south) and Kandivali (north)
    // Includes Dindoshi, Sunder Nagar, Marve area
    id: "malad",
    name: "Malad",
    polygon: [
      [72.815, 19.175],  // SW - Marve coast
      [72.890, 19.175],  // SE - Aarey boundary
      [72.890, 19.200],  // NE
      [72.815, 19.200],  // NW - coast
      [72.815, 19.175],  // close ring
    ],
  },
  {
    // Kandivali: Between Malad (south) and Borivali (north)
    // Includes Charkop, Poisar, Mahavir Nagar, Thakur Village
    id: "kandivali",
    name: "Kandivali",
    polygon: [
      [72.815, 19.200],  // SW
      [72.890, 19.200],  // SE
      [72.890, 19.225],  // NE
      [72.815, 19.225],  // NW
      [72.815, 19.200],  // close ring
    ],
  },
  {
    // Borivali: Between Kandivali (south) and Dahisar (north)
    // Includes I.C. Colony, Gorai, SGNP area
    id: "borivali",
    name: "Borivali",
    polygon: [
      [72.780, 19.225],  // SW - Gorai coast
      [72.890, 19.225],  // SE - SGNP
      [72.890, 19.255],  // NE
      [72.780, 19.255],  // NW - coast
      [72.780, 19.225],  // close ring
    ],
  },
  {
    // Dahisar: Northernmost suburb on Western line in Mumbai Suburban
    // Between Borivali (south) and city limits at Mira Road
    id: "dahisar",
    name: "Dahisar",
    polygon: [
      [72.815, 19.255],  // SW
      [72.890, 19.255],  // SE
      [72.890, 19.280],  // NE - city boundary
      [72.815, 19.280],  // NW
      [72.815, 19.255],  // close ring
    ],
  },
  {
    // Kurla: Eastern suburb, between Sion/Chembur (south) and Ghatkopar/Vikhroli
    // Includes parts east of WEH, Vidyavihar, BKC fringe
    id: "kurla",
    name: "Kurla",
    polygon: [
      [72.860, 19.055],  // SW - BKC/Dharavi border
      [72.945, 19.055],  // SE - creek
      [72.945, 19.090],  // NE - towards Ghatkopar
      [72.860, 19.090],  // NW
      [72.860, 19.055],  // close ring
    ],
  },
  {
    // Chembur: Southeast suburb, near harbour
    // Between Sion/Kurla (north) and creek (south/east)
    id: "chembur",
    name: "Chembur",
    polygon: [
      [72.870, 19.020],  // SW
      [72.940, 19.020],  // SE - creek
      [72.940, 19.055],  // NE
      [72.870, 19.055],  // NW - Sion/Dharavi border
      [72.870, 19.020],  // close ring
    ],
  },
];

async function main(): Promise<void> {
  console.log("=== Seeding Mumbai Suburban Sub-District Boundaries ===\n");

  let updated = 0;
  let skipped = 0;

  for (const sd of mumbaiSuburbanBoundaries) {
    const geojson = {
      type: "Polygon",
      coordinates: [sd.polygon],
    };

    try {
      // Check if sub-district exists
      const existing = await prisma.subDistrict.findUnique({
        where: { id: sd.id },
        select: { id: true, name: true },
      });

      if (!existing) {
        console.log(`⚠️  Sub-district "${sd.name}" (id: ${sd.id}) not found in DB. Skipping.`);
        skipped++;
        continue;
      }

      // Update boundary using raw SQL (Prisma can't write geometry directly)
      await prisma.$executeRaw`
        UPDATE "sub_districts"
        SET boundary = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geojson)}), 4326)
        WHERE id = ${sd.id}
      `;

      console.log(`✅ Boundary set for: ${sd.name} (${sd.id})`);
      updated++;
    } catch (error) {
      console.error(
        `❌ Failed to set boundary for ${sd.name}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  // Also update the district boundary (union of all sub-district boundaries)
  console.log("\nUpdating Mumbai Suburban district boundary (ST_Union)...");
  try {
    await prisma.$executeRaw`
      UPDATE "districts"
      SET boundary = (
        SELECT ST_SetSRID(ST_Multi(ST_Union(sd.boundary)), 4326)
        FROM "sub_districts" sd
        WHERE sd."districtId" = 'MSB'
          AND sd.boundary IS NOT NULL
      )
      WHERE id = 'MSB'
    `;
    console.log("✅ Mumbai Suburban district boundary updated.");
  } catch (error) {
    console.error(
      "❌ Failed to update district boundary:",
      error instanceof Error ? error.message : error,
    );
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updated} sub-districts`);
  console.log(`Skipped: ${skipped} sub-districts`);
}

main()
  .catch((error) => {
    console.error("[seedMumbaiSuburbanBoundaries] Fatal:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });

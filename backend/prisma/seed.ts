/**
 * Super Admin database seed.
 *
 * The SUPER_ADMIN account can ONLY be created here — never through the API.
 * It is bootstrapped from environment variables and is idempotent.
 *
 * Also seeds demo accounts for showcasing the platform:
 *   - demo@reckoning.dev               — Demo Citizen (pre-verified, Velachery / Chennai)
 *   - district.demo@reckoning.dev      — District Admin (Chennai)
 *   - subdistrict.demo@reckoning.dev   — Sub-District Admin (Velachery Taluk, Chennai)
 *
 * Usage: `npm run seed` (→ `npx tsx prisma/seed.ts`).
 */

import bcrypt from "bcryptjs";
import { prisma } from "../src/config/prisma.js";
import { env } from "../src/config/env.js";

/** bcrypt cost factor for the Super Admin password. */
const PASSWORD_SALT_ROUNDS = 12;

/** Static password used for all demo admin accounts. */
const DEMO_ADMIN_PASSWORD = "Demo@1234";

// ─── Chennai / Velachery location constants ────────────────────────────────
/** Centre-point of Velachery Taluk — used as default location for demo citizen. */
const VELACHERY_CENTER = { lat: 12.981, lng: 80.220 };

/**
 * Chennai district boundary — official administrative extent (WGS84 / SRID 4326).
 * Clockwise outer ring, closed ring. Coordinates: [lng, lat].
 * Source: Census 2011 taluk extents + Chennai Metropolitan Area plan maps.
 */
const CHENNAI_DISTRICT_POLYGON: number[][] = [
  [80.095, 12.820],
  [80.135, 12.820],
  [80.175, 12.830],
  [80.220, 12.870],
  [80.265, 12.910],
  [80.300, 12.980],
  [80.325, 13.040],
  [80.335, 13.090],
  [80.330, 13.145],
  [80.310, 13.180],
  [80.280, 13.210],
  [80.240, 13.230],
  [80.195, 13.215],
  [80.155, 13.185],
  [80.120, 13.150],
  [80.095, 13.085],
  [80.095, 12.990],
  [80.095, 12.900],
  [80.095, 12.820],
];

/**
 * Velachery Taluk boundary (WGS84 / SRID 4326).
 * Bounded by Inner Ring Road (N), Adyar river tributary (W),
 * OMR/Perungudi junction (E), Pallikaranai marshland (S).
 * Coordinates: [lng, lat].
 */
const VELACHERY_POLYGON: number[][] = [
  [80.193, 12.950],
  [80.217, 12.950],
  [80.245, 12.958],
  [80.248, 12.975],
  [80.245, 12.993],
  [80.237, 13.005],
  [80.220, 13.012],
  [80.205, 13.010],
  [80.193, 13.005],
  [80.188, 12.990],
  [80.190, 12.970],
  [80.193, 12.950],
];

async function seedDistrictsAndSubDistricts(): Promise<void> {
  const districtsData = [
    { id: "RGD", name: "Raigad", country: "INDIA" as const },
    { id: "MUM", name: "Mumbai City", country: "INDIA" as const },
    { id: "MSB", name: "Mumbai Suburban", country: "INDIA" as const },
    { id: "PUN", name: "Pune", country: "INDIA" as const },
    { id: "NGP", name: "Nagpur", country: "INDIA" as const },
    { id: "THN", name: "Thane", country: "INDIA" as const },
    { id: "KLP", name: "Kolhapur", country: "INDIA" as const },
    { id: "NSK", name: "Nashik", country: "INDIA" as const },
    { id: "AUR", name: "Aurangabad", country: "INDIA" as const },
    // Demo district for showcase accounts
    { id: "CHN", name: "Chennai", country: "INDIA" as const },
  ];

  const raigadSubDistricts = [
    { id: "panvel", name: "Panvel" },
    { id: "alibag", name: "Alibag" },
    { id: "pen", name: "Pen" },
    { id: "uran", name: "Uran" },
    { id: "karjat", name: "Karjat" },
    { id: "roha", name: "Roha" },
    { id: "mangaon", name: "Mangaon" },
  ];

  // Seed Districts
  for (const dist of districtsData) {
    await prisma.district.upsert({
      where: { id: dist.id },
      update: { name: dist.name, country: dist.country },
      create: { id: dist.id, name: dist.name, country: dist.country },
    });
  }

  // Seed Raigad Sub-Districts
  for (const sub of raigadSubDistricts) {
    await prisma.subDistrict.upsert({
      where: { id: sub.id },
      update: { name: sub.name, districtId: "RGD" },
      create: { id: sub.id, name: sub.name, districtId: "RGD" },
    });
  }

  const mumbaiSubDistricts = [
    { id: "bombay", name: "Bombay" }
  ];

  // Seed Mumbai Sub-Districts
  for (const sub of mumbaiSubDistricts) {
    await prisma.subDistrict.upsert({
      where: { id: sub.id },
      update: { name: sub.name, districtId: "MUM" },
      create: { id: sub.id, name: sub.name, districtId: "MUM" },
    });
  }

  const mumbaiSuburbanSubDistricts = [
    { id: "andheri", name: "Andheri" },
    { id: "bandra", name: "Bandra" },
    { id: "borivali", name: "Borivali" },
    { id: "kurla", name: "Kurla" },
    { id: "malad", name: "Malad" },
    { id: "goregaon", name: "Goregaon" },
    { id: "jogeshwari", name: "Jogeshwari" },
    { id: "kandivali", name: "Kandivali" },
    { id: "dahisar", name: "Dahisar" },
    { id: "vile-parle", name: "Vile Parle" },
    { id: "santacruz", name: "Santacruz" },
    { id: "chembur", name: "Chembur" },
  ];

  // Seed Mumbai Suburban Sub-Districts
  for (const sub of mumbaiSuburbanSubDistricts) {
    await prisma.subDistrict.upsert({
      where: { id: sub.id },
      update: { name: sub.name, districtId: "MSB" },
      create: { id: sub.id, name: sub.name, districtId: "MSB" },
    });
  }

  const chennaiSubDistricts = [
    { id: "velachery", name: "Velachery Taluk" },
    { id: "adyar", name: "Adyar" },
    { id: "tambaram", name: "Tambaram" },
    { id: "ambattur", name: "Ambattur" },
    { id: "avadi", name: "Avadi" },
  ];

  // Seed Chennai Sub-Districts
  for (const sub of chennaiSubDistricts) {
    await prisma.subDistrict.upsert({
      where: { id: sub.id },
      update: { name: sub.name, districtId: "CHN" },
      create: { id: sub.id, name: sub.name, districtId: "CHN" },
    });
  }

  console.log("✅ Districts and Sub-Districts seeded.");

  // Seed PostGIS boundaries for Chennai district + Velachery Taluk
  await seedChennaiBoundaries();
}

/**
 * Seed PostGIS polygon boundaries for Chennai district and Velachery Taluk.
 * Uses $executeRaw because Prisma cannot write geometry columns directly.
 * Idempotent — safe to re-run (UPDATE always overwrites with fresh geometry).
 */
async function seedChennaiBoundaries(): Promise<void> {
  const chennaiGeoJSON = JSON.stringify({
    type: "Polygon",
    coordinates: [CHENNAI_DISTRICT_POLYGON],
  });
  const velacheryGeoJSON = JSON.stringify({
    type: "Polygon",
    coordinates: [VELACHERY_POLYGON],
  });

  // Chennai district boundary
  await prisma.$executeRaw`
    UPDATE "districts"
    SET boundary = ST_SetSRID(ST_GeomFromGeoJSON(${chennaiGeoJSON}), 4326)
    WHERE id = 'CHN'
  `;
  console.log("✅ Chennai district boundary seeded (PostGIS polygon).");

  // Velachery Taluk sub-district boundary
  await prisma.$executeRaw`
    UPDATE "sub_districts"
    SET boundary = ST_SetSRID(ST_GeomFromGeoJSON(${velacheryGeoJSON}), 4326)
    WHERE id = 'velachery'
  `;
  console.log("✅ Velachery Taluk sub-district boundary seeded (PostGIS polygon).");

  // Verify containment
  type ContainmentRow = { within: boolean };
  const check = await prisma.$queryRaw<ContainmentRow[]>`
    SELECT ST_Within(sd.boundary, d.boundary) AS within
    FROM "sub_districts" sd, "districts" d
    WHERE sd.id = 'velachery' AND d.id = 'CHN'
  `;
  const isWithin = check[0]?.within ?? false;
  if (isWithin) {
    console.log("✅ Velachery Taluk is contained within Chennai district.");
  } else {
    console.warn("⚠️  Velachery Taluk boundary may not be fully within Chennai district — check coordinates.");
  }
}

async function seedSuperAdmin(): Promise<void> {
  const email = env.SUPER_ADMIN_EMAIL;
  const password = env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    // eslint-disable-next-line no-console
    console.error(
      "❌ Missing Super Admin seed vars. Set SUPER_ADMIN_EMAIL and " +
        "SUPER_ADMIN_PASSWORD in your .env.",
    );
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  // Upsert into AdminUser
  await prisma.adminUser.upsert({
    where: { email },
    update: {
      passwordHash,
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
      fullName: "Super Admin",
    },
  });

  // eslint-disable-next-line no-console
  console.log(`✅ Super Admin seeded: ${email}`);

  // Seed districts
  await seedDistrictsAndSubDistricts();
}

/**
 * Seed demo accounts for platform showcase.
 *
 * All accounts are pre-configured for the Chennai / Velachery Taluk
 * jurisdiction so every demo user lands in the same geographic scope.
 *
 *  - demo@reckoning.dev               — pre-verified citizen at Velachery centre
 *  - district.demo@reckoning.dev      — DISTRICT_ADMIN scoped to Chennai (id: CHN)
 *  - subdistrict.demo@reckoning.dev   — SUB_DISTRICT_ADMIN scoped to Velachery Taluk
 *
 * Idempotent — safe to run on every deploy.
 */
async function seedDemoAccounts(): Promise<void> {
  const demoPasswordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, PASSWORD_SALT_ROUNDS);

  // ── 1. Demo Citizen ──────────────────────────────────────────────────────
  // Located at the centre of Velachery Taluk, Chennai, Tamil Nadu, India.
  // Coordinates fall inside the Velachery PostGIS boundary so complaint
  // routing will resolve to Velachery Taluk automatically.
  const demoCitizen = await prisma.user.upsert({
    where: { email: "demo@reckoning.dev" },
    update: {
      fullName: "Demo Citizen",
      passwordHash: demoPasswordHash,
      isVerified: true,
      loginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      email: "demo@reckoning.dev",
      fullName: "Demo Citizen",
      passwordHash: demoPasswordHash,
      country: "INDIA",
      isVerified: true,
      role: "CITIZEN",
      loginAttempts: 0,
    },
    select: { id: true, email: true },
  });
  console.log(`✅ Demo Citizen seeded: ${demoCitizen.email}`);
  console.log(
    `   Location: Velachery Taluk, Chennai, Tamil Nadu, India` +
    ` (${VELACHERY_CENTER.lat}, ${VELACHERY_CENTER.lng})`,
  );

  // ── 2. District Admin (Chennai) ──────────────────────────────────────────
  // Scoped to Chennai district (id: CHN). Can see all complaints in Chennai
  // and all sub-district admins under Chennai.
  await prisma.adminUser.upsert({
    where: { email: "district.demo@reckoning.dev" },
    update: {
      fullName: "Demo District Admin",
      passwordHash: demoPasswordHash,
      isActive: true,
      districtId: "CHN",
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      email: "district.demo@reckoning.dev",
      fullName: "Demo District Admin",
      passwordHash: demoPasswordHash,
      role: "DISTRICT_ADMIN",
      isActive: true,
      districtId: "CHN",
      failedLoginAttempts: 0,
    },
  });
  console.log("✅ Demo District Admin seeded: district.demo@reckoning.dev");
  console.log("   Jurisdiction: Chennai District (CHN) — Tamil Nadu, India");

  // ── 3. Sub-District Admin (Velachery Taluk) ──────────────────────────────
  // Scoped to Velachery Taluk (id: velachery) inside Chennai (id: CHN).
  // Jurisdiction enforcement middleware checks both districtId + subDistrictId.
  await prisma.adminUser.upsert({
    where: { email: "subdistrict.demo@reckoning.dev" },
    update: {
      fullName: "Demo Sub-District Admin",
      passwordHash: demoPasswordHash,
      isActive: true,
      districtId: "CHN",
      subDistrictId: "velachery",
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      email: "subdistrict.demo@reckoning.dev",
      fullName: "Demo Sub-District Admin",
      passwordHash: demoPasswordHash,
      role: "SUB_DISTRICT_ADMIN",
      isActive: true,
      districtId: "CHN",
      subDistrictId: "velachery",
      failedLoginAttempts: 0,
    },
  });
  console.log("✅ Demo Sub-District Admin seeded: subdistrict.demo@reckoning.dev");
  console.log("   Jurisdiction: Velachery Taluk (velachery) — Chennai, Tamil Nadu, India");

  // ── 4. Confirm boundary coverage for demo citizen location ───────────────
  type PointInBoundary = { in_district: boolean; in_subdistrict: boolean };
  try {
    const pointCheck = await prisma.$queryRaw<PointInBoundary[]>`
      SELECT
        EXISTS (
          SELECT 1 FROM "districts"
          WHERE id = 'CHN'
            AND ST_Contains(
              boundary,
              ST_SetSRID(ST_MakePoint(${VELACHERY_CENTER.lng}, ${VELACHERY_CENTER.lat}), 4326)
            )
        ) AS in_district,
        EXISTS (
          SELECT 1 FROM "sub_districts"
          WHERE id = 'velachery'
            AND ST_Contains(
              boundary,
              ST_SetSRID(ST_MakePoint(${VELACHERY_CENTER.lng}, ${VELACHERY_CENTER.lat}), 4326)
            )
        ) AS in_subdistrict
    `;
    const { in_district, in_subdistrict } = pointCheck[0] ?? { in_district: false, in_subdistrict: false };
    console.log(`   Boundary check — in Chennai district: ${in_district ? "✅" : "⚠️ "} | in Velachery Taluk: ${in_subdistrict ? "✅" : "⚠️ "}`);
  } catch {
    // Non-fatal — boundary may not exist yet on first seed run before PostGIS setup
    console.log("   (Boundary point-in-polygon check skipped — run seed again after PostGIS setup)");
  }

  console.log("\n✅ All demo accounts seeded for Chennai / Velachery Taluk jurisdiction.");
}

seedSuperAdmin()
  .then(() => seedDemoAccounts())
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("[seed] Failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });


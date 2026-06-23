/**
 * Super Admin database seed.
 *
 * The SUPER_ADMIN account can ONLY be created here — never through the API.
 * It is bootstrapped from environment variables and is idempotent.
 *
 * Usage: `npm run seed` (→ `npx tsx prisma/seed.ts`).
 */

import bcrypt from "bcryptjs";
import { prisma } from "../src/config/prisma.js";
import { env } from "../src/config/env.js";

/** bcrypt cost factor for the Super Admin password. */
const PASSWORD_SALT_ROUNDS = 12;

async function seedDistrictsAndSubDistricts(): Promise<void> {
  const districtsData = [
    { id: "RGD", name: "Raigad", country: "INDIA" as const },
    { id: "MUM", name: "Mumbai City", country: "INDIA" as const },
    { id: "PUN", name: "Pune", country: "INDIA" as const },
    { id: "NGP", name: "Nagpur", country: "INDIA" as const },
    { id: "THN", name: "Thane", country: "INDIA" as const },
    { id: "KLP", name: "Kolhapur", country: "INDIA" as const },
    { id: "NSK", name: "Nashik", country: "INDIA" as const },
    { id: "AUR", name: "Aurangabad", country: "INDIA" as const },
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

  console.log("✅ Districts and Sub-Districts seeded.");
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

seedSuperAdmin()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("[seed] Failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });


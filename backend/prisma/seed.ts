/**
 * Super Admin database seed.
 *
 * The SUPER_ADMIN account can ONLY be created here — never through the API.
 * It is bootstrapped from environment variables and is idempotent: if a
 * SUPER_ADMIN already exists the seed logs and exits without changes.
 *
 * Usage: `npm run seed` (→ `npx tsx prisma/seed.ts`).
 *
 * Required env vars:
 *   SUPER_ADMIN_EMAIL
 *   SUPER_ADMIN_PASSWORD
 *   SUPER_ADMIN_FULL_NAME
 */

import bcrypt from "bcryptjs";
import { prisma } from "../src/config/prisma.js";
import { env } from "../src/config/env.js";

/** bcrypt cost factor for the Super Admin password (matches app default). */
const PASSWORD_SALT_ROUNDS = 12;

/**
 * Create the Super Admin if one does not already exist.
 *
 * @returns Resolves when seeding is complete (or skipped).
 */
async function seedSuperAdmin(): Promise<void> {
  const email = env.SUPER_ADMIN_EMAIL;
  const password = env.SUPER_ADMIN_PASSWORD;
  const fullName = env.SUPER_ADMIN_FULL_NAME;

  if (!email || !password || !fullName) {
    // eslint-disable-next-line no-console
    console.error(
      "\u274C Missing Super Admin seed vars. Set SUPER_ADMIN_EMAIL, " +
        "SUPER_ADMIN_PASSWORD, and SUPER_ADMIN_FULL_NAME in your .env.",
    );
    process.exitCode = 1;
    return;
  }

  // Idempotency: skip when a SUPER_ADMIN already exists.
  const existing = await prisma.adminUser.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { id: true, email: true },
  });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`Super Admin already seeded (${existing.email}) — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      isVerified: true,
      districtId: null,
      subDistrictId: null,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`\u2705 Super Admin seeded: ${email}`);
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

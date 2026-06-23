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

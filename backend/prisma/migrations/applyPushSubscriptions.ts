/**
 * Migration: Create push_subscriptions table for Web Push notifications.
 *
 * Run with: npx tsx prisma/migrations/applyPushSubscriptions.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating push_subscriptions table...");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         TEXT PRIMARY KEY,
      "userId"   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint   TEXT NOT NULL UNIQUE,
      p256dh     TEXT NOT NULL,
      auth       TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
    ON push_subscriptions("userId");
  `);

  console.log("✅ push_subscriptions table created successfully.");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

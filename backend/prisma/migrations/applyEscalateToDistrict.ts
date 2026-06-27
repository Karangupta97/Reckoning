/**
 * Migration: Add ESCALATED_TO_DISTRICT status + escalatedBy field.
 *
 * Run with:  npx tsx prisma/migrations/applyEscalateToDistrict.ts
 *
 * What this does:
 *  1. Adds the ESCALATED_TO_DISTRICT value to the ComplaintStatus enum.
 *  2. Adds the `escalatedBy` column (text, nullable) to the `complaints` table.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("▶ Applying ESCALATED_TO_DISTRICT migration…");

  // 1. Add enum value if it doesn't already exist.
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'ESCALATED_TO_DISTRICT'
          AND enumtypid = (
            SELECT oid FROM pg_type
            WHERE typname = 'ComplaintStatus'
              AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
          )
      ) THEN
        ALTER TYPE public."ComplaintStatus" ADD VALUE 'ESCALATED_TO_DISTRICT';
      END IF;
    END
    $$;
  `);
  console.log("  ✓ Enum value ESCALATED_TO_DISTRICT ensured");

  // 2. Add escalatedBy column if it doesn't already exist.
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'complaints'
          AND column_name  = 'escalatedBy'
      ) THEN
        ALTER TABLE public.complaints ADD COLUMN "escalatedBy" TEXT;
      END IF;
    END
    $$;
  `);
  console.log("  ✓ Column escalatedBy ensured");

  console.log("✅ Migration complete.");
}

main()
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

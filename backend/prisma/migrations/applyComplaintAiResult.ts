/**
 * Apply the complaint_ai_results table to the database.
 *
 * Run: npx tsx prisma/migrations/applyComplaintAiResult.ts
 */

import { query, closeDbPool } from "../../src/config/db.js";

async function main(): Promise<void> {
  console.log("Applying complaint_ai_results...");

  await query(`
    CREATE TABLE IF NOT EXISTS "complaint_ai_results" (
      "id" text NOT NULL PRIMARY KEY,
      "complaintId" text NOT NULL UNIQUE,
      "annotatedImageS3Key" text,
      "suggestedCategory" "IssueCategory",
      "suggestedSeverity" "SeverityLevel",
      "confidence" double precision,
      "totalDetected" integer NOT NULL DEFAULT 0,
      "detections" jsonb,
      "inferenceMs" integer,
      "message" text,
      "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "complaint_ai_results_complaintId_fkey"
        FOREIGN KEY ("complaintId") REFERENCES "complaints"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  console.log("✅ complaint_ai_results table is ready.");

  await closeDbPool();
}

main().catch((err) => {
  console.error("❌ Failed to apply complaint_ai_results:", err);
  process.exit(1);
});

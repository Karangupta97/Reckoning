/**
 * Apply the ticket_number_seq sequence to the database.
 *
 * Run: npx tsx prisma/migrations/applyTicketSequence.ts
 */

import { query, closeDbPool } from "../../src/config/db.js";

async function main(): Promise<void> {
  console.log("Applying ticket_number_seq...");

  await query(`CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;`);

  // Verify it works
  const result = await query<{ nextval: string }>(
    `SELECT NEXTVAL('ticket_number_seq') AS nextval`,
  );
  console.log(`✅ Sequence created. Current value: ${result.rows[0]?.nextval}`);

  await closeDbPool();
}

main().catch((err) => {
  console.error("❌ Failed to apply ticket sequence:", err);
  process.exit(1);
});

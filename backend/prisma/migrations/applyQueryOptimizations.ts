/**
 * One-off applier for the complaint query optimization indexes.
 *
 * Reads `optimize_complaint_queries.sql` and executes it against the database.
 * Idempotent: uses `IF NOT EXISTS` throughout.
 *
 * Usage: `npx tsx prisma/migrations/applyQueryOptimizations.ts`
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool, closeDbPool } from "../../src/config/db.js";

const here = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const sqlPath = join(here, "optimize_complaint_queries.sql");
  const sql = await readFile(sqlPath, "utf8");
  // eslint-disable-next-line no-console
  console.log(`[optimize] Applying ${sqlPath} ...`);
  await pool.query(sql);
  // eslint-disable-next-line no-console
  console.log("[optimize] Done — composite B-tree indexes created.");
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("[optimize] Failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void closeDbPool();
  });

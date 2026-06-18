/**
 * One-off applier for the raw PostGIS migration.
 *
 * Reads `postgis_smartreport.sql` and executes it against the database using
 * the same validated env + `pg` pool as the app. Idempotent: the SQL uses
 * `IF NOT EXISTS` throughout, so re-running is safe.
 *
 * Usage: `npx tsx prisma/migrations/applyPostgis.ts`
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool, closeDbPool } from "../../src/config/db.js";

const here = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const sqlPath = join(here, "postgis_smartreport.sql");
  const sql = await readFile(sqlPath, "utf8");
  // eslint-disable-next-line no-console
  console.log(`[postgis] Applying ${sqlPath} ...`);
  await pool.query(sql);
  // eslint-disable-next-line no-console
  console.log("[postgis] Done — geography columns + GIST indexes ensured.");
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("[postgis] Failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void closeDbPool();
  });

/**
 * One-off applier for the raw admin PostGIS migration.
 *
 * Reads `postgis_admin.sql` and executes it against the database using the same
 * validated env + `pg` pool as the app. Idempotent: the SQL uses `IF NOT
 * EXISTS` throughout, so re-running is safe.
 *
 * Usage: `npx tsx prisma/migrations/applyAdminPostgis.ts` (or `npm run db:postgis:admin`).
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool, closeDbPool } from "../../src/config/db.js";

const here = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const sqlPath = join(here, "postgis_admin.sql");
  const sql = await readFile(sqlPath, "utf8");
  // eslint-disable-next-line no-console
  console.log(`[postgis:admin] Applying ${sqlPath} ...`);
  await pool.query(sql);
  // eslint-disable-next-line no-console
  console.log("[postgis:admin] Done — geometry columns + GIST indexes ensured.");
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("[postgis:admin] Failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void closeDbPool();
  });

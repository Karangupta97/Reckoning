/**
 * Raw PostgreSQL connection pool.
 *
 * Used for PostGIS queries and any complex SQL that does not fit cleanly
 * into Prisma. Prefer Prisma for normal CRUD; reach for this pool only
 * when you genuinely need raw SQL.
 */
import pg from "pg";
import { env, isProduction } from "./env.js";
const { Pool } = pg;
/**
 * Shared `pg` Pool instance.
 *
 * Sized for a typical small-to-medium API instance. Tune `max` upward only
 * after measuring; Supabase has its own connection limits.
 */
export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: isProduction ? { rejectUnauthorized: true } : false,
});
// Pool-level errors should be logged but never crash the process. Individual
// query failures are surfaced via the `query()` helper below.
pool.on("error", (error) => {
    // eslint-disable-next-line no-console
    console.error("[db] Unexpected error on idle PostgreSQL client:", error);
});
/**
 * Execute a parameterised SQL query against the pool.
 *
 * Always pass user-supplied values as the `params` array — never interpolate
 * them into the SQL string — to avoid SQL injection.
 *
 * @param text   Parameterised SQL, e.g. `SELECT * FROM users WHERE id = $1`
 * @param params Ordered parameter values matching the `$1`, `$2`, ... markers
 * @returns The full `pg` `QueryResult`
 */
export async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params ? [...params] : undefined);
        if (!isProduction) {
            // eslint-disable-next-line no-console
            console.debug(`[db] query ok in ${Date.now() - start}ms — rows: ${result.rowCount ?? 0}`);
        }
        return result;
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("[db] query failed:", {
            text,
            params,
            durationMs: Date.now() - start,
            error,
        });
        throw error;
    }
}
/**
 * Verify connectivity to PostgreSQL.
 *
 * Runs `SELECT NOW()` against the pool. Logs the server time on success and
 * rethrows on failure so the caller can decide whether to abort startup.
 *
 * @returns The PostgreSQL server timestamp at the moment of the check.
 */
export async function checkDbConnection() {
    try {
        const result = await pool.query("SELECT NOW() as now");
        const now = result.rows[0]?.now ?? new Date();
        // eslint-disable-next-line no-console
        console.log(`\u2705 [db] PostgreSQL reachable. Server time: ${now.toISOString()}`);
        return now;
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("\u274C [db] PostgreSQL connection check failed:", error);
        throw error;
    }
}
/**
 * Gracefully close the pool. Safe to call multiple times.
 * Intended for shutdown hooks (SIGINT/SIGTERM).
 */
export async function closeDbPool() {
    try {
        await pool.end();
        // eslint-disable-next-line no-console
        console.log("[db] PostgreSQL pool closed.");
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("[db] Error closing PostgreSQL pool:", error);
    }
}
//# sourceMappingURL=db.js.map
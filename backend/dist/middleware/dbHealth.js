/**
 * Health-check router.
 *
 * Exposes `GET /health` reporting the live status of every external
 * dependency the API talks to:
 *
 *   - PostgreSQL (raw `pg` pool)
 *   - Prisma (issues a `SELECT 1`)
 *   - Supabase Auth (admin client `getSession` round-trip)
 *
 * Returns HTTP 200 when every dependency is healthy and HTTP 503 when at
 * least one is down. Designed to be polled by uptime checks, load balancers,
 * and Kubernetes-style readiness probes.
 */
import { Router } from "express";
import { checkDbConnection } from "../config/db.js";
import { prisma } from "../config/prisma.js";
import { supabaseAdmin } from "../config/supabase.js";
/**
 * Run a single async check and shape the result into `DependencyStatus`.
 *
 * Never throws — errors are captured and reflected in the returned object.
 */
async function runCheck(check) {
    const start = Date.now();
    try {
        await check();
        return { status: "up", latencyMs: Date.now() - start };
    }
    catch (error) {
        return {
            status: "down",
            latencyMs: Date.now() - start,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Express router exposing the `/health` endpoint.
 *
 * Mount it at the root of the app:
 *
 * ```ts
 * app.use(healthRouter);
 * ```
 */
export const healthRouter = Router();
healthRouter.get("/health", async (_req, res) => {
    const [db, prismaStatus, supabase] = await Promise.all([
        runCheck(() => checkDbConnection()),
        runCheck(() => prisma.$queryRaw `SELECT 1`),
        runCheck(async () => {
            const { error } = await supabaseAdmin.auth.getSession();
            if (error)
                throw error;
        }),
    ]);
    const report = {
        status: db.status === "up" && prismaStatus.status === "up" && supabase.status === "up"
            ? "ok"
            : "degraded",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: { db, prisma: prismaStatus, supabase },
    };
    res.status(report.status === "ok" ? 200 : 503).json(report);
});
//# sourceMappingURL=dbHealth.js.map
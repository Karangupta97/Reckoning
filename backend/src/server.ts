/**
 * RoadWatch AI — backend entrypoint.
 *
 * Wires together env validation, the database connection layer, the health
 * router and the Express app. Startup aborts if PostgreSQL is unreachable,
 * because a backend that "boots" without its database is worse than one that
 * fails loudly.
 */

import express, { type Express, type Request, type Response } from "express";
import { env, isProduction } from "./config/env.js";
import { checkDbConnection, closeDbPool } from "./config/db.js";
import { disconnectPrisma } from "./config/prisma.js";
import { healthRouter } from "./middleware/dbHealth.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { uploadRouter } from "./modules/upload/upload.routes.js";
import { complaintRouter } from "./modules/complaints/complaint.routes.js";
import { aiRouter } from "./modules/ai/ai.routes.js";
import { adminAuthRouter } from "./modules/admin/auth/adminAuth.routes.js";
import { districtRouter } from "./modules/admin/district/district.routes.js";
import { subDistrictRouter } from "./modules/admin/subDistrict/subDistrict.routes.js";
import { managementRouter } from "./modules/admin/management/management.routes.js";
import { ticketRouter, citizenTicketRouter, superAdminTicketRouter } from "./modules/tickets/tickets.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { verifyEmailTransport } from "./services/email.service.js";
import { startAllWorkers } from "./workers/index.js";
import { checkReckoningHealth } from "./modules/ai/ai.service.js";
import { logger } from "./utils/logger.js";

const app: Express = express();

// Trust the first proxy hop (load balancer / reverse proxy) so `req.ip`
// reflects the real client address — required for correct IP rate limiting.
app.set("trust proxy", 1);

// Baseline hardening headers on every response (nosniff, frame deny, etc.).
app.use(securityHeaders);

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    name: "RoadWatch AI API",
    description: "Civic road reporting platform — backend service.",
    status: "ok",
  });
});

app.use(healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/complaints", complaintRouter);
app.use("/api/complaints", citizenTicketRouter);
app.use("/api/ai", aiRouter);
app.use("/api/tickets", ticketRouter);

// Admin realm. Mount the specific onboarding prefixes BEFORE the catch-all
// management router so `/api/admin/district/*` and `/api/admin/sub-district/*`
// are not shadowed by the management router's `:id` routes.
app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/admin/district", districtRouter);
app.use("/api/admin/sub-district", subDistrictRouter);
app.use("/api/admin", managementRouter);
app.use("/api/admin/tickets", superAdminTicketRouter);

// 404 + global error handler must come AFTER all routes.
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Boot the HTTP server after verifying database connectivity.
 *
 * Exits the process with code 1 if the database is unreachable so that
 * orchestrators (Docker, PM2, Kubernetes) can restart the service instead
 * of leaving it serving 5xx errors.
 */
async function bootstrap(): Promise<void> {
  try {
    await checkDbConnection();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "\u274C Aborting startup: database is unreachable.",
      error,
    );
    process.exit(1);
  }

  // Verify SMTP/SES connectivity. This is non-fatal: the app still boots so
  // non-email routes stay available, but the failure is logged loudly so the
  // operator knows transactional email is currently degraded.
  await verifyEmailTransport();

  // Start background BullMQ workers (no-ops gracefully without Redis).
  startAllWorkers();

  // Non-fatal: check Reckoning AI availability at startup.
  const Reckoning = await checkReckoningHealth();
  if (Reckoning.online) {
    logger.info(`✅ Reckoning AI online — ${Reckoning.modelInfo} (${Reckoning.latencyMs}ms)`);
  } else {
    logger.warn("⚠️  Reckoning AI unreachable — complaint AI detection will be skipped");
  }

  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(
      `\uD83D\uDE80 RoadWatch AI API listening on http://localhost:${env.PORT} ` +
        `(${isProduction ? "production" : env.NODE_ENV})`,
    );
  });

  const shutdown = async (signal: string): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log(`\n[${signal}] Shutting down gracefully...`);
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log("[http] Server closed.");
    });
    await Promise.allSettled([disconnectPrisma(), closeDbPool()]);
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void bootstrap();

export { app };

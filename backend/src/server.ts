/**
 * RoadWatch AI — backend entrypoint.
 *
 * Wires together env validation, the database connection layer, the health
 * router and the Express app. Startup aborts if PostgreSQL is unreachable,
 * because a backend that "boots" without its database is worse than one that
 * fails loudly.
 */

import express, { type Express, type Request, type Response } from "express";
import cors, { type CorsOptions } from "cors";
import { env, isProduction } from "./config/env.js";
import { checkDbConnection, closeDbPool } from "./config/db.js";
import { disconnectPrisma } from "./config/prisma.js";
import { healthRouter } from "./middleware/dbHealth.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { uploadRouter } from "./modules/upload/upload.routes.js";
import { complaintRouter } from "./modules/complaints/complaint.routes.js";
import { aiRouter } from "./modules/ai/ai.routes.js";
import { adminAuthRouter } from "./routes/adminAuth.js";
import { adminInvitationsRouter } from "./routes/adminInvitations.js";
import { superAdminRouter, superAdminCorsOptions } from "./routes/superAdmin.js";
import { ticketRouter, citizenTicketRouter, superAdminTicketRouter } from "./modules/tickets/tickets.routes.js";
import { managementRouter } from "./modules/admin/management/management.routes.js";
import { subDistrictRouter } from "./modules/admin/subDistrict/subDistrict.routes.js";
import { districtRouter } from "./modules/admin/district/district.routes.js";
import { pushRouter } from "./modules/push/push.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { verifyEmailTransport } from "./services/email.service.js";
import { startAllWorkers } from "./workers/index.js";
import { checkReckoningHealth } from "./modules/ai/ai.service.js";
import { logger } from "./utils/logger.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app: Express = express();

const allowedOrigins = (env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : ["http://localhost:3000", env.APP_BASE_URL]
).filter((origin, index, all) => all.indexOf(origin) === index);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow non-browser requests (no Origin header) and allowlisted browser origins.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Trust the first proxy hop (load balancer / reverse proxy) so `req.ip`
// reflects the real client address — required for correct IP rate limiting.
app.set("trust proxy", 1);

// Baseline hardening headers on every response (nosniff, frame deny, etc.).
app.use(securityHeaders);

// Browser-origin protection for frontend -> API requests.
app.use(cors(corsOptions));

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
app.use("/api/push", pushRouter);

// Admin CORS configuration
const adminCorsOptions = {
  origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin || origin === env.ADMIN_FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked origin: ${origin} for admin routes`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Admin Helmet CSP configuration
const adminHelmet = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
});

// Admin global rate limiter (100 requests per 15 minutes)
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again after 15 minutes.",
    },
  },
});

// Apply security hardening to the Admin realm
app.use("/api/admin", cors(adminCorsOptions));
app.use("/api/admin", adminHelmet);
app.use("/api/admin", adminRateLimiter);

// Register admin routes
app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/admin/invitations", adminInvitationsRouter);
app.use("/api/admin/tickets", superAdminTicketRouter);
app.use("/api/admin/district", districtRouter);
app.use("/api/admin/sub-district", subDistrictRouter);
app.use("/api/admin", managementRouter);


// Register super-admin routes
app.use("/api/super-admin", cors(superAdminCorsOptions));
app.use("/api/super-admin", superAdminRouter);

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

  // Node.js defaults keepAliveTimeout to 5 s. Slow requests (AI inference +
  // PostGIS + S3) can take 20-40 s — the connection would be reset before the
  // response is sent, causing ECONNRESET on the client even though the DB
  // write already succeeded. 65 s clears the request with room to spare.
  // headersTimeout must always be > keepAliveTimeout.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 70_000;

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

  // Suppress ioredis/BullMQ socket errors (ECONNRESET, ETIMEDOUT) that bubble
  // up as uncaught exceptions during reconnection. ioredis handles reconnection
  // internally — these are informational, not fatal.
  process.on("uncaughtException", (error: NodeJS.ErrnoException) => {
    if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
      // eslint-disable-next-line no-console
      console.warn(`[redis] Connection issue (${error.code}) — reconnecting...`);
      return;
    }
    // Re-throw truly unexpected errors.
    // eslint-disable-next-line no-console
    console.error("[uncaughtException]", error);
    process.exit(1);
  });
}

void bootstrap();

export { app };

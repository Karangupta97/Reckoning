import { Router } from "express";
import { z } from "zod";
import { Redis } from "ioredis";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import jwt from "jsonwebtoken";

import { requireAdminAuth } from "../middleware/adminAuth.js";
import {
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../utils/adminAuth.js";

const router = Router();

// Configure Redis Client lazily
let redis: Redis | null = null;
if (env.REDIS_URL) {
  try {
    redis = new Redis(env.REDIS_URL);
    redis.on("error", (err: any) => {
      logger.error("[Redis] Client error in adminAuth routes", { error: String(err) });
    });
  } catch (err) {
    logger.error("[Redis] Initialization failed", { error: String(err) });
  }
}

// Memory fallback store for login rate limiter
const memoryStore = new Map<string, number[]>();

/**
 * Sliding window rate limiter for login
 * Allows 10 attempts per IP per 15 minutes.
 */
async function loginRateLimiter(req: any, res: any, next: any) {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const key = `rate_limit:admin_login:${ip}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const limit = 10;

  if (redis) {
    try {
      const pipeline = redis.multi();
      pipeline.zremrangebyscore(key, 0, now - windowMs);
      pipeline.zcard(key);
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      pipeline.expire(key, 900); // 15 minutes

      const results = await pipeline.exec();
      if (results) {
        // results format is [[null, num_removed], [null, count], ...]
        const cardResult = results[1];
        const count = cardResult ? (cardResult[1] as number) : 0;

        if (count >= limit) {
          logger.warn("Admin login rate limit exceeded via Redis", { ip });
          return res.status(429).json({
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: "Too many login attempts. Please try again after 15 minutes.",
            },
          });
        }
      }
    } catch (err) {
      logger.error("[RateLimit] Redis sliding window failure, using memory fallback", { error: String(err) });
    }
  }

  // Memory Fallback
  let timestamps = memoryStore.get(key) || [];
  timestamps = timestamps.filter((t) => t > now - windowMs);
  if (timestamps.length >= limit) {
    memoryStore.set(key, timestamps);
    logger.warn("Admin login rate limit exceeded via memory fallback", { ip });
    return res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many login attempts. Please try again after 15 minutes.",
      },
    });
  }
  timestamps.push(now);
  memoryStore.set(key, timestamps);
  next();
}

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password must not be empty"),
});

// POST /api/admin/auth/login
router.post("/login", loginRateLimiter, async (req: any, res: any) => {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message || "Validation failed.",
        },
      });
    }

    const { email, password } = parsed.data;

    // Case-insensitive query
    const admin = await prisma.adminUser.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    // Unknown email: run dummy bcrypt compare to prevent timing attack / user enumeration
    if (!admin) {
      await bcrypt.compare(password, env.DUMMY_HASH);
      logger.warn("Admin login failed: Email not found (timing dummy executed)", { ip, email });
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "There is no account with this email.",
        },
      });
    }

    // Check account status
    if (!admin.isActive) {
      logger.warn("Admin login blocked: Account disabled", { ip, adminId: admin.id });
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCOUNT_DISABLED",
          message: "This account has been disabled.",
        },
      });
    }

    // Check lockout
    if (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now()) {
      const retryAfter = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 1000);
      logger.warn("Admin login blocked: Account locked", { ip, adminId: admin.id, retryAfter });
      return res.status(423).json({
        success: false,
        error: {
          code: "ACCOUNT_LOCKED",
          message: `Account temporarily locked. Try again in ${retryAfter} seconds.`,
          meta: { retryAfter },
        },
      });
    }

    // Verify Password
    const isPasswordValid = await verifyPassword(password, admin.passwordHash);
    if (!isPasswordValid) {
      const attempts = admin.failedLoginAttempts + 1;
      const shouldLock = attempts >= 5;
      const lockedUntil = shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : attempts,
          lockedUntil,
        },
      });

      logger.warn(`Admin login failed: Invalid password (attempt ${attempts})`, {
        ip,
        adminId: admin.id,
        locked: shouldLock,
      });

      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });
    }

    // Reset failed attempts on success
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    let districtId = admin.districtId;
    let subDistrictId = admin.subDistrictId;
    if (admin.role === "SUB_DISTRICT_ADMIN") {
      if (subDistrictId && !districtId) {
        const subDist = await prisma.subDistrict.findUnique({
          where: { id: subDistrictId },
          select: { districtId: true },
        });
        if (subDist) {
          districtId = subDist.districtId;
        }
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      districtId,
      subDistrictId,
    });

    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);

    // Store refresh token
    await prisma.adminRefreshToken.create({
      data: {
        adminUserId: admin.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: ip,
        userAgent: req.headers["user-agent"] || "unknown",
      },
    });

    let finalAccessToken = accessToken;
    if (admin.role === "SUPER_ADMIN") {
      const session = await prisma.superAdminSession.create({
        data: {
          adminId: admin.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      finalAccessToken = jwt.sign(
        {
          sub: admin.id,
          email: admin.email,
          role: admin.role,
          districtId: admin.districtId ?? null,
          subDistrictId: admin.subDistrictId ?? null,
          sessionId: session.id,
        },
        env.ADMIN_JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.setHeader("Set-Cookie", [
        `super_admin_access_token=${finalAccessToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900`,
        `super_admin_refresh_token=${rawRefreshToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
      ]);
    }

    logger.info("Admin logged in successfully", { ip, adminId: admin.id, action: "login" });

    return res.status(200).json({
      success: true,
      data: {
        accessToken: finalAccessToken,
        refreshToken: rawRefreshToken,
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
          districtId: admin.districtId,
          subDistrictId: admin.subDistrictId,
        },
      },
    });
  } catch (err) {
    logger.error("Unhandled error during admin login", { error: String(err) });
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An internal server error occurred.",
      },
    });
  }
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// POST /api/admin/auth/refresh
router.post("/refresh", async (req: any, res: any) => {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message || "Validation failed.",
        },
      });
    }

    const { refreshToken } = parsed.data;
    const tokenHash = hashToken(refreshToken);

    const storedToken = await prisma.adminRefreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        adminUser: true,
      },
    });

    if (!storedToken) {
      logger.warn("Admin refresh failed: Invalid or expired refresh token", { ip });
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_REFRESH_TOKEN",
          message: "Invalid or expired refresh token.",
        },
      });
    }

    const admin = storedToken.adminUser;
    if (!admin.isActive) {
      logger.warn("Admin refresh blocked: Admin account disabled", { ip, adminId: admin.id });
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCOUNT_DISABLED",
          message: "This account has been disabled.",
        },
      });
    }

    // Rotate refresh token
    const now = new Date();
    const rawNewRefreshToken = generateRefreshToken();
    const newHashedToken = hashToken(rawNewRefreshToken);

    await prisma.$transaction([
      prisma.adminRefreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: now },
      }),
      prisma.adminRefreshToken.create({
        data: {
          adminUserId: admin.id,
          tokenHash: newHashedToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ipAddress: ip,
          userAgent: req.headers["user-agent"] || "unknown",
        },
      }),
    ]);

    let districtId = admin.districtId;
    let subDistrictId = admin.subDistrictId;
    if (admin.role === "SUB_DISTRICT_ADMIN") {
      if (subDistrictId && !districtId) {
        const subDist = await prisma.subDistrict.findUnique({
          where: { id: subDistrictId },
          select: { districtId: true },
        });
        if (subDist) {
          districtId = subDist.districtId;
        }
      }
    }

    const newAccessToken = generateAccessToken({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      districtId,
      subDistrictId,
    });

    let finalAccessToken = newAccessToken;
    if (admin.role === "SUPER_ADMIN") {
      const session = await prisma.superAdminSession.create({
        data: {
          adminId: admin.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      finalAccessToken = jwt.sign(
        {
          sub: admin.id,
          email: admin.email,
          role: admin.role,
          districtId: admin.districtId ?? null,
          subDistrictId: admin.subDistrictId ?? null,
          sessionId: session.id,
        },
        env.ADMIN_JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.setHeader("Set-Cookie", [
        `super_admin_access_token=${finalAccessToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900`,
        `super_admin_refresh_token=${rawNewRefreshToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
      ]);
    }

    logger.info("Admin token refreshed successfully", { ip, adminId: admin.id, action: "token_refresh" });

    return res.status(200).json({
      success: true,
      data: {
        accessToken: finalAccessToken,
        refreshToken: rawNewRefreshToken,
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
          districtId: admin.districtId,
          subDistrictId: admin.subDistrictId,
        },
      },
    });
  } catch (err) {
    logger.error("Unhandled error during admin refresh", { error: String(err) });
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An internal server error occurred.",
      },
    });
  }
});

// POST /api/admin/auth/logout
router.post("/logout", requireAdminAuth, async (req: any, res: any) => {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.adminRefreshToken.updateMany({
        where: {
          tokenHash,
          adminUserId: req.admin.sub,
        },
        data: {
          revokedAt: new Date(),
        },
      });
      logger.info("Admin logged out (token revoked)", { ip, adminId: req.admin.sub, action: "logout" });
    } else {
      logger.info("Admin logged out (no token provided to revoke)", { ip, adminId: req.admin.sub, action: "logout" });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error("Unhandled error during admin logout", { error: String(err) });
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An internal server error occurred.",
      },
    });
  }
});

// GET /api/admin/auth/me
router.get("/me", requireAdminAuth, async (req: any, res: any) => {
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.admin.sub },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ADMIN_NOT_FOUND",
          message: "Admin not found.",
        },
      });
    }

    const { passwordHash, failedLoginAttempts, lockedUntil, ...safeAdmin } = admin;

    return res.status(200).json({
      success: true,
      data: safeAdmin,
    });
  } catch (err) {
    logger.error("Unhandled error during admin profile fetch", { error: String(err) });
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An internal server error occurred.",
      },
    });
  }
});

export { router as adminAuthRouter };

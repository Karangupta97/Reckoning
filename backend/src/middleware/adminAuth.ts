import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { type AdminJWTPayload } from "../utils/adminAuth.js";

/**
 * Middleware that extracts and verifies the admin bearer token.
 * Populates req.admin on success.
 */
export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: {
        code: "NO_TOKEN",
        message: "No token provided.",
      },
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, env.ADMIN_JWT_SECRET) as any;

    if (!decoded.sub || !decoded.role) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid token payload.",
        },
      });
      return;
    }

    req.admin = {
      sub: decoded.sub,
      id: decoded.sub, // Map sub to id for compatibility
      email: decoded.email ?? "",
      role: decoded.role,
      districtId: decoded.districtId ?? null,
      subDistrictId: decoded.subDistrictId ?? null,
      country: decoded.country ?? null,
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired token.",
      },
    });
  }
}

/**
 * General role check middleware.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        error: {
          code: "NO_TOKEN",
          message: "No token provided.",
        },
      });
      return;
    }

    if (!roles.includes(req.admin.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Insufficient permissions.",
        },
      });
      return;
    }

    next();
  };
}

export const requireSuperAdmin = requireRole("SUPER_ADMIN");
export const requireDistrictAdmin = requireRole("SUPER_ADMIN", "DISTRICT_ADMIN");

/**
 * Bearer access-token authentication middleware for the ADMIN realm.
 *
 * Extracts a JWT from the `Authorization: Bearer <token>` header, verifies it
 * with the SEPARATE admin access secret ({@link env.ADMIN_JWT_ACCESS_SECRET}),
 * and attaches the decoded principal to `req.admin`. A citizen token is
 * therefore structurally unable to authenticate here.
 *
 * Failure modes map to distinct, client-safe 401 errors:
 *   - No/blank token          → `NO_TOKEN`        "No token"
 *   - Expired token           → `TOKEN_EXPIRED`   "Token expired"
 *   - Any other invalid token → `INVALID_TOKEN`   "Invalid token"
 *
 * Like {@link requireAuth}, it does NOT hit the database — auth stays O(1) and
 * stateless. Routes needing fresh, authoritative admin data (status changes,
 * suspensions) should re-fetch from the DB rather than trusting the payload.
 */

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import type {
  AdminCountry,
  AdminRole,
  DecodedAdminToken,
} from "../utils/adminJwt.js";

/** Algorithm tokens are signed with; enforced on verify to prevent downgrade. */
const ALGORITHM = "HS256" as const;

/**
 * Read the bearer token from the `Authorization` header.
 *
 * @param header Raw `Authorization` header value, if any.
 * @returns The token string, or `null` when absent/malformed.
 */
function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer") return null;
  if (!token || token.trim().length === 0) return null;
  return token.trim();
}

/**
 * Express middleware enforcing a valid admin access token.
 *
 * On success, populates `req.admin` with the decoded identity + jurisdiction
 * and calls `next()`. On failure, forwards a 401 {@link AppError} to the global
 * error handler.
 *
 * @example
 * router.get("/me", requireAdminAuth, adminAuthController.me);
 */
export function requireAdminAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = extractBearer(req.headers.authorization);
  if (!token) {
    next(new AppError("No token", 401, { code: "NO_TOKEN" }));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.ADMIN_JWT_ACCESS_SECRET, {
      algorithms: [ALGORITHM],
    }) as DecodedAdminToken;

    if (decoded.type !== "access" || !decoded.sub) {
      next(new AppError("Invalid token", 401, { code: "INVALID_TOKEN" }));
      return;
    }

    req.admin = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role as AdminRole,
      districtId: decoded.districtId ?? null,
      subDistrictId: decoded.subDistrictId ?? null,
      country: (decoded.country ?? null) as AdminCountry | null,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError("Token expired", 401, { code: "TOKEN_EXPIRED" }));
      return;
    }
    next(
      new AppError("Invalid token", 401, {
        code: "INVALID_TOKEN",
        cause: error,
      }),
    );
  }
}

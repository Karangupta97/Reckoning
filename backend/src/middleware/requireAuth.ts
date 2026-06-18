/**
 * Bearer access-token authentication middleware.
 *
 * Extracts a JWT from the `Authorization: Bearer <token>` header, verifies it
 * with the access secret, and attaches the decoded principal to `req.user`.
 *
 * Failure modes map to distinct, client-safe 401 errors:
 *   - No/blank token            → `NO_TOKEN`        "No token provided"
 *   - Expired token             → `TOKEN_EXPIRED`   "Token expired"
 *   - Any other invalid token   → `INVALID_TOKEN`   "Invalid token"
 *
 * It does NOT hit the database — that keeps auth O(1) and stateless. Routes
 * that need fresh, authoritative user data (e.g. `/me`) should re-fetch from
 * the DB rather than trusting the token payload for sensitive fields.
 */

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import type { DecodedToken, UserCountry, UserRole } from "../utils/jwt.js";

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
 * Express middleware enforcing a valid access token.
 *
 * On success, populates `req.user` with `{ id, email, role, country }` and
 * calls `next()`. On failure, forwards a 401 {@link AppError} to the global
 * error handler.
 *
 * @example
 * router.get("/me", requireAuth, authController.me);
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req.headers.authorization);
  if (!token) {
    next(new AppError("No token provided", 401, { code: "NO_TOKEN" }));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: [ALGORITHM],
    }) as DecodedToken;

    if (decoded.type !== "access" || !decoded.sub) {
      next(new AppError("Invalid token", 401, { code: "INVALID_TOKEN" }));
      return;
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role as UserRole,
      ...(decoded.country ? { country: decoded.country as UserCountry } : {}),
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

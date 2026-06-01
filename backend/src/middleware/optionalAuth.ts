/**
 * Optional bearer-token authentication middleware.
 *
 * Mirrors {@link requireAuth} but NEVER rejects the request: if a valid access
 * token is present it populates `req.user`; if the token is missing, malformed,
 * or invalid it simply continues unauthenticated. Use on public routes that
 * reveal extra detail to the owner (e.g. `GET /api/complaints/:id`).
 */

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
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
 * Populate `req.user` when a valid access token is present; otherwise proceed
 * unauthenticated. Always calls `next()` without an error.
 *
 * @example
 * router.get("/:id", optionalAuth, complaintController.getById);
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req.headers.authorization);
  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: [ALGORITHM],
    }) as DecodedToken;

    if (decoded.type === "access" && decoded.sub) {
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role as UserRole,
        ...(decoded.country ? { country: decoded.country as UserCountry } : {}),
      };
    }
  } catch {
    // Invalid token on an optional route → treat as anonymous, never throw.
  }
  next();
}

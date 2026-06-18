/**
 * Role-based access-control guard factory for the admin realm.
 *
 * Produces a middleware that admits a request only when `req.admin.role` is one
 * of the allowed roles. MUST be mounted AFTER {@link requireAdminAuth} so the
 * principal is present.
 *
 * @example
 * router.post(
 *   "/district/invite",
 *   requireAdminAuth,
 *   requireRole("SUPER_ADMIN"),
 *   districtController.invite,
 * );
 */

import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import type { AdminRole } from "../utils/adminJwt.js";

/**
 * Build an RBAC middleware admitting only the listed admin roles.
 *
 * @param roles One or more {@link AdminRole}s permitted to proceed.
 * @returns Express middleware enforcing the allow-list.
 * @throws {AppError} 401 when unauthenticated, 403 when the role is not allowed.
 */
export function requireRole(...roles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin) {
      next(new AppError("No token", 401, { code: "NO_TOKEN" }));
      return;
    }
    if (!roles.includes(req.admin.role)) {
      next(
        new AppError("Insufficient permissions", 403, {
          code: "INSUFFICIENT_PERMISSIONS",
        }),
      );
      return;
    }
    next();
  };
}

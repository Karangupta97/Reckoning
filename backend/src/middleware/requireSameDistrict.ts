/**
 * District-jurisdiction boundary guard.
 *
 * For DISTRICT_ADMIN routes that reference a `:districtId` path parameter, this
 * confirms the authenticated admin actually owns that district. A SUPER_ADMIN
 * bypasses the check (they see all districts). MUST be mounted AFTER
 * {@link requireAdminAuth}.
 *
 * @example
 * router.get(
 *   "/districts/:districtId/escalations",
 *   requireAdminAuth,
 *   requireRole("SUPER_ADMIN", "DISTRICT_ADMIN"),
 *   requireSameDistrict,
 *   handler,
 * );
 */

import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";

/** Path-param name carrying the target district id. */
const DISTRICT_PARAM = "districtId";

/**
 * Express middleware enforcing district ownership on `:districtId` routes.
 *
 * @throws {AppError} 401 when unauthenticated, 403 when the district does not
 *         match the admin's jurisdiction.
 */
export function requireSameDistrict(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.admin) {
    next(new AppError("No token", 401, { code: "NO_TOKEN" }));
    return;
  }

  // SUPER_ADMIN has global visibility — bypass the boundary check.
  if (req.admin.role === "SUPER_ADMIN") {
    next();
    return;
  }

  const targetDistrictId = req.params[DISTRICT_PARAM];
  if (!targetDistrictId || req.admin.districtId !== targetDistrictId) {
    next(
      new AppError("Access denied to this district", 403, {
        code: "DISTRICT_ACCESS_DENIED",
      }),
    );
    return;
  }
  next();
}

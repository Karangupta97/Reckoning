/**
 * Sub-district-jurisdiction boundary guard.
 *
 * For SUB_DISTRICT_ADMIN routes that reference a `:subDistrictId` path
 * parameter, this confirms the authenticated admin owns that sub-district.
 *
 * Bypass rules (escalating visibility):
 *   - SUPER_ADMIN     → always bypass.
 *   - DISTRICT_ADMIN  → bypass when the sub-district belongs to their district
 *                       (the owning district id is resolved by the caller and
 *                       provided as a verified param/locals, see below).
 *   - SUB_DISTRICT_ADMIN → must match exactly.
 *
 * The DISTRICT_ADMIN containment check needs the sub-district's parent district
 * id. To keep this middleware DB-free and O(1), callers that want the
 * district-level bypass should resolve and attach the owning district id to
 * `res.locals.subDistrictDistrictId` in a preceding step; when it is absent the
 * DISTRICT_ADMIN is held to the strict match (deny) for safety.
 *
 * MUST be mounted AFTER {@link requireAdminAuth}.
 */

import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";

/** Path-param name carrying the target sub-district id. */
const SUB_DISTRICT_PARAM = "subDistrictId";

/**
 * Express middleware enforcing sub-district ownership on `:subDistrictId`
 * routes, with SUPER_ADMIN / in-district DISTRICT_ADMIN bypasses.
 *
 * @throws {AppError} 401 when unauthenticated, 403 when the sub-district does
 *         not match the admin's jurisdiction.
 */
export function requireSameSubDistrict(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.admin) {
    next(new AppError("No token", 401, { code: "NO_TOKEN" }));
    return;
  }

  // SUPER_ADMIN has global visibility — always bypass.
  if (req.admin.role === "SUPER_ADMIN") {
    next();
    return;
  }

  // DISTRICT_ADMIN bypasses when the sub-district sits inside their district.
  if (req.admin.role === "DISTRICT_ADMIN") {
    const owningDistrictId = res.locals.subDistrictDistrictId as
      | string
      | undefined;
    if (owningDistrictId && owningDistrictId === req.admin.districtId) {
      next();
      return;
    }
    next(
      new AppError("Access denied to this sub-district", 403, {
        code: "SUB_DISTRICT_ACCESS_DENIED",
      }),
    );
    return;
  }

  // SUB_DISTRICT_ADMIN must match exactly.
  const targetSubDistrictId = req.params[SUB_DISTRICT_PARAM];
  if (!targetSubDistrictId || req.admin.subDistrictId !== targetSubDistrictId) {
    next(
      new AppError("Access denied to this sub-district", 403, {
        code: "SUB_DISTRICT_ACCESS_DENIED",
      }),
    );
    return;
  }
  next();
}

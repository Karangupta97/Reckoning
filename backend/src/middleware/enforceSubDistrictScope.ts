import type { Request, Response, NextFunction } from "express";

/**
 * Middleware that enforces strict sub-district admin scope checks.
 * Verifies that the authenticated admin has both `subDistrictId` and `districtId` claims,
 * and attaches them to `req.scope` for downstream routers and controllers to use.
 */
export function enforceSubDistrictScope(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const user = req.user || req.admin;
  const subDistrictId = user?.subDistrictId;
  const districtId = user?.districtId;

  if (!subDistrictId || !districtId) {
    res.status(403).json({
      error: "INSUFFICIENT_SCOPE",
      message: "Admin profile is missing jurisdiction assignment",
    });
    return;
  }

  req.scope = {
    subDistrictId,
    districtId,
  };

  next();
}

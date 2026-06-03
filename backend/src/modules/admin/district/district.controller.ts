/**
 * District onboarding controllers — thin HTTP adapters.
 *
 * Read already-validated request data, delegate to the district service, and
 * shape the standard `{ success, data }` envelope. No business logic here.
 */

import type { NextFunction, Request, Response } from "express";
import * as districtService from "./district.service.js";
import { AppError } from "../../../utils/AppError.js";
import type { RequestContext } from "../admin.types.js";
import type {
  DistrictActivateBody,
  DistrictInviteBody,
  DistrictResendBody,
} from "./district.validation.js";

/**
 * Build a {@link RequestContext} from the HTTP layer (IP + User-Agent).
 *
 * @param req Express request.
 * @returns The extracted request context for session auditing.
 */
function requestContext(req: Request): RequestContext {
  const ua = req.headers["user-agent"];
  return {
    ...(req.ip ? { ipAddress: req.ip } : {}),
    ...(typeof ua === "string" ? { userAgent: ua } : {}),
  };
}

/**
 * `POST /api/admin/district/invite` — Super Admin invites a District Admin.
 *
 * @returns 201 with `{ success: true, data: InviteResult }`.
 */
export async function invite(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError("No token", 401, { code: "NO_TOKEN" });
    }
    const body = req.body as DistrictInviteBody;
    const result = await districtService.inviteDistrictAdmin(req.admin.id, {
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      designation: body.designation,
      department: body.department,
      country: body.country,
      districtName: body.districtName,
      geofence: body.geofence as districtService.DistrictInviteInput["geofence"],
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `POST /api/admin/district/activate` — token-based account activation.
 *
 * @returns 200 with `{ success: true, data: AdminAuthResult }`.
 */
export async function activate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as DistrictActivateBody;
    const result = await districtService.activateDistrictAdmin(
      { token: body.token, password: body.password },
      requestContext(req),
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `POST /api/admin/district/resend-invite` — Super Admin re-issues an invite.
 *
 * @returns 200 with `{ success: true, data: InviteResult }`.
 */
export async function resendInvite(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError("No token", 401, { code: "NO_TOKEN" });
    }
    const { adminId } = req.body as DistrictResendBody;
    const result = await districtService.resendDistrictInvite(adminId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

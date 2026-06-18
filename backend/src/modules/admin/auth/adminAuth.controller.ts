/**
 * Admin auth controllers — thin HTTP adapters.
 *
 * Read already-validated request data, delegate to the admin auth service, and
 * shape the standard `{ success, data }` envelope. No business logic here.
 */

import type { NextFunction, Request, Response } from "express";
import * as adminAuthService from "./adminAuth.service.js";
import { AppError } from "../../../utils/AppError.js";
import type { RequestContext } from "../admin.types.js";
import type {
  AdminLoginBody,
  AdminLogoutBody,
  AdminRefreshBody,
} from "./adminAuth.validation.js";

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
 * `POST /api/admin/auth/login` — authenticate an admin (any tier).
 *
 * @returns 200 with `{ success: true, data: AdminAuthResult }`.
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await adminAuthService.login(
      req.body as AdminLoginBody,
      requestContext(req),
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `POST /api/admin/auth/refresh` — rotate tokens with a valid refresh token.
 *
 * @returns 200 with `{ success: true, data: AdminRefreshResult }`.
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refreshToken } = req.body as AdminRefreshBody;
    const result = await adminAuthService.refresh(
      refreshToken,
      requestContext(req),
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `POST /api/admin/auth/logout` — revoke this device's token or all of them.
 *
 * Requires admin authentication (`requireAdminAuth` populates `req.admin`).
 *
 * @returns 200 with `{ success: true, data: { message } }`.
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError("No token", 401, { code: "NO_TOKEN" });
    }
    const { refreshToken, allDevices } = req.body as AdminLogoutBody;
    const result = await adminAuthService.logout({
      adminId: req.admin.id,
      ...(refreshToken ? { refreshToken } : {}),
      ...(allDevices ? { allDevices } : {}),
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `GET /api/admin/auth/me` — return the authenticated admin's fresh profile.
 *
 * Requires admin authentication (`requireAdminAuth` populates `req.admin`).
 *
 * @returns 200 with `{ success: true, data: { admin } }`.
 */
export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError("No token", 401, { code: "NO_TOKEN" });
    }
    const admin = await adminAuthService.getMe(req.admin.id);
    res.status(200).json({ success: true, data: { admin } });
  } catch (error) {
    next(error);
  }
}

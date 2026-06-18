/**
 * Admin auth router — login / refresh / logout / me.
 *
 * Mounted by the app under `/api/admin/auth`. Each route applies its rate
 * limiter, then Zod validation, then the thin controller. Login uses the
 * broad per-IP limiter first, then the targeted IP+email limiter.
 */

import { Router } from "express";
import * as adminAuthController from "./adminAuth.controller.js";
import {
  adminLoginSchema,
  adminLogoutSchema,
  adminRefreshSchema,
} from "./adminAuth.validation.js";
import { validate } from "../../../middleware/validate.js";
import { requireAdminAuth } from "../../../middleware/requireAdminAuth.js";
import {
  adminLoginEmailLimiter,
  adminLoginIpLimiter,
  adminLogoutLimiter,
  adminRefreshLimiter,
} from "../../../middleware/rateLimiter.js";

/**
 * Express router exposing the admin auth endpoints. Mount under
 * `/api/admin/auth`:
 *
 * ```ts
 * app.use("/api/admin/auth", adminAuthRouter);
 * ```
 */
export const adminAuthRouter: Router = Router();

adminAuthRouter.post(
  "/login",
  adminLoginIpLimiter,
  validate({ body: adminLoginSchema }),
  adminLoginEmailLimiter,
  adminAuthController.login,
);

adminAuthRouter.post(
  "/refresh",
  adminRefreshLimiter,
  validate({ body: adminRefreshSchema }),
  adminAuthController.refresh,
);

adminAuthRouter.post(
  "/logout",
  adminLogoutLimiter,
  requireAdminAuth,
  validate({ body: adminLogoutSchema }),
  adminAuthController.logout,
);

adminAuthRouter.get("/me", requireAdminAuth, adminAuthController.me);

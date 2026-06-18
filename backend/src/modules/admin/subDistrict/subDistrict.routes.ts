/**
 * Sub-District onboarding router — `/api/admin/sub-district/*`.
 *
 *   POST /invite    → District Admin invites a Sub-District Admin (auth + role)
 *   POST /activate  → public, token-based account activation
 *
 * Mounted by the app under `/api/admin/sub-district`.
 */

import { Router } from "express";
import * as subDistrictController from "./subDistrict.controller.js";
import {
  subDistrictActivateSchema,
  subDistrictInviteSchema,
} from "./subDistrict.validation.js";
import { validate } from "../../../middleware/validate.js";
import { requireAdminAuth } from "../../../middleware/requireAdminAuth.js";
import { requireRole } from "../../../middleware/requireRole.js";
import {
  adminActivateLimiter,
  adminInviteLimiter,
} from "../../../middleware/rateLimiter.js";

/**
 * Express router exposing the sub-district onboarding endpoints. Mount under
 * `/api/admin/sub-district`:
 *
 * ```ts
 * app.use("/api/admin/sub-district", subDistrictRouter);
 * ```
 */
export const subDistrictRouter: Router = Router();

subDistrictRouter.post(
  "/invite",
  requireAdminAuth,
  requireRole("DISTRICT_ADMIN"),
  adminInviteLimiter,
  validate({ body: subDistrictInviteSchema }),
  subDistrictController.invite,
);

subDistrictRouter.post(
  "/activate",
  adminActivateLimiter,
  validate({ body: subDistrictActivateSchema }),
  subDistrictController.activate,
);

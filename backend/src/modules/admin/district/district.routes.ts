/**
 * District onboarding router — `/api/admin/district/*`.
 *
 *   POST /invite         → Super Admin invites a District Admin (auth + role)
 *   POST /activate       → public, token-based account activation
 *   POST /resend-invite  → Super Admin re-issues an invite (auth + role)
 *
 * Mounted by the app under `/api/admin/district`.
 */

import { Router } from "express";
import * as districtController from "./district.controller.js";
import {
  districtActivateSchema,
  districtInviteSchema,
  districtResendSchema,
} from "./district.validation.js";
import { validate } from "../../../middleware/validate.js";
import { requireAdminAuth } from "../../../middleware/requireAdminAuth.js";
import { requireRole } from "../../../middleware/requireRole.js";
import {
  adminActivateLimiter,
  adminInviteLimiter,
} from "../../../middleware/rateLimiter.js";

/**
 * Express router exposing the district onboarding endpoints. Mount under
 * `/api/admin/district`:
 *
 * ```ts
 * app.use("/api/admin/district", districtRouter);
 * ```
 */
export const districtRouter: Router = Router();

districtRouter.post(
  "/invite",
  requireAdminAuth,
  requireRole("SUPER_ADMIN"),
  adminInviteLimiter,
  validate({ body: districtInviteSchema }),
  districtController.invite,
);

districtRouter.post(
  "/activate",
  adminActivateLimiter,
  validate({ body: districtActivateSchema }),
  districtController.activate,
);

districtRouter.post(
  "/resend-invite",
  requireAdminAuth,
  requireRole("SUPER_ADMIN"),
  adminInviteLimiter,
  validate({ body: districtResendSchema }),
  districtController.resendInvite,
);

/**
 * Complaints router.
 *
 * Endpoints:
 *   POST   /api/complaints         → submit (auth + 10/hour/user rate limit)
 *   GET    /api/complaints         → public list (60/min/IP rate limit)
 *   GET    /api/complaints/my      → own list (auth, paginated)
 *   GET    /api/complaints/my/stats→ own aggregate stats (auth)
 *   GET    /api/complaints/:id     → public single (optional auth → owner detail)
 *   PATCH  /api/complaints/:id     → update own (auth, owner or ADMIN)
 *   DELETE /api/complaints/:id     → soft delete (auth, owner or ADMIN)
 *
 * Each route applies its rate limiter, then Zod validation, then the thin
 * controller. Mounted by the app under `/api/complaints`.
 */

import { Router } from "express";
import * as complaintController from "./complaint.controller.js";
import {
  complaintIdParamSchema,
  createComplaintSchema,
  listComplaintsSchema,
  listMyComplaintsSchema,
  updateComplaintSchema,
} from "./complaint.validation.js";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { optionalAuth } from "../../middleware/optionalAuth.js";
import {
  createComplaintLimiter,
  listComplaintsLimiter,
} from "../../middleware/rateLimiter.js";

/**
 * Express router exposing the complaint endpoints. Mount under `/api/complaints`:
 *
 * ```ts
 * app.use("/api/complaints", complaintRouter);
 * ```
 */
export const complaintRouter: Router = Router();

complaintRouter.post(
  "/",
  requireAuth,
  createComplaintLimiter,
  validate({ body: createComplaintSchema }),
  complaintController.create,
);

complaintRouter.get(
  "/",
  listComplaintsLimiter,
  validate({ query: listComplaintsSchema }),
  complaintController.list,
);

// /my routes MUST come BEFORE /:id to avoid `my` being parsed as an id.
complaintRouter.get(
  "/my",
  requireAuth,
  validate({ query: listMyComplaintsSchema }),
  complaintController.listMy,
);

complaintRouter.get(
  "/my/stats",
  requireAuth,
  complaintController.myStats,
);

complaintRouter.get(
  "/:id",
  optionalAuth,
  validate({ params: complaintIdParamSchema }),
  complaintController.getById,
);

complaintRouter.patch(
  "/:id",
  requireAuth,
  validate({ params: complaintIdParamSchema, body: updateComplaintSchema }),
  complaintController.update,
);

complaintRouter.delete(
  "/:id",
  requireAuth,
  validate({ params: complaintIdParamSchema }),
  complaintController.remove,
);

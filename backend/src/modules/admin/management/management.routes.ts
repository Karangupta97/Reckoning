/**
 * Admin management router — Part 5 endpoints.
 *
 * Mounted by the app under `/api/admin`. Every route is admin-authenticated and
 * role-guarded so RBAC is enforced at the middleware level, not in controllers.
 *
 * Route groups:
 *   SUPER_ADMIN        → /admins*, /districts
 *   DISTRICT_ADMIN     → /my-district*, /sub-admins/:id/suspend
 *   SUB_DISTRICT_ADMIN → /my-zone*, /tickets/:id*
 */

import { Router } from "express";
import * as ctrl from "./management.controller.js";
import {
  addNoteSchema,
  idParamSchema,
  listAdminsQuerySchema,
  paginationQuerySchema,
  updateTicketStatusSchema,
} from "./management.validation.js";
import { validate } from "../../../middleware/validate.js";
import { requireAdminAuth } from "../../../middleware/requireAdminAuth.js";
import { requireRole } from "../../../middleware/requireRole.js";

/**
 * Express router exposing the admin management endpoints. Mount under
 * `/api/admin`:
 *
 * ```ts
 * app.use("/api/admin", managementRouter);
 * ```
 */
export const managementRouter: Router = Router();

// All management routes require a valid admin session.
managementRouter.use(requireAdminAuth);

// --- SUPER_ADMIN -----------------------------------------------------------

managementRouter.get(
  "/admins",
  requireRole("SUPER_ADMIN"),
  validate({ query: listAdminsQuerySchema }),
  ctrl.listAdmins,
);

managementRouter.get(
  "/admins/:id",
  requireRole("SUPER_ADMIN"),
  validate({ params: idParamSchema }),
  ctrl.getAdmin,
);

managementRouter.patch(
  "/admins/:id/suspend",
  requireRole("SUPER_ADMIN"),
  validate({ params: idParamSchema }),
  ctrl.suspendAdmin,
);

managementRouter.patch(
  "/admins/:id/reactivate",
  requireRole("SUPER_ADMIN"),
  validate({ params: idParamSchema }),
  ctrl.reactivateAdmin,
);

managementRouter.delete(
  "/admins/:id",
  requireRole("SUPER_ADMIN"),
  validate({ params: idParamSchema }),
  ctrl.deleteAdmin,
);

managementRouter.get(
  "/districts",
  requireRole("SUPER_ADMIN"),
  validate({ query: paginationQuerySchema }),
  ctrl.listDistricts,
);

// --- DISTRICT_ADMIN --------------------------------------------------------

managementRouter.get(
  "/my-district",
  requireRole("DISTRICT_ADMIN"),
  ctrl.getMyDistrict,
);

managementRouter.get(
  "/my-district/sub-admins",
  requireRole("DISTRICT_ADMIN"),
  validate({ query: paginationQuerySchema }),
  ctrl.getMySubAdmins,
);

managementRouter.get(
  "/my-district/escalations",
  requireRole("DISTRICT_ADMIN"),
  validate({ query: paginationQuerySchema }),
  ctrl.getMyEscalations,
);

managementRouter.get(
  "/my-district/stats",
  requireRole("DISTRICT_ADMIN"),
  ctrl.getMyDistrictStats,
);

managementRouter.patch(
  "/sub-admins/:id/suspend",
  requireRole("DISTRICT_ADMIN"),
  validate({ params: idParamSchema }),
  ctrl.suspendMySubAdmin,
);

// --- SUB_DISTRICT_ADMIN ----------------------------------------------------

managementRouter.get(
  "/my-zone/complaints",
  requireRole("SUB_DISTRICT_ADMIN"),
  validate({ query: paginationQuerySchema }),
  ctrl.getZoneComplaints,
);

managementRouter.get(
  "/my-zone/tickets",
  requireRole("SUB_DISTRICT_ADMIN"),
  validate({ query: paginationQuerySchema }),
  ctrl.getZoneTickets,
);

managementRouter.get(
  "/my-zone/stats",
  requireRole("SUB_DISTRICT_ADMIN"),
  ctrl.getZoneStats,
);

managementRouter.patch(
  "/tickets/:id/status",
  requireRole("SUB_DISTRICT_ADMIN"),
  validate({ params: idParamSchema, body: updateTicketStatusSchema }),
  ctrl.updateTicketStatus,
);

managementRouter.post(
  "/tickets/:id/notes",
  requireRole("SUB_DISTRICT_ADMIN"),
  validate({ params: idParamSchema, body: addNoteSchema }),
  ctrl.addNote,
);

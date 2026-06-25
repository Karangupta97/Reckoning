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

import { Router, type NextFunction, type Request, type Response } from "express";
import * as ctrl from "./management.controller.js";
import * as subDistrictComplaintsCtrl from "../subDistrict/subDistrictComplaints.controller.js";
import * as subDistrictAiCtrl from "../subDistrict/subDistrictAi.controller.js";
import multer, { MulterError } from "multer";
import { uploadFileToS3 } from "../../upload/upload.service.js";
import { AppError } from "../../../utils/AppError.js";
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

import { enforceSubDistrictScope } from "../../../middleware/enforceSubDistrictScope.js";

// Multer for admin evidence uploads (memory storage, same limits as citizen upload)
const adminUploadMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 5 },
});

function parseAdminMultipart() {
  const handler = adminUploadMulter.array("files", 5);
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, (err: unknown) => {
      if (!err) { next(); return; }
      if (err instanceof MulterError) {
        next(new AppError(
          err.code === "LIMIT_FILE_SIZE" ? "File exceeds the maximum allowed size."
          : `Too many files. Maximum is 5 per request.`,
          400, { code: "UPLOAD_REJECTED" },
        ));
        return;
      }
      next(err);
    });
  };
}

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
  "/my-district/sub-districts",
  requireRole("DISTRICT_ADMIN"),
  ctrl.getMySubDistricts,
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

managementRouter.patch(
  "/sub-admins/:id/reactivate",
  requireRole("DISTRICT_ADMIN"),
  validate({ params: idParamSchema }),
  ctrl.reactivateMySubAdmin,
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

// New: sub-district complaint endpoints (subDistrictId-scoped, not geofence)
managementRouter.use("/subdistrict", enforceSubDistrictScope);

managementRouter.get(
  "/subdistrict/complaints",
  requireRole("SUB_DISTRICT_ADMIN"),
  subDistrictComplaintsCtrl.listComplaints,
);

// AI routes MUST be registered before /:id to prevent Express from matching /:id first
managementRouter.get(
  "/subdistrict/complaints/:id/ai",
  requireRole("SUB_DISTRICT_ADMIN"),
  subDistrictAiCtrl.getAdminComplaintAiResult,
);

managementRouter.get(
  "/subdistrict/complaints/:id/ai/image",
  requireRole("SUB_DISTRICT_ADMIN"),
  subDistrictAiCtrl.proxyAdminComplaintAiImage,
);

managementRouter.get(
  "/subdistrict/complaints/:id",
  requireRole("SUB_DISTRICT_ADMIN"),
  subDistrictComplaintsCtrl.getComplaintDetail,
);

managementRouter.patch(
  "/subdistrict/complaints/:id/status",
  requireRole("SUB_DISTRICT_ADMIN"),
  subDistrictComplaintsCtrl.updateStatus,
);

managementRouter.post(
  "/subdistrict/complaints/:id/evidence",
  requireRole("SUB_DISTRICT_ADMIN"),
  subDistrictComplaintsCtrl.addEvidence,
);

/**
 * `POST /api/admin/upload`
 *
 * Admin-authenticated file upload endpoint. Accepts up to 5 files (field
 * name `files`) plus a required `complaintId` body field. Files are stored in
 * S3 and the MediaUpload rows are created with the complaint's citizen userId
 * (so the FK constraint is satisfied). Returns mediaId + url for each file.
 */
managementRouter.post(
  "/upload",
  parseAdminMultipart(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.admin?.id ?? req.admin?.sub;
      if (!adminId) {
        res.status(401).json({ success: false, error: { code: "NO_TOKEN", message: "Not authenticated." } });
        return;
      }
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      if (files.length === 0) {
        res.status(400).json({ success: false, error: { code: "NO_FILES", message: "No files provided." } });
        return;
      }

      // Look up the complaint's userId from the complaintId in the body
      // so MediaUpload FK is satisfied. Falls back to a bare upload without
      // DB record if complaintId is not provided.
      const { complaintId } = req.body as { complaintId?: string };
      let ownerId: string | null = null;
      if (complaintId) {
        const { prisma } = await import("../../../config/prisma.js");
        const complaint = await prisma.complaint.findUnique({
          where: { id: complaintId },
          select: { userId: true },
        });
        ownerId = complaint?.userId ?? null;
      }

      if (!ownerId) {
        // No valid userId available — upload to S3 only, return the key/url
        // without a MediaUpload DB row. The evidence endpoint will receive
        // these as s3Keys instead of mediaIds.
        res.status(400).json({
          success: false,
          error: {
            code: "COMPLAINT_REQUIRED",
            message: "complaintId is required to upload evidence.",
          },
        });
        return;
      }

      // Use the citizen userId so FK is satisfied
      const media = [];
      for (const file of files) {
        media.push(await uploadFileToS3(file, ownerId));
      }
      res.status(201).json({ success: true, data: { media } });
    } catch (error) {
      next(error);
    }
  },
);

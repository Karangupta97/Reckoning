/**
 * Sub-district complaints controller.
 *
 * Thin HTTP adapters for:
 *   GET  /api/admin/subdistrict/complaints
 *   PATCH /api/admin/subdistrict/complaints/:id/status
 */

import type { NextFunction, Request, Response } from "express";
import type { ComplaintStatus } from "@prisma/client";
import { AppError } from "../../../utils/AppError.js";
import {
  listSubDistrictComplaints,
  updateSubDistrictComplaintStatus,
  getSubDistrictComplaintDetail,
  escalateComplaintToDistrict,
  type SubDistrictComplaintFilters,
} from "./subDistrictComplaints.service.js";
import { sendWebPushToUser } from "../../../services/webpush.service.js";

/** Require a valid admin session or throw 401. */
function getAdmin(req: Request) {
  if (!req.admin) {
    throw new AppError("Unauthorised.", 401, { code: "UNAUTHORIZED" });
  }
  return req.admin;
}

/**
 * `GET /api/admin/subdistrict/complaints`
 *
 * Protected: SUB_DISTRICT_ADMIN only.
 * Scoped to `req.admin.subDistrictId`.
 */
export async function listComplaints(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
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

    const q = req.query as Record<string, string | undefined>;

    const filters: SubDistrictComplaintFilters = {
      status: q.status as ComplaintStatus | undefined,
      sortBy: (q.sortBy === "severity" ? "severity" : "createdAt") as
        | "createdAt"
        | "severity",
      page: q.page ? Number.parseInt(q.page, 10) : 1,
      limit: q.limit ? Number.parseInt(q.limit, 10) : 20,
    };

    const result = await listSubDistrictComplaints(subDistrictId, districtId, filters);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `GET /api/admin/subdistrict/complaints/:id`
 *
 * Protected: SUB_DISTRICT_ADMIN only.
 * Scoped to `subDistrictId` and `districtId`.
 */
export async function getComplaintDetail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
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

    const { id: complaintId } = req.params as { id: string };

    const result = await getSubDistrictComplaintDetail(subDistrictId, districtId, complaintId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === "COMPLAINT_OUT_OF_JURISDICTION") {
        res.status(403).json({
          error: "COMPLAINT_OUT_OF_JURISDICTION",
        });
        return;
      }
      if (error.statusCode === 404) {
        res.status(404).json({
          success: false,
          error: { message: error.message, code: error.code },
        });
        return;
      }
    }
    next(error);
  }
}

/**
 * `PATCH /api/admin/subdistrict/complaints/:id/status`
 *
 * Protected: SUB_DISTRICT_ADMIN or DISTRICT_ADMIN.
 * SUB_DISTRICT_ADMIN: scoped to subDistrictId + districtId.
 * DISTRICT_ADMIN: scoped to districtId only (complaint must belong to their district).
 */
export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = req.user || req.admin;
    const role = user?.role;
    const subDistrictId = user?.subDistrictId;
    const districtId = user?.districtId;
    const adminId: string = user?.id ?? (user as { sub?: string })?.sub ?? "";

    if (!districtId) {
      res.status(403).json({
        error: "INSUFFICIENT_SCOPE",
        message: "Admin profile is missing district assignment",
      });
      return;
    }

    const { id: complaintId } = req.params as { id: string };
    const { status } = req.body as { status: ComplaintStatus };

    if (!status) {
      res.status(400).json({
        success: false,
        error: { message: "status is required.", code: "VALIDATION_ERROR" },
      });
      return;
    }

    let updated;

    if (role === "DISTRICT_ADMIN") {
      // District admin: verify complaint belongs to this district, then update
      const { prisma } = await import("../../../config/prisma.js");
      const existing = await prisma.complaint.findUnique({
        where: { id: complaintId },
        select: { id: true, districtId: true, deletedAt: true },
      });
      if (!existing || existing.deletedAt) {
        res.status(404).json({ success: false, error: { message: "Complaint not found.", code: "NOT_FOUND" } });
        return;
      }
      if (existing.districtId !== districtId) {
        res.status(403).json({ success: false, error: { code: "COMPLAINT_OUT_OF_JURISDICTION", message: "Complaint is out of jurisdiction." } });
        return;
      }
      const isTerminal = status === "RESOLVED" || status === "REJECTED";
      const raw = await prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status,
          ...(isTerminal ? { resolvedAt: new Date(), resolvedByAdmin: adminId } : {}),
        },
        select: { id: true, status: true, description: true, severity: true, latitude: true, longitude: true, createdAt: true, isAnonymous: true, aiResult: true, media: { select: { media: { select: { s3Key: true } } }, take: 5 } },
      });
      // Return a minimal shape consistent with the list response
      res.status(200).json({ success: true, data: { id: raw.id, status: raw.status } });
      return;
    }

    // SUB_DISTRICT_ADMIN path — original scoped check
    if (!subDistrictId) {
      res.status(403).json({
        error: "INSUFFICIENT_SCOPE",
        message: "Admin profile is missing sub-district assignment",
      });
      return;
    }

    updated = await updateSubDistrictComplaintStatus(
      subDistrictId,
      districtId,
      adminId,
      complaintId,
      status,
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === "COMPLAINT_OUT_OF_JURISDICTION") {
        res.status(403).json({ error: "COMPLAINT_OUT_OF_JURISDICTION" });
        return;
      }
      if (error.statusCode === 404) {
        res.status(404).json({ success: false, error: { message: error.message, code: error.code } });
        return;
      }
    }
    next(error);
  }
}

/**
 * `PATCH /api/admin/complaints/:complaintId/escalate`
 * Alias handled via the management router as:
 * `PATCH /api/admin/subdistrict/complaints/:id/escalate`
 *
 * Protected: SUB_DISTRICT_ADMIN or DISTRICT_ADMIN.
 * - SUB_DISTRICT_ADMIN: complaint must belong to their subDistrictId.
 * - DISTRICT_ADMIN:     complaint must belong to their districtId.
 *
 * Sets status to ESCALATED_TO_DISTRICT, stamps escalatedAt / escalatedBy /
 * escalatedToDistrictId, then sends a best-effort web-push to the citizen.
 *
 * @param req Express request with authenticated admin in `req.admin`.
 * @param res Express response.
 * @param next Express next function.
 */
export async function escalateComplaint(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = req.user ?? req.admin;
    const subDistrictId = user?.subDistrictId;
    const districtId = user?.districtId;
    const role = user?.role;

    if (!districtId) {
      res.status(403).json({
        success: false,
        error: { code: "INSUFFICIENT_SCOPE", message: "Admin profile is missing jurisdiction assignment." },
      });
      return;
    }

    // DISTRICT_ADMIN may escalate complaints that are already in their district —
    // they must still own the districtId but don't need a subDistrictId.
    const effectiveSubDistrictId = role === "DISTRICT_ADMIN" ? (subDistrictId ?? "") : subDistrictId;

    if (role !== "DISTRICT_ADMIN" && !effectiveSubDistrictId) {
      res.status(403).json({
        success: false,
        error: { code: "INSUFFICIENT_SCOPE", message: "Admin profile is missing sub-district assignment." },
      });
      return;
    }

    const { id: complaintId } = req.params as { id: string };
    const { reason } = req.body as { reason?: string };

    const adminId: string = user.id ?? (user as { sub?: string }).sub ?? "";

    // For DISTRICT_ADMIN, perform a looser jurisdiction check (districtId only).
    let result;
    if (role === "DISTRICT_ADMIN") {
      const { prisma } = await import("../../../config/prisma.js");
      const { AppError: AE } = await import("../../../utils/AppError.js");
      const existing = await prisma.complaint.findUnique({
        where: { id: complaintId },
        select: { id: true, districtId: true, status: true, deletedAt: true, userId: true, ticketNumber: true, escalationLevel: true, escalatedAt: true, escalatedBy: true, escalatedToDistrictId: true, escalationReason: true },
      });
      if (!existing || existing.deletedAt) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Complaint not found." } });
        return;
      }
      if (existing.districtId !== districtId) {
        res.status(403).json({ success: false, error: { code: "COMPLAINT_OUT_OF_JURISDICTION", message: "Complaint is out of jurisdiction." } });
        return;
      }
      if (existing.status === "ESCALATED_TO_DISTRICT" || existing.status === "RESOLVED" || existing.status === "REJECTED") {
        res.status(400).json({ success: false, error: { code: "INVALID_TRANSITION", message: "Complaint cannot be escalated in its current state." } });
        return;
      }
      const now = new Date();
      const updated = await prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status: "ESCALATED_TO_DISTRICT",
          escalatedAt: now,
          escalatedBy: adminId,
          escalatedToDistrictId: districtId,
          escalationLevel: 1,
          escalationReason: reason ?? "MANUAL_ESCALATION",
        },
        select: { id: true, status: true, escalatedAt: true, escalatedBy: true, escalatedToDistrictId: true, escalationLevel: true, escalationReason: true, ticketNumber: true, userId: true },
      });
      result = { ...updated, userId: updated.userId };
    } else {
      result = await escalateComplaintToDistrict(
        effectiveSubDistrictId!,
        districtId,
        adminId,
        complaintId,
        { reason },
      );
    }

    // Best-effort web-push to the citizen reporting the complaint.
    if (result.userId) {
      sendWebPushToUser(result.userId, {
        title: `Complaint Update — ${result.ticketNumber}`,
        body: `Your complaint #${result.ticketNumber} has been escalated to district authorities for review.`,
        icon: "/android-chrome-192x192.png",
        badge: "/android-chrome-192x192.png",
        tag: `complaint-escalated-${complaintId}`,
        url: "/dashboard/my-reports",
        data: {
          complaintId,
          ticketNumber: result.ticketNumber,
          status: "ESCALATED_TO_DISTRICT",
        },
      }).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.warn("[escalateComplaint] Web Push failed (non-fatal):", err);
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: result.id,
        status: result.status,
        escalatedAt: result.escalatedAt,
        escalatedBy: result.escalatedBy,
        escalatedToDistrictId: result.escalatedToDistrictId,
        escalationLevel: result.escalationLevel,
        escalationReason: result.escalationReason,
        ticketNumber: result.ticketNumber,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === "COMPLAINT_OUT_OF_JURISDICTION") {
        res.status(403).json({ success: false, error: { code: error.code, message: error.message } });
        return;
      }
      res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
      return;
    }
    next(error);
  }
}

/**
 * `POST /api/admin/subdistrict/complaints/:id/evidence`
 *
 * Links pre-uploaded media IDs to a complaint as officer evidence.
 * mediaIds must belong to the admin's session (validated by the service).
 */
export async function addEvidence(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
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

    const { id: complaintId } = req.params as { id: string };
    const { mediaIds } = req.body as { mediaIds: string[] };

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      res.status(400).json({
        success: false,
        error: { message: "mediaIds array is required.", code: "VALIDATION_ERROR" },
      });
      return;
    }

    const { addEvidenceToComplaint } = await import("./subDistrictComplaints.service.js");
    const updated = await addEvidenceToComplaint(
      subDistrictId,
      districtId,
      complaintId,
      mediaIds,
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: { message: error.message, code: error.code },
      });
      return;
    }
    next(error);
  }
}

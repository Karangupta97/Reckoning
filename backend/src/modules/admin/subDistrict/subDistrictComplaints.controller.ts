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
  type SubDistrictComplaintFilters,
} from "./subDistrictComplaints.service.js";

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
    const admin = getAdmin(req);
    console.log("Decoded admin token payload in subDistrictComplaints.controller:", admin);
    const q = req.query as Record<string, string | undefined>;

    const filters: SubDistrictComplaintFilters = {
      status: q.status as ComplaintStatus | undefined,
      sortBy: (q.sortBy === "severity" ? "severity" : "createdAt") as
        | "createdAt"
        | "severity",
      page: q.page ? Number.parseInt(q.page, 10) : 1,
      limit: q.limit ? Number.parseInt(q.limit, 10) : 20,
    };

    const result = await listSubDistrictComplaints(admin.subDistrictId, filters);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `PATCH /api/admin/subdistrict/complaints/:id/status`
 *
 * Protected: SUB_DISTRICT_ADMIN only.
 * Accepts `{ status: ComplaintStatus }` body.
 */
export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = getAdmin(req);
    const { id: complaintId } = req.params as { id: string };
    const { status } = req.body as { status: ComplaintStatus };

    if (!status) {
      res.status(400).json({
        success: false,
        error: { message: "status is required.", code: "VALIDATION_ERROR" },
      });
      return;
    }

    const updated = await updateSubDistrictComplaintStatus(
      admin.subDistrictId,
      admin.id,
      complaintId,
      status,
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

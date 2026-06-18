/**
 * Complaint controllers — thin HTTP adapters.
 *
 * Each handler reads already-validated request data, derives the requester (if
 * any) from `req.user`, delegates to the service, and shapes the standard
 * `{ success, data }` envelope. No business logic lives here.
 */

import type { NextFunction, Request, Response } from "express";
import * as complaintService from "./complaint.service.js";
import { AppError } from "../../utils/AppError.js";
import type {
  CreateComplaintBody,
  ListComplaintsQueryBody,
  ListMyComplaintsQueryBody,
  UpdateComplaintBody,
} from "./complaint.validation.js";
import type { CreateComplaintInput, ListComplaintsQuery, ListMyComplaintsQuery, Requester } from "./complaint.types.js";

/**
 * Build a {@link Requester} from `req.user`, or `undefined` when anonymous.
 *
 * @param req Express request.
 * @returns The caller identity for authorization, if authenticated.
 */
function requesterOf(req: Request): Requester | undefined {
  return req.user ? { id: req.user.id, role: req.user.role } : undefined;
}

/**
 * `POST /api/complaints` — submit a new complaint (auth required).
 *
 * @returns 201 with `{ success: true, data: CreateComplaintResult }`.
 */
export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("No token provided", 401, { code: "NO_TOKEN" });
    }
    const body = req.body as CreateComplaintBody;
    const result = await complaintService.createComplaint(
      req.user.id,
      body as CreateComplaintInput,
      req.ip,
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `GET /api/complaints` — public, filtered, paginated list.
 *
 * @returns 200 with `{ success: true, data: ComplaintListResult }`.
 */
export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as ListComplaintsQueryBody;
    const result = await complaintService.listComplaints(query as ListComplaintsQuery);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `GET /api/complaints/my` — authenticated user's own complaints (paginated).
 *
 * @returns 200 with `{ success: true, data: ComplaintListResult }`.
 */
export async function listMy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("No token provided", 401, { code: "NO_TOKEN" });
    }
    const query = req.query as unknown as ListMyComplaintsQueryBody;
    const result = await complaintService.listMyComplaints(
      req.user.id,
      query as ListMyComplaintsQuery,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `GET /api/complaints/my/stats` — authenticated user's aggregate stats.
 *
 * @returns 200 with `{ success: true, data: MyComplaintsStatsResult }`.
 */
export async function myStats(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("No token provided", 401, { code: "NO_TOKEN" });
    }
    const result = await complaintService.getMyStats(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `GET /api/complaints/:id` — public single complaint (owner gets more).
 *
 * @returns 200 with `{ success: true, data: ComplaintDetail }`.
 */
export async function getById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const result = await complaintService.getComplaintById(id, requesterOf(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `PATCH /api/complaints/:id` — update own complaint (owner or ADMIN).
 *
 * @returns 200 with `{ success: true, data: ComplaintDetail }`.
 */
export async function update(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("No token provided", 401, { code: "NO_TOKEN" });
    }
    const id = req.params.id as string;
    const body = req.body as UpdateComplaintBody;
    const result = await complaintService.updateComplaint(
      id,
      { id: req.user.id, role: req.user.role },
      body,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `DELETE /api/complaints/:id` — soft delete (owner or ADMIN).
 *
 * @returns 200 with `{ success: true, data: { message } }`.
 */
export async function remove(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("No token provided", 401, { code: "NO_TOKEN" });
    }
    const id = req.params.id as string;
    const result = await complaintService.deleteComplaint(id, {
      id: req.user.id,
      role: req.user.role,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

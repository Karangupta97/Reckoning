/**
 * Admin management controllers — thin HTTP adapters.
 *
 * Read already-validated request data, derive the acting admin from
 * `req.admin`, delegate to the management service, and shape the standard
 * `{ success, data }` envelope. No business logic here.
 */

import type { NextFunction, Request, Response } from "express";
import * as managementService from "./management.service.js";
import { AppError } from "../../../utils/AppError.js";
import type {
  AddNoteBody,
  ListAdminsQuery,
  PaginationQuery,
  UpdateTicketStatusBody,
} from "./management.validation.js";

/**
 * Assert the request carries an authenticated admin, returning it.
 *
 * @param req Express request.
 * @returns The authenticated admin principal.
 * @throws {AppError} 401 when `req.admin` is absent.
 */
function requireAdmin(req: Request): NonNullable<Request["admin"]> {
  if (!req.admin) {
    throw new AppError("No token", 401, { code: "NO_TOKEN" });
  }
  return req.admin;
}

// --- SUPER_ADMIN -----------------------------------------------------------

/** `GET /api/admin/admins` — list all admins (paginated). */
export async function listAdmins(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    requireAdmin(req);
    const q = req.query as unknown as ListAdminsQuery;
    const result = await managementService.listAdmins({
      page: q.page,
      limit: q.limit,
      ...(q.role ? { role: q.role } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.search ? { search: q.search } : {}),
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/** `GET /api/admin/admins/:id` — single admin detail. */
export async function getAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    requireAdmin(req);
    const result = await managementService.getAdminById(req.params.id as string);
    res.status(200).json({ success: true, data: { admin: result } });
  } catch (error) {
    next(error);
  }
}

/** `PATCH /api/admin/admins/:id/suspend` — suspend any admin. */
export async function suspendAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const result = await managementService.suspendAdmin(
      admin.id,
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: { admin: result } });
  } catch (error) {
    next(error);
  }
}

/** `PATCH /api/admin/admins/:id/reactivate` — reactivate a suspended admin. */
export async function reactivateAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const result = await managementService.reactivateAdmin(
      admin.id,
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: { admin: result } });
  } catch (error) {
    next(error);
  }
}

/** `DELETE /api/admin/admins/:id` — soft delete (DEACTIVATED). */
export async function deleteAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const result = await managementService.deleteAdmin(
      admin.id,
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/** `GET /api/admin/districts` — list all districts + stats. */
export async function listDistricts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    requireAdmin(req);
    const q = req.query as unknown as PaginationQuery;
    const result = await managementService.listDistricts(q.page, q.limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// --- DISTRICT_ADMIN --------------------------------------------------------

/** `GET /api/admin/my-district` — own district info + geofence. */
export async function getMyDistrict(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const result = await managementService.getMyDistrict(admin.districtId ?? null);
    res.status(200).json({ success: true, data: { district: result } });
  } catch (error) {
    next(error);
  }
}

/** `GET /api/admin/my-district/sub-admins` — list own sub-district admins. */
export async function getMySubAdmins(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const q = req.query as unknown as PaginationQuery;
    const result = await managementService.getMySubAdmins(
      admin.districtId ?? null,
      q.page,
      q.limit,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/** `PATCH /api/admin/sub-admins/:id/suspend` — suspend their sub-district admin. */
export async function suspendMySubAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const result = await managementService.suspendMySubAdmin(
      admin.districtId ?? null,
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: { admin: result } });
  } catch (error) {
    next(error);
  }
}

/** `PATCH /api/admin/sub-admins/:id/reactivate` — reactivate their sub-district admin. */
export async function reactivateMySubAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const result = await managementService.reactivateMySubAdmin(
      admin.districtId ?? null,
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: { admin: result } });
  } catch (error) {
    next(error);
  }
}


/** `GET /api/admin/my-district/sub-districts` — list sub-districts with boundaries. */
export async function getMySubDistricts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const result = await managementService.getMySubDistricts(admin.districtId ?? null);
    res.status(200).json({ success: true, data: { subDistricts: result } });
  } catch (error) {
    next(error);
  }
}

/** `GET /api/admin/my-district/escalations` — ONLY escalated complaints. */
export async function getMyEscalations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const q = req.query as unknown as PaginationQuery;
    const result = await managementService.getDistrictEscalations(
      admin.districtId ?? null,
      q.page,
      q.limit,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/** `GET /api/admin/my-district/stats` — resolution rates, SLA stats. */
export async function getMyDistrictStats(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const result = await managementService.getDistrictStats(admin.districtId ?? null);
    res.status(200).json({ success: true, data: { stats: result } });
  } catch (error) {
    next(error);
  }
}

// --- SUB_DISTRICT_ADMIN ----------------------------------------------------

/** `GET /api/admin/my-zone/complaints` — complaints in their geofence. */
export async function getZoneComplaints(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const q = req.query as unknown as PaginationQuery;
    const result = await managementService.getZoneComplaints(
      admin.subDistrictId ?? null,
      q.page,
      q.limit,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/** `GET /api/admin/my-zone/tickets` — their open tickets. */
export async function getZoneTickets(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const q = req.query as unknown as PaginationQuery;
    const result = await managementService.getZoneTickets(
      admin.subDistrictId ?? null,
      q.page,
      q.limit,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/** `GET /api/admin/my-zone/stats` — their personal stats. */
export async function getZoneStats(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const result = await managementService.getZoneStats(admin.subDistrictId ?? null);
    res.status(200).json({ success: true, data: { stats: result } });
  } catch (error) {
    next(error);
  }
}

/** `PATCH /api/admin/tickets/:id/status` — update ticket status. */
export async function updateTicketStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const body = req.body as UpdateTicketStatusBody;
    const result = await managementService.updateTicketStatus(
      admin.subDistrictId ?? null,
      admin.id,
      req.params.id as string,
      { status: body.status, ...(body.note !== undefined ? { note: body.note } : {}) },
    );
    res.status(200).json({ success: true, data: { complaint: result } });
  } catch (error) {
    next(error);
  }
}

/** `POST /api/admin/tickets/:id/notes` — add a resolution note. */
export async function addNote(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = requireAdmin(req);
    const body = req.body as AddNoteBody;
    const result = await managementService.addResolutionNote(
      admin.subDistrictId ?? null,
      admin.id,
      req.params.id as string,
      { note: body.note, ...(body.status ? { status: body.status } : {}) },
    );
    res.status(201).json({ success: true, data: { complaint: result } });
  } catch (error) {
    next(error);
  }
}

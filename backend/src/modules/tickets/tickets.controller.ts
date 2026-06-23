/**
 * Tickets controller — thin HTTP adapters.
 *
 * Reads validated request data, delegates to the tickets service, and shapes
 * the standard `{ success, data }` envelope. No business logic here.
 */

import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import * as ticketsService from "./tickets.service.js";
import type {
  CreateTicketNoteInput,
  ListTicketsQuery,
  SuperAdminListTicketsQuery,
  UpdateTicketStatusInput,
} from "./tickets.types.js";

/**
 * `GET /api/tickets` — list tickets assigned to the authenticated sub-district admin.
 */
export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError("No token", 401, { code: "NO_TOKEN" });
    }
    const query = req.query as unknown as ListTicketsQuery;
    const result = await ticketsService.listTickets(req.admin.id, query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `GET /api/tickets/:id` — full ticket detail.
 */
export async function getById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError("No token", 401, { code: "NO_TOKEN" });
    }
    const id = req.params.id as string;
    const result = await ticketsService.getTicketById(
      id,
      req.admin.id,
      req.admin.role,
      req.admin.subDistrictId ?? null,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `PATCH /api/tickets/:id/status` — update ticket status.
 */
export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError("No token", 401, { code: "NO_TOKEN" });
    }
    const id = req.params.id as string;
    const input = req.body as UpdateTicketStatusInput;
    const result = await ticketsService.updateTicketStatus(id, req.admin.id, input);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `POST /api/tickets/:id/notes` — add a note to a ticket.
 */
export async function addNote(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError("No token", 401, { code: "NO_TOKEN" });
    }
    const id = req.params.id as string;
    const input = req.body as CreateTicketNoteInput;
    const result = await ticketsService.createTicketNote(
      id,
      req.admin.id,
      req.admin.role,
      req.admin.districtId ?? null,
      input,
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `GET /api/complaints/:id/ticket` — citizen-facing ticket view.
 */
export async function getComplaintTicket(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("No token provided", 401, { code: "NO_TOKEN" });
    }
    const id = req.params.id as string;
    const result = await ticketsService.getComplaintTicket(id, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * `GET /api/admin/tickets` — Super Admin platform-wide ticket list.
 */
export async function listAll(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.admin) {
      throw new AppError("No token", 401, { code: "NO_TOKEN" });
    }
    const query = req.query as unknown as SuperAdminListTicketsQuery;
    const result = await ticketsService.listAllTickets(query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

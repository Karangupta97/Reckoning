/**
 * Tickets router.
 *
 * Endpoints:
 *   GET    /api/tickets             → list assigned tickets (SUB_DISTRICT_ADMIN)
 *   GET    /api/tickets/:id         → ticket detail (SUB_DISTRICT_ADMIN, DISTRICT_ADMIN, SUPER_ADMIN)
 *   PATCH  /api/tickets/:id/status  → update status (SUB_DISTRICT_ADMIN)
 *   POST   /api/tickets/:id/notes   → add note (SUB_DISTRICT_ADMIN, DISTRICT_ADMIN)
 *
 * Citizen endpoint (mounted separately):
 *   GET    /api/complaints/:id/ticket → citizen ticket view (requireAuth)
 *
 * Super Admin endpoint (mounted under /api/admin):
 *   GET    /api/admin/tickets         → all tickets platform-wide (SUPER_ADMIN)
 */

import { Router } from "express";
import * as ticketsController from "./tickets.controller.js";
import {
  listTicketsQuerySchema,
  superAdminListTicketsQuerySchema,
  ticketIdParamSchema,
  complaintIdParamSchema,
  updateTicketStatusSchema,
  createTicketNoteSchema,
} from "./tickets.validation.js";
import { validate } from "../../middleware/validate.js";
import { requireAdminAuth } from "../../middleware/requireAdminAuth.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireRole.js";

/**
 * Sub-District Admin ticket router. Mount under `/api/tickets`.
 */
export const ticketRouter: Router = Router();

ticketRouter.get(
  "/",
  requireAdminAuth,
  requireRole("SUB_DISTRICT_ADMIN"),
  validate({ query: listTicketsQuerySchema }),
  ticketsController.list,
);

ticketRouter.get(
  "/:id",
  requireAdminAuth,
  requireRole("SUB_DISTRICT_ADMIN", "DISTRICT_ADMIN", "SUPER_ADMIN"),
  validate({ params: ticketIdParamSchema }),
  ticketsController.getById,
);

ticketRouter.patch(
  "/:id/status",
  requireAdminAuth,
  requireRole("SUB_DISTRICT_ADMIN"),
  validate({ params: ticketIdParamSchema, body: updateTicketStatusSchema }),
  ticketsController.updateStatus,
);

ticketRouter.post(
  "/:id/notes",
  requireAdminAuth,
  requireRole("SUB_DISTRICT_ADMIN", "DISTRICT_ADMIN"),
  validate({ params: ticketIdParamSchema, body: createTicketNoteSchema }),
  ticketsController.addNote,
);

/**
 * Citizen ticket router (single endpoint). Mount under `/api/complaints`.
 */
export const citizenTicketRouter: Router = Router();

citizenTicketRouter.get(
  "/:id/ticket",
  requireAuth,
  validate({ params: complaintIdParamSchema }),
  ticketsController.getComplaintTicket,
);

/**
 * Super Admin ticket router. Mount under `/api/admin/tickets`.
 */
export const superAdminTicketRouter: Router = Router();

superAdminTicketRouter.get(
  "/",
  requireAdminAuth,
  requireRole("SUPER_ADMIN"),
  validate({ query: superAdminListTicketsQuerySchema }),
  ticketsController.listAll,
);

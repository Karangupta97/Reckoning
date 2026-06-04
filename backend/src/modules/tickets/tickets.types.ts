/**
 * TypeScript contracts for the tickets module.
 *
 * Framework-free request/response shapes reused across the ticket routes,
 * controller, and service layers.
 */

import type { SeverityLevel, TicketStatus } from "@prisma/client";

/** Pagination metadata returned in list responses. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Stats summary returned alongside ticket lists. */
export interface TicketStats {
  open: number;
  inProgress: number;
  resolved: number;
  critical: number;
}

/** Complaint projection embedded in ticket list items. */
export interface TicketComplaintSummary {
  complaintNumber: string;
  category: string;
  address: string | null;
  thumbnailUrl: string | null;
}

/** A single ticket list item (Sub-District Admin). */
export interface TicketListItem {
  ticketId: string;
  ticketNumber: string;
  status: TicketStatus;
  priority: SeverityLevel;
  daysRemaining: number;
  slaDeadline: Date;
  complaint: TicketComplaintSummary;
}

/** Full result shape for GET /api/tickets. */
export interface TicketListResult {
  tickets: TicketListItem[];
  pagination: PaginationMeta;
  stats: TicketStats;
}

/** Query params for the ticket list endpoint. */
export interface ListTicketsQuery {
  status?: TicketStatus;
  priority?: SeverityLevel;
  page: number;
  limit: number;
}

/** Full ticket detail (GET /api/tickets/:id). */
export interface TicketDetail {
  ticketId: string;
  ticketNumber: string;
  status: TicketStatus;
  priority: SeverityLevel;
  daysRemaining: number;
  slaDeadline: Date;
  escalationLevel: number;
  escalatedAt: Date | null;
  resolvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  assignedAdminId: string | null;
  subDistrictId: string | null;
  districtId: string | null;
  complaint: {
    id: string;
    ticketNumber: string;
    category: string;
    description: string | null;
    severity: SeverityLevel;
    address: string | null;
    roadName: string | null;
    landmark: string | null;
    latitude: number;
    longitude: number;
    submittedBy: string;
    media: Array<{ url: string; mimeType: string; isPrimary: boolean }>;
    createdAt: Date;
  };
  notes: Array<{
    id: string;
    authorId: string;
    content: string;
    createdAt: Date;
  }>;
  statusHistory: Array<{
    id: string;
    status: TicketStatus;
    changedById: string;
    note: string | null;
    changedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/** Input for PATCH /api/tickets/:id/status. */
export interface UpdateTicketStatusInput {
  status: TicketStatus;
  note?: string;
}

/** Result of a status update. */
export interface UpdateTicketStatusResult {
  ticketId: string;
  ticketNumber: string;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  updatedAt: Date;
}

/** Input for POST /api/tickets/:id/notes. */
export interface CreateTicketNoteInput {
  content: string;
}

/** Citizen-facing ticket view (GET /api/complaints/:id/ticket). */
export interface CitizenTicketView {
  ticketNumber: string;
  status: TicketStatus;
  assignedTo: string;
  slaDeadline: Date;
  daysRemaining: number;
  estimatedResolutionDate: Date;
  statusHistory: Array<{
    status: TicketStatus;
    changedAt: Date;
    note: string | null;
  }>;
  lastUpdatedAt: Date;
}

/** Super Admin ticket list query params. */
export interface SuperAdminListTicketsQuery {
  status?: TicketStatus;
  priority?: SeverityLevel;
  subDistrictId?: string;
  districtId?: string;
  page: number;
  limit: number;
}

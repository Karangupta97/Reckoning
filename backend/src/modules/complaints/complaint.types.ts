/**
 * Shared TypeScript contracts for the complaints module.
 *
 * Framework-free request/response shapes reused by the service, controller,
 * and (potentially) a typed API client. Enum types are sourced from the
 * generated Prisma client so they always match the database.
 */

import type {
  ComplaintStatus,
  Country,
  IssueCategory,
  SeverityLevel,
} from "@prisma/client";

/** Public label used wherever an anonymous reporter would otherwise appear. */
export const ANONYMOUS_LABEL = "Anonymous Citizen" as const;

/** AI hints optionally supplied by an on-device model. */
export interface AiHints {
  aiCategory?: IssueCategory;
  aiConfidence?: number;
  aiRawResult?: Record<string, unknown>;
  /** S3 key of the annotated result image (from POST /api/ai/detect). */
  aiAnnotatedImageKey?: string;
}

/** Validated payload accepted by `createComplaint`. */
export interface CreateComplaintInput extends AiHints {
  category: IssueCategory;
  latitude: number;
  longitude: number;
  mediaIds: string[];
  description?: string;
  suggestedFix?: string;
  roadName?: string;
  roadNumber?: string;
  landmark?: string;
  direction?: string;
  isAnonymous?: boolean;
}

/** A media asset as exposed on a complaint response. */
export interface ComplaintMediaView {
  id?: string;
  url: string;
  mimeType: string;
  isPrimary: boolean;
  order?: number;
}

/** Authority summary safe for public exposure (no contact details). */
export interface AssignedAuthorityView {
  id: string;
  name: string;
  type: string;
  country: Country;
}

/** Location block on a complaint response. */
export interface LocationView {
  latitude: number;
  longitude: number;
  address: string | null;
  roadName?: string | null;
  roadNumber?: string | null;
  landmark?: string | null;
  direction?: string | null;
  /** Distance from the query point in metres (only on nearby searches). */
  distance?: number;
}

/** Response returned by `POST /api/complaints`. */
export interface CreateComplaintResult {
  id: string;
  ticketNumber: string;
  category: IssueCategory;
  severity: SeverityLevel;
  status: ComplaintStatus;
  location: { latitude: number; longitude: number; address: string | null };
  isAnonymous: boolean;
  media: ComplaintMediaView[];
  submittedBy: string;
  createdAt: Date;
  /** Present when a similar recent report by the same user was detected. */
  duplicateWarning?: DuplicateWarning;
}

/** Soft duplicate-detection signal (never blocks submission). */
export interface DuplicateWarning {
  isDuplicate: true;
  existingTicket: string;
}

/** One row in the public complaint list. */
export interface ComplaintListItem {
  id: string;
  ticketNumber: string;
  category: IssueCategory;
  severity: SeverityLevel;
  status: ComplaintStatus;
  description: string | null;
  location: LocationView;
  country: Country;
  submittedBy: string;
  primaryMedia: { url: string; mimeType: string } | null;
  upvotes: number;
  viewCount: number;
  assignedAuthority: { name: string; type: string } | null;
  createdAt: Date;
  updatedAt: Date;
  media?: ComplaintMediaView[];
  aiDetected?: boolean;
  aiCategory?: IssueCategory | null;
  aiConfidence?: number | null;
  aiAnnotatedImage?: string | null;
}

/** Pagination envelope shared by list responses. */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Response returned by `GET /api/complaints`. */
export interface ComplaintListResult {
  complaints: ComplaintListItem[];
  pagination: PaginationMeta;
}

/** A timeline entry (status-change history — populated by the workflow layer). */
export interface TimelineEntry {
  status: ComplaintStatus;
  changedAt: Date;
  note: string | null;
}

/** Full single-complaint detail returned by `GET /api/complaints/:id`. */
export interface ComplaintDetail {
  id: string;
  ticketNumber: string;
  category: IssueCategory;
  severity: SeverityLevel;
  status: ComplaintStatus;
  description: string | null;
  suggestedFix: string | null;
  location: LocationView;
  country: Country;
  submittedBy: string;
  /** Only present when the owner is requesting their own complaint. */
  isAnonymous?: boolean;
  media: ComplaintMediaView[];
  aiDetected: boolean;
  aiCategory: IssueCategory | null;
  aiConfidence: number | null;
  /** Presigned S3 URL for the AI-annotated result image (1h expiry). */
  aiAnnotatedImage: string | null;
  upvotes: number;
  viewCount: number;
  assignedAuthority: AssignedAuthorityView | null;
  timeline: TimelineEntry[];
  createdAt: Date;
  updatedAt: Date;
}

/** Validated filters accepted by `listComplaints`. */
export interface ListComplaintsQuery {
  page: number;
  limit: number;
  category?: IssueCategory;
  status?: ComplaintStatus;
  severity?: SeverityLevel;
  country?: Country;
  lat?: number;
  lng?: number;
  radius: number;
  sortBy: "createdAt" | "severity" | "upvotes";
  sortOrder: "asc" | "desc";
  startDate?: string;
  endDate?: string;
}

/** Validated payload accepted by `updateComplaint`. */
export interface UpdateComplaintInput {
  description?: string;
  suggestedFix?: string;
  roadName?: string;
  roadNumber?: string;
  landmark?: string;
  direction?: string;
  isAnonymous?: boolean;
}

/** Validated query for `GET /api/complaints/my` (citizen's own complaints). */
export interface ListMyComplaintsQuery {
  page: number;
  limit: number;
  status?: ComplaintStatus;
  sort: "createdAt" | "severity" | "status";
  sortOrder: "asc" | "desc";
  search?: string;
}

/** A hazard-category count for the stats breakdown. */
export interface HazardBreakdownItem {
  category: IssueCategory;
  count: number;
}

/** A recent activity event for the stats response. */
export interface RecentActivityEvent {
  text: string;
  type: "resolved" | "assigned" | "rejected" | "verified" | "response";
  createdAt: Date;
}

/** Response returned by `GET /api/complaints/my/stats`. */
export interface MyComplaintsStatsResult {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  hazardBreakdown: HazardBreakdownItem[];
  resolutionRate: number;
  recentActivity: RecentActivityEvent[];
}

/** Identity of the caller for authorization decisions in the service. */
export interface Requester {
  id: string;
  role: "CITIZEN" | "AUTHORITY" | "ADMIN";
}

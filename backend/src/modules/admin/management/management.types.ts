/**
 * Shared TypeScript contracts for the admin management sub-module.
 *
 * Re-exports the admin profile shape and defines the pagination envelope used
 * by every list response in this sub-module.
 */

export type { AdminProfile } from "../admin.types.js";

/** Pagination envelope shared by all admin list responses. */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

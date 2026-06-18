/**
 * Shared TypeScript contracts for the admin module.
 *
 * Framework-free request/response shapes reused across the admin auth,
 * district, sub-district, and management sub-modules. Enum types are sourced
 * from the generated Prisma client so they always match the database.
 */

import type { AdminRole, AdminStatus, Country } from "@prisma/client";

/** A GeoJSON Polygon (RFC 7946) — the only geometry accepted for geofences. */
export interface GeoJsonPolygon {
  type: "Polygon";
  /**
   * Linear rings: the first is the outer boundary, any others are holes. Each
   * ring is an array of `[longitude, latitude]` positions and must be closed
   * (first === last) with at least 4 positions.
   */
  coordinates: number[][][];
}

/** Request metadata extracted from the HTTP layer (not from the body). */
export interface RequestContext {
  /** Client IP address, if resolvable. */
  ipAddress?: string;
  /** Raw `User-Agent` header, if present. */
  userAgent?: string;
}

/** Public-safe admin projection embedded in auth responses. */
export interface AdminProfile {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  designation: string | null;
  department: string | null;
  phone: string | null;
  districtId: string | null;
  districtName: string | null;
  subDistrictId: string | null;
  subDistrictName: string | null;
  country: Country | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

/** Successful admin login / activation token bundle plus profile. */
export interface AdminAuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  admin: AdminProfile;
}

/** Admin token rotation result (no profile). */
export interface AdminRefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** Response returned by both invite endpoints. */
export interface InviteResult {
  message: string;
  adminId: string;
  /** Present for district invites; the sub-district id for sub-district invites. */
  districtId?: string;
  subDistrictId?: string;
  inviteExpiresAt: string;
}

/** Identity of the inviting/acting admin passed into services. */
export interface ActingAdmin {
  id: string;
  role: AdminRole;
  districtId: string | null;
  subDistrictId: string | null;
  country: Country | null;
}

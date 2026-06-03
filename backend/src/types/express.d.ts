/**
 * Express type augmentation.
 *
 * Adds a strongly-typed `req.user` populated by the {@link requireAuth}
 * middleware after a valid access token is verified. Keeping this in a
 * dedicated ambient declaration means every route handler gets the type for
 * free without importing anything.
 */

import type { UserRole, UserCountry } from "../utils/jwt.js";
import type { AdminRole, AdminCountry } from "../utils/adminJwt.js";

/** Authenticated principal attached to the request by `requireAuth`. */
export interface AuthenticatedUser {
  /** User id (from the JWT `sub` claim). */
  id: string;
  /** User email. */
  email: string;
  /** User role. */
  role: UserRole;
  /** User country, when present on the token. */
  country?: UserCountry;
}

/** Authenticated admin principal attached by `requireAdminAuth`. */
export interface AuthenticatedAdmin {
  /** Admin id (from the JWT `sub` claim). */
  id: string;
  /** Admin email. */
  email: string;
  /** Admin role (drives RBAC). */
  role: AdminRole;
  /** Jurisdiction district id, null for SUPER_ADMIN. */
  districtId: string | null;
  /** Jurisdiction sub-district id, null for SUPER_ADMIN/DISTRICT_ADMIN. */
  subDistrictId: string | null;
  /** Jurisdiction country, null for SUPER_ADMIN. */
  country: AdminCountry | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Present only on routes guarded by `requireAuth`. */
      user?: AuthenticatedUser;
      /** Present only on routes guarded by `requireAdminAuth`. */
      admin?: AuthenticatedAdmin;
    }
  }
}

export {};

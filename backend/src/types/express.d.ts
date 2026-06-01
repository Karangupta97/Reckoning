/**
 * Express type augmentation.
 *
 * Adds a strongly-typed `req.user` populated by the {@link requireAuth}
 * middleware after a valid access token is verified. Keeping this in a
 * dedicated ambient declaration means every route handler gets the type for
 * free without importing anything.
 */

import type { UserRole, UserCountry } from "../utils/jwt.js";

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

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Present only on routes guarded by `requireAuth`. */
      user?: AuthenticatedUser;
    }
  }
}

export {};

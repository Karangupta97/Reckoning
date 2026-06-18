/**
 * Single source of truth for the mock-fallback gate.
 *
 * Both conditions must be true for mock data to activate:
 *   1. NEXT_PUBLIC_ENABLE_MOCK=true in the environment
 *   2. The current user's email is in DEV_TEAM_EMAILS
 *
 * Normal users always hit the live API — this path is never reached for them.
 */

import { isDevUser } from "./devTeam";

const MOCK_ENV_FLAG =
  process.env.NEXT_PUBLIC_ENABLE_MOCK === "true";

/**
 * Returns true only when both the env flag is set AND the email is a dev team
 * member. Passing no email (unauthenticated state) always returns false.
 */
export function shouldUseMock(email?: string): boolean {
  if (!MOCK_ENV_FLAG) return false;
  if (!email) return false;
  return isDevUser(email);
}

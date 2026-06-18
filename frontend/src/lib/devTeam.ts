/**
 * Team members who are allowed to see mock fallback data during development.
 * All checks happen locally — nothing is sent to any server.
 */

export const DEV_TEAM_EMAILS: readonly string[] = [
  "karan@reckoning.dev",
  "dev1@reckoning.dev",
  "dev2@reckoning.dev",
  "dev3@reckoning.dev",
  "karantempmail.1@gmail.com",
  "karangupta3319@gmail.com"
] as const;

/**
 * Returns true if the given email belongs to the dev team.
 * Comparison is case-insensitive.
 */
export function isDevUser(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return DEV_TEAM_EMAILS.some((e) => e.toLowerCase() === normalized);
}

/**
 * Generic async wrapper that provides seamless mock fallback for dev team members.
 *
 * Merge strategy: { ...mockFn(), ...realResponse }
 *   — real API fields always win; mock fills any missing fields.
 *
 * For normal users: live API is called directly, errors propagate normally.
 * For dev team:     live API is tried first; on success the response is hydrated
 *                   with any fields the mock provides that the API doesn't yet
 *                   return; on failure mock data is returned and a warning logged.
 */

import { shouldUseMock } from "../useMock";

/**
 * Wraps an API call with optional mock fallback.
 *
 * @param apiFn   - Async function that calls the live API and returns T
 * @param mockFn  - Synchronous function that returns a full mock T
 * @param email   - The current user's email (used to check dev-team membership)
 */
export async function withMockFallback<T>(
  apiFn: () => Promise<T>,
  mockFn: () => T,
  email?: string,
): Promise<T> {
  if (!shouldUseMock(email)) {
    // Normal path — live API only, errors propagate to the caller.
    return apiFn();
  }

  // Dev-team path — try live, hydrate with mock, fall back on failure.
  try {
    const realResponse = await apiFn();

    // Merge: mock provides the baseline, real API fields overwrite.
    // This fills any fields the API doesn't return yet (partial hydration).
    if (realResponse !== null && typeof realResponse === "object" && !Array.isArray(realResponse)) {
      const merged = {
        ...(mockFn() as Record<string, unknown>),
        ...(realResponse as Record<string, unknown>),
      };
      return merged as T;
    }

    // For arrays and primitives, real data wins outright when it exists.
    return realResponse;
  } catch (err) {
    console.warn(
      "[withMockFallback] Live API failed — serving mock data. Error:",
      err,
    );
    return mockFn();
  }
}

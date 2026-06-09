/**
 * Mock complaints / my-reports data.
 * Typed with the exact same interfaces as the live API — zero drift risk.
 */

import type { MyReport, UserStats } from "@/components/my-reports/types";
import { MOCK_MY_REPORTS, MOCK_STATS } from "@/components/my-reports/mockData";

export { MOCK_MY_REPORTS as mockComplaints, MOCK_STATS as mockUserStats };

/** Used as the `mockFn` argument to withMockFallback. */
export function getMockComplaints(): MyReport[] {
  return MOCK_MY_REPORTS;
}

export function getMockUserStats(): UserStats {
  return MOCK_STATS;
}

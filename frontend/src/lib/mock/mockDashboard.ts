/**
 * Mock dashboard summary data.
 * Typed with shared interfaces — mirrors the shape the live API will return.
 */

import type { DashboardSummary } from "@/types/api";

export const mockDashboardSummary: DashboardSummary = {
  totalReports: 12,
  openReports: 5,
  resolvedReports: 6,
  criticalReports: 3,
  resolutionRate: 50,
  rankPercentile: 5,
  rankArea: "Andheri West",
  streakDays: 7,
  impactScore: 2840,
  weeklyActivity: [
    { day: "Mon", reports: 2, resolved: 1 },
    { day: "Tue", reports: 1, resolved: 0 },
    { day: "Wed", reports: 3, resolved: 2 },
    { day: "Thu", reports: 0, resolved: 1 },
    { day: "Fri", reports: 2, resolved: 1 },
    { day: "Sat", reports: 1, resolved: 0 },
    { day: "Sun", reports: 0, resolved: 0 },
  ],
};

export function getMockDashboardSummary(): DashboardSummary {
  return mockDashboardSummary;
}

/**
 * Mock admin / authority data.
 * Typed with shared interfaces — mirrors the shape the live API will return.
 */

import type { AdminOverview } from "@/types/api";

export const mockAdminOverview: AdminOverview = {
  totalComplaints: 1284,
  pendingComplaints: 347,
  resolvedToday: 23,
  escalatedComplaints: 12,
  averageResolutionDays: 4.2,
  slaBreachCount: 8,
  districtBreakdown: [
    { district: "Mumbai City",     open: 89,  resolved: 412, escalated: 4,  slaBreached: 2 },
    { district: "Mumbai Suburban", open: 104, resolved: 380, escalated: 5,  slaBreached: 3 },
    { district: "Pune",            open: 67,  resolved: 291, escalated: 2,  slaBreached: 1 },
    { district: "Thane",           open: 53,  resolved: 188, escalated: 1,  slaBreached: 2 },
    { district: "Nagpur",          open: 34,  resolved: 133, escalated: 0,  slaBreached: 0 },
  ],
};

export function getMockAdminOverview(): AdminOverview {
  return mockAdminOverview;
}

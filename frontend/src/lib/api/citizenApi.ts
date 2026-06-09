/**
 * Citizen-facing API service.
 *
 * Every function follows the same pattern:
 *   withMockFallback(
 *     () => <live API call>,
 *     () => <mock data>,
 *     email,
 *   )
 *
 * Normal users get the live API directly.
 * Dev team members get the live API first; mock fills missing fields or takes
 * over entirely if the live API fails.
 */

import {
  fetchCitizenAuth,
  readResponseJson,
  extractMessage,
} from "@/lib/auth/citizenSession";
import { withMockFallback } from "./withMockFallback";
import { getMockComplaints, getMockUserStats } from "@/lib/mock/mockComplaints";
import { getMockFeed, getMockComments, getMockStories } from "@/lib/mock/mockReports";
import { getMockDashboardSummary } from "@/lib/mock/mockDashboard";
import { getMockAdminOverview } from "@/lib/mock/mockAdmin";
import type { MyReport, UserStats } from "@/components/my-reports/types";
import type { ReportFeedItem, CommentItem, StoryItem } from "@/components/community/types";
import type { DashboardSummary, AdminOverview } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function apiUrl(path: string): string {
  return `${API_BASE}/api${path}`;
}

// ─── Response envelope helper ─────────────────────────────────────────────────

async function unwrapData<T>(response: Response, fallback: string): Promise<T> {
  const payload = await readResponseJson(response);
  if (!response.ok) {
    throw new Error(extractMessage(payload, fallback));
  }
  const envelope = payload as { data?: T; success?: boolean };
  if (envelope.data === undefined || envelope.data === null) {
    throw new Error(fallback);
  }
  return envelope.data;
}

// ─── Complaints / My Reports ──────────────────────────────────────────────────

/**
 * Fetch the authenticated user's submitted complaints.
 */
export async function getMyComplaints(email?: string): Promise<MyReport[]> {
  return withMockFallback(
    async () => {
      const response = await fetchCitizenAuth(apiUrl("/complaints/my"));
      return unwrapData<MyReport[]>(response, "Unable to load your reports.");
    },
    getMockComplaints,
    email,
  );
}

/**
 * Fetch the authenticated user's aggregate stats.
 */
export async function getMyStats(email?: string): Promise<UserStats> {
  return withMockFallback(
    async () => {
      const response = await fetchCitizenAuth(apiUrl("/complaints/my/stats"));
      return unwrapData<UserStats>(response, "Unable to load your stats.");
    },
    getMockUserStats,
    email,
  );
}

// ─── Community Feed ───────────────────────────────────────────────────────────

/**
 * Fetch the community report feed for the given scope.
 */
export async function getCommunityFeed(
  scope: string,
  email?: string,
): Promise<ReportFeedItem[]> {
  return withMockFallback(
    async () => {
      const response = await fetchCitizenAuth(
        apiUrl(`/complaints/feed?scope=${encodeURIComponent(scope)}`),
      );
      return unwrapData<ReportFeedItem[]>(response, "Unable to load community feed.");
    },
    getMockFeed,
    email,
  );
}

/**
 * Fetch comments for a specific report.
 */
export async function getReportComments(
  reportId: string,
  email?: string,
): Promise<CommentItem[]> {
  return withMockFallback(
    async () => {
      const response = await fetchCitizenAuth(apiUrl(`/complaints/${reportId}/comments`));
      return unwrapData<CommentItem[]>(response, "Unable to load comments.");
    },
    () => getMockComments()[reportId] ?? [],
    email,
  );
}

/**
 * Fetch active stories (highlights bar above the feed).
 */
export async function getCommunityStories(email?: string): Promise<StoryItem[]> {
  return withMockFallback(
    async () => {
      const response = await fetchCitizenAuth(apiUrl("/complaints/stories"));
      return unwrapData<StoryItem[]>(response, "Unable to load stories.");
    },
    getMockStories,
    email,
  );
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────

/**
 * Fetch the citizen dashboard summary (stats overview).
 */
export async function getDashboardSummary(email?: string): Promise<DashboardSummary> {
  return withMockFallback(
    async () => {
      const response = await fetchCitizenAuth(apiUrl("/dashboard/summary"));
      return unwrapData<DashboardSummary>(response, "Unable to load dashboard.");
    },
    getMockDashboardSummary,
    email,
  );
}

// ─── Admin ────────────────────────────────────────────────────────────────────

/**
 * Fetch admin overview stats (authorities / super-admin only).
 */
export async function getAdminOverview(email?: string): Promise<AdminOverview> {
  return withMockFallback(
    async () => {
      const response = await fetchCitizenAuth(apiUrl("/admin/overview"));
      return unwrapData<AdminOverview>(response, "Unable to load admin overview.");
    },
    getMockAdminOverview,
    email,
  );
}

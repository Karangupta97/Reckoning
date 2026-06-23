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
import type { MyReport, UserStats, HazardType, Severity, ReportStatus } from "@/components/my-reports/types";
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

// ─── Mappings ──────────────────────────────────────────────────────────────────

const HAZARD_TYPE_MAP: Record<string, HazardType> = {
  POTHOLE: "pothole",
  CRACKS_DAMAGE: "debris",
  FADED_LANE_MARKINGS: "signal",
  MISSING_BROKEN_SIGNBOARD: "signal",
  POOR_STREET_LIGHTING: "signal",
  ENCROACHMENT: "debris",
  OTHERS: "debris",
};

const HAZARD_EMOJI_MAP: Record<HazardType, string> = {
  pothole: "🕳",
  flooding: "🌊",
  accident: "⚠️",
  debris: "🌳",
  signal: "🚦",
};

function mapBackendCategoryToHazardType(category: string): HazardType {
  const upper = (category || "").toUpperCase();
  if (HAZARD_TYPE_MAP[upper]) {
    return HAZARD_TYPE_MAP[upper];
  }
  const lower = (category || "").toLowerCase();
  if (["pothole", "flooding", "accident", "debris", "signal"].includes(lower)) {
    return lower as HazardType;
  }
  return "debris";
}

function formatTimeAgo(dateStr: string | Date): string {
  const date = typeof dateStr === "string" || dateStr instanceof Date ? new Date(dateStr) : null;
  if (!date || isNaN(date.getTime())) return "recently";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function mapComplaintToMyReport(c: any): MyReport {
  const hazardType = mapBackendCategoryToHazardType(c.category);
  const hazardEmoji = HAZARD_EMOJI_MAP[hazardType] || "⚠️";

  let categoryLabel = c.category;
  if (c.category === "POTHOLE") categoryLabel = "Pothole";
  else if (c.category === "CRACKS_DAMAGE") categoryLabel = "Road Debris";
  else if (c.category === "FADED_LANE_MARKINGS") categoryLabel = "Faded Lane Markings";
  else if (c.category === "MISSING_BROKEN_SIGNBOARD") categoryLabel = "Broken Sign";
  else if (c.category === "POOR_STREET_LIGHTING") categoryLabel = "Poor Lighting";
  else if (c.category === "ENCROACHMENT") categoryLabel = "Encroachment";
  else if (c.category === "OTHERS") categoryLabel = "Road Hazard";

  const roadName = c.location?.roadName || c.roadName || "";
  const addressName = c.location?.address || c.address || "";
  const locationDesc = roadName || addressName.split(",")[0] || "reported location";
  const title = `${categoryLabel} near ${locationDesc}`;

  const status = (c.status || "submitted").toLowerCase() as ReportStatus;

  let timeline: any[] = [];
  if (Array.isArray(c.timeline) && c.timeline.length > 0) {
    timeline = c.timeline.map((t: any) => ({
      step: (t.status || "submitted").toLowerCase(),
      label: t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1).toLowerCase().replace("_", " ") : "Submitted",
      actor: "System",
      actorType: "system",
      note: t.note || "",
      date: t.changedAt || null,
      completed: true,
    }));
  } else {
    timeline = [
      {
        step: "submitted",
        label: "Submitted",
        actor: c.submittedBy || "Citizen",
        actorType: "citizen",
        note: "Report submitted successfully.",
        date: c.createdAt,
        completed: true,
      },
      {
        step: "resolved",
        label: "Resolved",
        actor: "",
        actorType: "authority",
        note: "",
        date: null,
        completed: false,
      },
    ];
  }

  const location = {
    name: addressName || roadName || "Unknown Location",
    road: roadName || "",
    subdistrict: "",
    district: "",
    state: "",
    lat: c.location?.latitude || c.latitude || 0,
    lng: c.location?.longitude || c.longitude || 0,
    gps: `${(c.location?.latitude || c.latitude || 0).toFixed(4)}° N, ${(c.location?.longitude || c.longitude || 0).toFixed(4)}° E`,
  };

  const aiRaw = c.aiRawResult
    ? typeof c.aiRawResult === "string"
      ? (() => {
          try {
            return JSON.parse(c.aiRawResult);
          } catch {
            return null;
          }
        })()
      : c.aiRawResult
    : null;

  const mediaResults = aiRaw?.mediaResults || [];

  const media = Array.isArray(c.media)
    ? c.media.map((m: any) => {
        const matchedAi = mediaResults.find((mr: any) => mr.mediaId === m.id || mr.url === m.url);
        return {
          id: m.id,
          url: m.url,
          mimeType: m.mimeType,
          isPrimary: m.isPrimary,
          aiResult: matchedAi?.aiResult ?? null,
        };
      })
    : [];

  return {
    id: c.id,
    reportId: c.ticketNumber || c.id,
    title,
    description: c.description || "No description provided.",
    hazardType,
    hazardEmoji,
    severity: (c.severity || "medium").toLowerCase() as Severity,
    status,
    statusStep: status === "resolved" ? 5 : status === "in_progress" ? 4 : status === "assigned" ? 3 : status === "verified" ? 2 : 1,
    location,
    hasPhoto: Array.isArray(c.media) && c.media.length > 0,
    photoUrl: Array.isArray(c.media) && c.media.length > 0 ? c.media[0].url : undefined,
    photoCount: Array.isArray(c.media) ? c.media.length : 0,
    upvotes: c.upvotes || 0,
    hasUpvoted: false,
    comments: 0,
    views: c.viewCount || 0,
    communityVerified: status !== "submitted",
    verificationCount: 0,
    isNotifying: false,
    createdAt: c.createdAt,
    lastUpdatedAt: c.updatedAt || c.createdAt,
    lastUpdatedBy: c.assignedAuthority?.name || "System",
    assignedTo: c.assignedAuthority?.name || undefined,
    timeline,
    aiDetected: c.aiDetected,
    aiCategory: c.aiCategory,
    aiConfidence: c.aiConfidence,
    aiAnnotatedImage: c.aiAnnotatedImage,
    media,
  };
}

// ─── Complaints / My Reports ──────────────────────────────────────────────────

/**
 * Fetch the authenticated user's submitted complaints.
 */
export async function getMyComplaints(email?: string): Promise<MyReport[]> {
  return withMockFallback(
    async () => {
      const response = await fetchCitizenAuth(apiUrl("/complaints/my"));
      const result = await unwrapData<{ complaints: any[] }>(response, "Unable to load your reports.");
      return Array.isArray(result?.complaints) ? result.complaints.map(mapComplaintToMyReport) : [];
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
      const rawStats = await unwrapData<any>(response, "Unable to load your stats.");

      const hazardBreakdown: Record<HazardType, number> = {
        pothole: 0,
        flooding: 0,
        accident: 0,
        debris: 0,
        signal: 0,
      };

      if (Array.isArray(rawStats.hazardBreakdown)) {
        for (const item of rawStats.hazardBreakdown) {
          const key = mapBackendCategoryToHazardType(item.category);
          hazardBreakdown[key] = (hazardBreakdown[key] || 0) + item.count;
        }
      } else if (rawStats.hazardBreakdown && typeof rawStats.hazardBreakdown === "object") {
        for (const [rawKey, count] of Object.entries(rawStats.hazardBreakdown)) {
          const key = mapBackendCategoryToHazardType(rawKey);
          hazardBreakdown[key] = (hazardBreakdown[key] || 0) + (count as number);
        }
      }

      return {
        totalReports: rawStats.total ?? 0,
        openReports: rawStats.open ?? 0,
        resolvedReports: rawStats.resolved ?? 0,
        rejectedReports: rawStats.rejected ?? 0,
        criticalReports: rawStats.criticalReports ?? 0,
        totalUpvotes: rawStats.totalUpvotes ?? 0,
        totalComments: rawStats.totalComments ?? 0,
        totalViews: rawStats.totalViews ?? 0,
        resolutionRate: rawStats.resolutionRate ?? 0,
        rankPercentile: rawStats.rankPercentile ?? 5,
        rankArea: rawStats.rankArea ?? "Local Area",
        hazardBreakdown,
        recentActivity: Array.isArray(rawStats.recentActivity)
          ? rawStats.recentActivity.map((act: any) => ({
              text: act.text,
              type: act.type,
              timeAgo: act.timeAgo ?? (act.createdAt ? formatTimeAgo(act.createdAt) : "recently"),
            }))
          : [],
      };
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
 * Delete (soft) a complaint by id.
 */
export async function deleteComplaint(id: string, email?: string): Promise<{ message: string }> {
  return withMockFallback(
    async () => {
      const response = await fetchCitizenAuth(apiUrl(`/complaints/${id}`), { method: "DELETE" });
      return unwrapData<{ message: string }>(response, "Unable to delete complaint.");
    },
    () => ({ message: "Deleted (mock)." }),
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

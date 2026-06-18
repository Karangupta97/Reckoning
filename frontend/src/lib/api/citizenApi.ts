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

function mapToMyReport(item: any): MyReport {
  const categoryMap: Record<string, string> = {
    POTHOLE: "pothole",
    FLOODING: "flooding",
    ACCIDENT: "accident",
    GARBAGE: "debris",
    STREET_LIGHT: "signal",
    OTHER: "debris",
  };

  const emojiMap: Record<string, string> = {
    pothole: "🕳",
    flooding: "🌊",
    accident: "⚠️",
    debris: "📦",
    signal: "🚦",
  };

  const statusStepMap: Record<string, number> = {
    submitted: 1,
    verified: 2,
    assigned: 3,
    in_progress: 4,
    resolved: 5,
    rejected: 6,
  };

  const rawCat = String(item.category || "OTHER").toUpperCase();
  let hazardType = "debris";
  if (rawCat.includes("POTHOLE")) hazardType = "pothole";
  else if (rawCat.includes("FLOOD") || rawCat.includes("WATER")) hazardType = "flooding";
  else if (rawCat.includes("ACCIDENT")) hazardType = "accident";
  else if (rawCat.includes("LIGHT") || rawCat.includes("SIGNAL")) hazardType = "signal";
  else hazardType = categoryMap[rawCat] || "debris";

  const hazardEmoji = emojiMap[hazardType] || "⚠️";

  const severity = String(item.severity || "medium").toLowerCase() as any;
  const status = String(item.status || "submitted").toLowerCase() as any;
  const statusStep = statusStepMap[status] || 1;

  const lat = item.location?.latitude ?? item.location?.lat ?? 0;
  const lng = item.location?.longitude ?? item.location?.lng ?? 0;

  const evidenceUrls = Array.isArray(item.media)
    ? item.media.map((m: any) => m.url)
    : item.primaryMedia?.url
      ? [item.primaryMedia.url]
      : [];

  const timeline = Array.isArray(item.timeline)
    ? item.timeline.map((t: any) => ({
        step: String(t.status).toLowerCase(),
        label: String(t.status).replace(/_/g, " "),
        actor: t.actor || "System",
        actorType: (t.actorType || "system") as any,
        note: t.note || "",
        date: t.changedAt || t.timestamp || null,
        completed: true,
      }))
    : [
        {
          step: "submitted",
          label: "Submitted",
          actor: "Citizen",
          actorType: "citizen",
          note: "Report submitted successfully.",
          date: item.createdAt,
          completed: true,
        },
      ];

  const aiDetection = item.aiCategory || item.aiConfidence || item.aiDetected
    ? {
        hazardType: String(item.aiCategory || hazardType).toLowerCase(),
        severity: severity,
        confidence: item.aiConfidence ?? 85,
        riskScore: item.riskScore ?? 50,
      }
    : undefined;

  return {
    id: item.id,
    reportId: item.ticketNumber || item.reportId || `RPT-${item.id.slice(0, 8)}`,
    title: item.title || `${hazardEmoji} ${hazardType.charAt(0).toUpperCase() + hazardType.slice(1)} reported at ${item.location?.roadName || item.location?.address || "Location"}`,
    description: item.description || "",
    hazardType: hazardType as any,
    hazardEmoji,
    severity,
    status,
    statusStep,
    location: {
      name: item.location?.address || "Location",
      road: item.location?.roadName || "",
      subdistrict: item.location?.subdistrict || "",
      district: item.location?.district || "",
      state: item.location?.state || "",
      lat,
      lng,
      gps: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
    },
    hasPhoto: evidenceUrls.length > 0,
    photoUrl: evidenceUrls[0],
    photoCount: evidenceUrls.length,
    evidenceUrls,
    annotatedImageUrl: item.aiAnnotatedImage || undefined,
    aiDetection,
    riskScore: item.riskScore ?? 50,
    upvotes: item.upvotes ?? 0,
    hasUpvoted: false,
    comments: item.comments ?? 0,
    views: item.viewCount ?? 0,
    communityVerified: statusStep > 1,
    verificationCount: statusStep > 1 ? 5 : 0,
    isNotifying: false,
    isAnonymous: item.isAnonymous ?? false,
    createdAt: item.createdAt,
    lastUpdatedAt: item.updatedAt || item.createdAt,
    lastUpdatedBy: item.assignedAuthority?.name || "System",
    assignedTo: item.assignedAuthority?.name || undefined,
    timeline,
  };
}

/**
 * Fetch the authenticated user's submitted complaints with optional filters.
 */
export async function getMyComplaints(
  params?: { status?: string; sort?: string; search?: string; page?: number; limit?: number },
  email?: string,
): Promise<MyReport[]> {
  return withMockFallback(
    async () => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.sort) qs.set("sort", params.sort);
      if (params?.search) qs.set("search", params.search);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      const url = apiUrl(`/complaints/my${query ? `?${query}` : ""}`);
      const response = await fetchCitizenAuth(url);
      const data = await unwrapData<{ complaints: any[] }>(response, "Unable to load your reports.");
      return data.complaints.map(mapToMyReport);
    },
    getMockComplaints,
    email,
  );
}

/**
 * Fetch a single complaint by ID.
 */
export async function getComplaintById(
  id: string,
  email?: string,
): Promise<MyReport> {
  return withMockFallback(
    async () => {
      const response = await fetchCitizenAuth(apiUrl(`/complaints/${id}`));
      const data = await unwrapData<any>(response, "Unable to load complaint.");
      return mapToMyReport(data);
    },
    () => getMockComplaints()[0],
    email,
  );
}

export interface AIDetectionResultView {
  suggestedCategory: string | null;
  suggestedSeverity: string | null;
  confidence: number | null;
  allDetectedIssues?: string[];
  totalDetected?: number;
  /** Nested presigned S3 URL object. url is the pre-signed download link. */
  annotatedImage: {
    url: string;
    expiresIn?: number;
    s3Key?: string | null;
  } | null;
  message?: string;
}

/**
 * Fetch AI detection results for a complaint.
 *
 * NOTE: The API returns `{ success: true, data: null }` when no AI analysis
 * exists yet — this is valid and must NOT throw. We read the envelope manually
 * instead of going through `unwrapData` which rejects null data.
 */
export async function getComplaintDetectionResult(
  complaintId: string,
  email?: string,
): Promise<AIDetectionResultView | null> {
  return withMockFallback(
    async () => {
      const response = await fetchCitizenAuth(apiUrl(`/ai/detect/${complaintId}`));
      const payload = await readResponseJson(response);

      if (!response.ok) {
        throw new Error(extractMessage(payload, "Unable to load AI analysis."));
      }

      // Shape: { success: true, data: AIDetectionResultView | null }
      // data === null is valid (complaint has no AI result yet) — return null, don't throw.
      const envelope = payload as { success?: boolean; data: AIDetectionResultView | null };
      return envelope.data ?? null;
    },
    () => {
      const report = getMockComplaints().find((r) => r.id === complaintId) || getMockComplaints()[0];
      return {
        suggestedCategory: report.aiDetection?.hazardType
          ? report.aiDetection.hazardType.toUpperCase()
          : "POTHOLE",
        suggestedSeverity: report.aiDetection?.severity
          ? report.aiDetection.severity.toUpperCase()
          : "HIGH",
        confidence: report.aiDetection?.confidence
          ? report.aiDetection.confidence / 100
          : 0.85,
        allDetectedIssues: report.aiDetection?.hazardType
          ? [report.aiDetection.hazardType.toUpperCase()]
          : ["POTHOLE"],
        totalDetected: 1,
        annotatedImage: report.annotatedImageUrl ? { url: report.annotatedImageUrl } : null,
        message: "Detected issues.",
      };
    },
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
      const data = await unwrapData<any>(response, "Unable to load your stats.");
      
      const hazardBreakdown: Record<string, number> = {
        pothole: 0,
        flooding: 0,
        accident: 0,
        debris: 0,
        signal: 0,
      };

      if (Array.isArray(data.hazardBreakdown)) {
        for (const item of data.hazardBreakdown) {
          const cat = String(item.category).toLowerCase();
          let type = "debris";
          if (cat.includes("pothole")) type = "pothole";
          else if (cat.includes("flood") || cat.includes("water")) type = "flooding";
          else if (cat.includes("accident")) type = "accident";
          else if (cat.includes("signal") || cat.includes("light")) type = "signal";
          hazardBreakdown[type] += item.count;
        }
      }

      return {
        totalReports: data.total ?? 0,
        openReports: data.open ?? 0,
        resolvedReports: data.resolved ?? 0,
        rejectedReports: data.rejected ?? 0,
        criticalReports: 0,
        totalUpvotes: 0,
        totalComments: 0,
        totalViews: 0,
        resolutionRate: data.resolutionRate ?? 0,
        rankPercentile: 0,
        rankArea: "",
        hazardBreakdown,
        recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity.map((a: any) => ({
          text: a.text,
          timeAgo: new Date(a.createdAt).toISOString(),
          type: a.type
        })) : [],
      } as UserStats;
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

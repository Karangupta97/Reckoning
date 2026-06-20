// ─── My Reports Types ─────────────────────────────────────────────────────────

export type HazardType = "pothole" | "flooding" | "accident" | "debris" | "signal";
export type Severity = "low" | "medium" | "high" | "critical";
export type ReportStatus = "submitted" | "verified" | "assigned" | "in_progress" | "resolved" | "rejected";
export type ActorType = "citizen" | "community" | "system" | "authority";

export interface ReportLocation {
  name: string;
  road: string;
  subdistrict: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  gps: string;
}

export interface TimelineEntry {
  step: string;
  label: string;
  actor: string;
  actorType: ActorType;
  note: string;
  date: string | null;
  completed: boolean;
}

export interface OfficialResponse {
  author: string;
  isVerifiedAuthority: boolean;
  text: string;
  likes: number;
  createdAt: string;
}

export interface MyReport {
  id: string;
  reportId: string;
  title: string;
  description: string;
  hazardType: HazardType;
  hazardEmoji: string;
  severity: Severity;
  status: ReportStatus;
  statusStep: number;
  location: ReportLocation;
  hasPhoto: boolean;
  photoUrl?: string;
  photoCount: number;
  upvotes: number;
  hasUpvoted: boolean;
  comments: number;
  views: number;
  communityVerified: boolean;
  verificationCount: number;
  isNotifying: boolean;
  isAnonymous?: boolean;
  createdAt: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  assignedTo?: string;
  expectedResolution?: string;
  referenceId?: string;
  rejectionReason?: string;
  officialResponse?: OfficialResponse;
  timeline: TimelineEntry[];
  aiDetected?: boolean;
  aiCategory?: string | null;
  aiConfidence?: number | null;
  aiAnnotatedImage?: string | null;
}

export interface RecentActivityItem {
  text: string;
  timeAgo: string;
  type: "resolved" | "response" | "verified" | "assigned" | "rejected";
}

export interface UserStats {
  totalReports: number;
  openReports: number;
  resolvedReports: number;
  rejectedReports: number;
  criticalReports: number;
  totalUpvotes: number;
  totalComments: number;
  totalViews: number;
  resolutionRate: number;
  rankPercentile: number;
  rankArea: string;
  hazardBreakdown: Record<HazardType, number>;
  recentActivity: RecentActivityItem[];
}

export type SortOption = "latest" | "oldest" | "severity" | "status";
export type FilterTab = "all" | "open" | "in_progress" | "resolved" | "rejected";

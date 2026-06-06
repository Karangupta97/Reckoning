/* ─── Community Feed Types ───────────────────────────────────── */

export interface ReportFeedItem {
  id: string;
  userName: string;
  userInitial: string;
  userColor: string;
  isAnonymous: boolean;
  isVerified: boolean;
  isFollowing: boolean;
  location: string;
  road: string;
  timeAgo: string;
  hazardType: HazardType;
  hazardEmoji: string;
  severity: Severity;
  title: string;
  description: string;
  hasPhoto: boolean;
  photoPlaceholderColor: string;
  status: ReportStatusType;
  statusStep: number;
  upvotes: number;
  hasUpvoted: boolean;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  isSaved: boolean;
  officialResponse: boolean;
  coordinates?: { lat: number; lng: number };
}

export type HazardType = "pothole" | "flooding" | "broken-signal" | "road-damage" | "debris" | "accident" | "waterlogging" | "street-light" | "cave-in" | "guardrail";
export type Severity = "low" | "medium" | "high" | "critical";
export type ReportStatusType = "submitted" | "verified" | "assigned" | "in_progress" | "resolved";

export interface CommentReply {
  id: string;
  userName: string;
  text: string;
  likes: number;
  timeAgo: string;
}

export interface CommentItem {
  id: string;
  userName: string;
  initial: string;
  color: string;
  text: string;
  likes: number;
  timeAgo: string;
  isOfficial: boolean;
  isPinned: boolean;
  replies: CommentReply[];
}

export interface StoryItem {
  id: string;
  type: "new" | "report";
  emoji?: string;
  location?: string;
  severity?: Severity;
  reportId?: string;
  label?: string;
}

export type FeedScope = "sub-district" | "district" | "state" | "national";

export interface ScopeOption {
  key: FeedScope;
  icon: string;
  label: string;
  sublabel: string;
  count: string;
}

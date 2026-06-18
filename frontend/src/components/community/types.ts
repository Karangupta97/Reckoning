// ─── Report Feed Item ─────────────────────────────────────────────────────────

export interface ReportFeedItem {
  id:           string;
  userName:     string;
  userInitial:  string;
  userColor:    string;
  isAnonymous:  boolean;
  isVerified:   boolean;
  isFollowing:  boolean;
  location:     string;
  road:         string;
  timeAgo:      string;
  hazardType:   string;
  hazardEmoji:  string;
  severity:     "low" | "medium" | "high" | "critical";
  title:        string;
  description:  string;

  // ── Media ────────────────────────────────────────────────────────
  mediaType:     "image" | "video";
  mediaUrl:      string;
  thumbnailUrl:  string;

  // ── Intelligence Scores ──────────────────────────────────────────
  riskScore:              number;   // 0–100
  trustScore:             number;   // 0–100
  verificationPercent:    number;   // 0–100
  authorityStatus:        string;   // e.g. "Assigned — BMC Mumbai"
  verifiedCitizensCount:  number;

  // ── Status & Engagement ──────────────────────────────────────────
  status:          "submitted" | "verified" | "in_progress" | "resolved" | "rejected";
  statusStep:      number;
  upvotes:         number;
  hasUpvoted:      boolean;
  comments:        number;
  shares:          number;
  saves:           number;
  views:           number;
  isSaved:         boolean;
  officialResponse: boolean;
  coordinates:     { lat: number; lng: number };
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

export interface ReplyItem {
  id:       string;
  userName: string;
  text:     string;
  likes:    number;
  timeAgo:  string;
}

export type CommentReply = ReplyItem;

export interface CommentItem {
  id:         string;
  userName:   string;
  initial:    string;
  color:      string;
  text:       string;
  likes:      number;
  timeAgo:    string;
  isOfficial: boolean;
  isPinned:   boolean;
  replies:    ReplyItem[];
}

// ─── Story Item ───────────────────────────────────────────────────────────────

export interface StoryItem {
  id:           string;
  type:         "new" | "report";
  label?:       string;
  emoji?:       string;
  location?:    string;
  severity?:    "low" | "medium" | "high" | "critical";
  reportId?:    string;
  thumbnailUrl?: string;
}

// ─── Scope Option ─────────────────────────────────────────────────────────────

export type FeedScope = "sub-district" | "district" | "state" | "national";

export interface ScopeOption {
  key:      FeedScope;
  icon:     string;
  label:    string;
  sublabel: string;
  count:    string;
}
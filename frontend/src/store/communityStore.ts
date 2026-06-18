import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ─── Types ─────────────────────────────────────────────────── */
export type FeedScope = "sub-district" | "district" | "state" | "national";
export type HazardType = "pothole" | "flooding" | "broken-signal" | "road-damage" | "debris" | "accident";
export type Severity = "low" | "medium" | "high" | "critical";
export type ReportStatus = "open" | "verified" | "in-progress" | "resolved";
export type CommentSort = "top" | "newest" | "verified";
export type VerificationVote = "confirm" | "need-review" | "resolved";
export type CivicReaction = "dangerous" | "verified" | "needs-action" | "good-report" | "nearby";
export type DiscoverTab = "for-you" | "nearby" | "trending" | "verified" | "resolved" | "following";

export interface Reporter {
  id: string;
  name: string;
  avatar: string;
  isVerified: boolean;
  badge?: string;
  district: string;
  reportsCount: number;
  verifiedCount: number;
  contributionScore: number;
  trustScore: number;
}

export interface Comment {
  id: string;
  author: Reporter;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  isPinned: boolean;
  isAuthority: boolean;
  isModerator: boolean;
  replies: Comment[];
  mentions: string[];
}

export interface VerificationStats {
  confirmed: number;
  needReview: number;
  resolved: number;
  confidence: number;
}

export interface TimelineStep {
  label: string;
  status: "completed" | "active" | "pending";
  timestamp?: string;
}

export interface HazardPost {
  id: string;
  reporter: Reporter;
  location: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  media: { type: "image" | "video"; url: string; aspectRatio: "4:5" | "9:16" }[];
  hazardType: HazardType;
  severity: Severity;
  description: string;
  riskScore: number;
  status: ReportStatus;
  upvotes: number;
  isUpvoted: boolean;
  isSaved: boolean;
  isFollowing: boolean;
  commentsCount: number;
  comments: Comment[];
  verification: VerificationStats;
  userVote: VerificationVote | null;
  civicReactions: Record<CivicReaction, number>;
  userReaction: CivicReaction | null;
  timeline: TimelineStep[];
  communityTrustScore: number;
  hashtags: string[];
  sharesCount: number;
}

export interface SafetyStory {
  id: string;
  type: "critical" | "flood" | "closure" | "accident";
  title: string;
  location: string;
  thumbnail: string;
  isViewed: boolean;
}

/* ─── Store ─────────────────────────────────────────────────── */
interface CommunityState {
  scope: FeedScope;
  setScope: (s: FeedScope) => void;
  activeTab: DiscoverTab;
  setActiveTab: (t: DiscoverTab) => void;
  commentSort: CommentSort;
  setCommentSort: (s: CommentSort) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activePostIndex: number;
  setActivePostIndex: (i: number) => void;
  isCommentSheetOpen: boolean;
  setCommentSheetOpen: (open: boolean) => void;
  commentSheetPostId: string | null;
  setCommentSheetPostId: (id: string | null) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

export const useCommunityStore = create<CommunityState>()(
  persist(
    (set) => ({
      scope: "sub-district",
      setScope: (scope) => set({ scope }),
      activeTab: "for-you",
      setActiveTab: (activeTab) => set({ activeTab }),
      commentSort: "top",
      setCommentSort: (commentSort) => set({ commentSort }),
      searchQuery: "",
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      activePostIndex: 0,
      setActivePostIndex: (activePostIndex) => set({ activePostIndex }),
      isCommentSheetOpen: false,
      setCommentSheetOpen: (isCommentSheetOpen) => set({ isCommentSheetOpen }),
      commentSheetPostId: null,
      setCommentSheetPostId: (commentSheetPostId) => set({ commentSheetPostId }),
      isMuted: true,
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
    }),
    {
      name: "reckoning-community",
      partialize: (state) => ({ scope: state.scope, activeTab: state.activeTab, isMuted: state.isMuted }),
    }
  )
);

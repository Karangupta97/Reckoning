// ─── Leaderboard Types ─────────────────────────────────────────────────────────

export type LeaderboardView = "citizen" | "sub-district-admin" | "district-admin";
export type LeaderboardScope = "global" | "district" | "sub-district";
export type TimeFilter = "all-time" | "this-month" | "this-week";

export interface CitizenEntry {
  rank: number;
  prevRank: number;
  name: string;
  points: number;
  pointsDeltaWeek: number;
  reports: number;
  verified: number;
  reputation: number;
  isCurrentUser: boolean;
  avatarColor: string;
  initial: string;
  isVerifiedUser: boolean;
  district: string;
  subDistrict: string;
  badges: string[];
  // Expanded row stats
  totalReports: number;
  validationCount: number;
  resolvedCount: number;
  streak: number;
  // Detail modal fields
  impactScore: number;
  livesImpacted: number;
  roadsImproved: number;
  authoritiesNotified: number;
  highRiskReports: number;
  rejections: number;
  authorityActionsTriggered: number;
  recentAchievements: { name: string; timeAgo: string; icon: string }[];
}

export interface AdminEntry {
  rank: number;
  prevRank: number;
  name: string;
  role: "Sub-District Admin" | "District Admin";
  issuesResolved: number;
  pointsDeltaWeek: number;
  avgResolutionTime: string;
  validationAccuracy: number;
  isCurrentUser: boolean;
  avatarColor: string;
  initial: string;
  district: string;
  subDistrict?: string;
  // Detail fields
  totalTickets: number;
  escalations: number;
  citizenRating: number;
  responseRate: number;
}

export type AnyEntry = CitizenEntry | AdminEntry;

export function isCitizenEntry(e: AnyEntry): e is CitizenEntry {
  return "points" in e;
}

export interface GlobalStats {
  citizensActive: string;
  reportsSubmitted: string;
  hazardsResolved: string;
  livesImpacted: string;
}

export interface Challenge {
  id: string;
  title: string;
  progress: number;
  total: number;
  reward: number;
  endsAt: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  weekActivity: boolean[];
}

export interface RankProgress {
  currentRank: string;
  currentXP: number;
  nextRank: string;
  nextRankXP: number;
  badgeColor: string;
}

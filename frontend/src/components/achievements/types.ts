// ─── Achievements & Reputation Types ──────────────────────────────────────────

export type RankLevel = 1 | 2 | 3 | 4;

export interface RankInfo {
  level: RankLevel;
  title: string;
  icon: string;
  color: string;
  minPoints: number;
  maxPoints: number | null;
}

export interface UserAchievementProfile {
  name: string;
  citizenId: string;
  avatarUrl: string;
  currentRank: RankInfo;
  totalXP: number;
  nextRankXP: number;
  totalPoints: number;
  reputationScore: number;
  contributionStreak: number;
  districtRank: number;
}

export interface StatCard {
  id: string;
  label: string;
  value: string | number;
  icon: string;
  sublabel?: string;
  sublabelColor?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
  unlockedAt?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface Challenge {
  id: string;
  title: string;
  progress: number;
  total: number;
  reward: number;
  rewardType: "xp" | "badge" | "points";
  endsAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  reports: number;
  reputation: number;
  isCurrentUser: boolean;
  avatarColor: string;
  initial: string;
}

export type LeaderboardScope = "sub-district" | "district" | "state" | "national";

export interface AchievementTimelineItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  timeAgo: string;
  type: "rank" | "badge" | "points" | "report" | "streak";
}

export interface PointRule {
  action: string;
  points: number;
  isNegative?: boolean;
}

export interface ImpactStat {
  label: string;
  value: string | number;
  icon: string;
}

export interface ContributionData {
  month: string;
  submitted: number;
  verified: number;
  resolved: number;
}

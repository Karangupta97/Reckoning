import type {
  RankInfo,
  UserAchievementProfile,
  StatCard,
  Badge,
  Challenge,
  LeaderboardEntry,
  AchievementTimelineItem,
  PointRule,
  ImpactStat,
  ContributionData,
} from "./types";

// ─── Rank System ──────────────────────────────────────────────────────────────

export const RANKS: RankInfo[] = [
  { level: 1, title: "Citizen", icon: "user", color: "#22C55E", minPoints: 0, maxPoints: 999 },
  { level: 2, title: "Road Guardian", icon: "shield", color: "#3B82F6", minPoints: 1000, maxPoints: 2999 },
  { level: 3, title: "Community Sentinel", icon: "building", color: "#8B5CF6", minPoints: 3000, maxPoints: 6999 },
  { level: 4, title: "Road Warrior", icon: "swords", color: "#F59E0B", minPoints: 7000, maxPoints: null },
];

// ─── User Profile ─────────────────────────────────────────────────────────────

export const USER_PROFILE: UserAchievementProfile = {
  name: "Rahul Mehta",
  citizenId: "RK245678",
  avatarUrl: "",
  currentRank: RANKS[1],
  totalXP: 2450,
  nextRankXP: 3000,
  totalPoints: 4820,
  reputationScore: 92,
  contributionStreak: 18,
  districtRank: 12,
};

// ─── Stats Grid ───────────────────────────────────────────────────────────────

export const STATS: StatCard[] = [
  { id: "points", label: "Total Points", value: "4,820", icon: "trophy", sublabel: "↑ 320 this month", sublabelColor: "#22C55E" },
  { id: "reputation", label: "Reputation Score", value: "92/100", icon: "star", sublabel: "Excellent", sublabelColor: "#22C55E" },
  { id: "streak", label: "Contribution Streak", value: "18 Days", icon: "flame", sublabel: "Keep it up!", sublabelColor: "#F59E0B" },
  { id: "rank", label: "Rank Position", value: "#12", icon: "medal", sublabel: "District Ranking", sublabelColor: "#3B82F6" },
];

// ─── Badges ───────────────────────────────────────────────────────────────────

export const BADGES: Badge[] = [
  { id: "b1", name: "Hazard Hunter", description: "10 Reports Submitted", icon: "construction", unlocked: true, progress: 10, total: 10, unlockedAt: "2 weeks ago", rarity: "common" },
  { id: "b2", name: "Evidence Expert", description: "50 Reports With Photos", icon: "camera", unlocked: true, progress: 50, total: 50, unlockedAt: "5 days ago", rarity: "rare" },
  { id: "b3", name: "Video Witness", description: "25 Reports With Videos", icon: "video", unlocked: false, progress: 18, total: 25, rarity: "rare" },
  { id: "b4", name: "Community Protector", description: "100 Verified Reports", icon: "shield-check", unlocked: false, progress: 67, total: 100, rarity: "epic" },
  { id: "b5", name: "Quick Reporter", description: "5 Reports Under 30 Seconds", icon: "zap", unlocked: true, progress: 5, total: 5, unlockedAt: "1 month ago", rarity: "common" },
  { id: "b6", name: "Flood Watcher", description: "20 Flood Reports", icon: "cloud-rain", unlocked: false, progress: 8, total: 20, rarity: "rare" },
  { id: "b7", name: "Signal Guardian", description: "20 Signal Issues Reported", icon: "traffic-cone", unlocked: false, progress: 12, total: 20, rarity: "rare" },
  { id: "b8", name: "Top Contributor", description: "Top 10 Monthly", icon: "award", unlocked: true, progress: 1, total: 1, unlockedAt: "Last month", rarity: "legendary" },
];

// ─── Monthly Challenges ───────────────────────────────────────────────────────

export const CHALLENGES: Challenge[] = [
  { id: "ch1", title: "Submit 5 Verified Reports", progress: 3, total: 5, reward: 250, rewardType: "xp", endsAt: "12d 06h 42m" },
  { id: "ch2", title: "Verify 10 Community Reports", progress: 7, total: 10, reward: 300, rewardType: "points", endsAt: "12d 06h 42m" },
  { id: "ch3", title: "Report 3 Critical Hazards", progress: 1, total: 3, reward: 200, rewardType: "xp", endsAt: "12d 06h 42m" },
];

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Arjun Verma", points: 8450, reports: 256, reputation: 98, isCurrentUser: false, avatarColor: "#F59E0B", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80", initial: "A" },
  { rank: 2, name: "Priya", points: 6250, reports: 189, reputation: 96, isCurrentUser: false, avatarColor: "#3B82F6", avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&h=150&q=80", initial: "P" },
  { rank: 3, name: "Sneha Iyer", points: 4930, reports: 149, reputation: 94, isCurrentUser: false, avatarColor: "#8B5CF6", avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80", initial: "S" },
  { rank: 4, name: "Ajay Sharma", points: 4560, reports: 128, reputation: 91, isCurrentUser: false, avatarColor: "#22C55E", initial: "A" },
  { rank: 5, name: "Priya Nair", points: 4210, reports: 114, reputation: 88, isCurrentUser: false, avatarColor: "#EC4899", initial: "P" },
  { rank: 6, name: "Vikram Das", points: 3890, reports: 98, reputation: 93, isCurrentUser: false, avatarColor: "#06B6D4", initial: "V" },
  { rank: 7, name: "Sneha Reddy", points: 3650, reports: 89, reputation: 90, isCurrentUser: false, avatarColor: "#F97316", initial: "S" },
  { rank: 8, name: "Kiran Patel", points: 3420, reports: 82, reputation: 87, isCurrentUser: false, avatarColor: "#10B981", initial: "K" },
  { rank: 9, name: "Neha Gupta", points: 2890, reports: 76, reputation: 91, isCurrentUser: false, avatarColor: "#8B5CF6", initial: "N" },
  { rank: 10, name: "Arjun Singh", points: 2670, reports: 71, reputation: 89, isCurrentUser: false, avatarColor: "#EF4444", initial: "A" },
  { rank: 11, name: "Suresh Patil", points: 2510, reports: 59, reputation: 90, isCurrentUser: false, avatarColor: "#F59E0B", initial: "S" },
  { rank: 12, name: "Rahul Mehta", points: 2450, reports: 67, reputation: 92, isCurrentUser: true, avatarColor: "#3B82F6", initial: "R" },
  { rank: 13, name: "Suresh Patil", points: 2310, reports: 59, reputation: 90, isCurrentUser: false, avatarColor: "#22C55E", initial: "S" },
  { rank: 14, name: "Neha Joshi", points: 2100, reports: 54, reputation: 87, isCurrentUser: false, avatarColor: "#EC4899", initial: "N" },
];

// ─── Achievement Timeline ─────────────────────────────────────────────────────

export const ACHIEVEMENT_TIMELINE: AchievementTimelineItem[] = [
  { id: "at1", title: "Earned Road Guardian Rank", description: "Reached 1,000 points and unlocked Road Guardian rank.", icon: "medal", timeAgo: "2 days ago", type: "rank" },
  { id: "at2", title: "Verified Pothole Report", description: "Your report on Carter Road was verified by the community.", icon: "check-circle", timeAgo: "Yesterday", type: "report" },
  { id: "at3", title: "Reached 2,000 Points", description: "Keep going! You are making a difference.", icon: "target", timeAgo: "3 days ago", type: "points" },
  { id: "at4", title: "Evidence Expert Badge Earned", description: "Submitted 50 reports with photos.", icon: "camera", timeAgo: "5 days ago", type: "badge" },
  { id: "at5", title: "15-Day Streak!", description: "Consistent contributions for 15 consecutive days.", icon: "flame", timeAgo: "1 week ago", type: "streak" },
];

// ─── Points Rules ─────────────────────────────────────────────────────────────

export const POINT_RULES: PointRule[] = [
  { action: "Verified Report", points: 50 },
  { action: "Resolved Report", points: 150 },
  { action: "Community Verification", points: 20 },
  { action: "Accurate Verification", points: 30 },
  { action: "High Risk Hazard", points: 100 },
  { action: "Authority Action Triggered", points: 200 },
  { action: "Report with Photo", points: 15 },
  { action: "Report with Video", points: 25 },
  { action: "Daily Contribution", points: 10 },
  { action: "Weekly Streak", points: 100 },
  { action: "Monthly Streak", points: 500 },
  { action: "Top Contributor Bonus", points: 300 },
  { action: "False Report", points: -200, isNegative: true },
  { action: "Rejected Report", points: -50, isNegative: true },
];

// ─── Impact Statistics ────────────────────────────────────────────────────────

export const IMPACT_STATS: ImpactStat[] = [
  { label: "Reports Submitted", value: 124, icon: "clipboard-list" },
  { label: "Verified Reports", value: 98, icon: "check-circle" },
  { label: "Resolved Issues", value: 67, icon: "wrench" },
  { label: "Citizens Impacted", value: "12,430", icon: "users" },
  { label: "Authorities Notified", value: 89, icon: "landmark" },
  { label: "Hazards Removed", value: 43, icon: "construction" },
];

// ─── Contribution Analytics ───────────────────────────────────────────────────

export const CONTRIBUTION_DATA: ContributionData[] = [
  { month: "Jan", submitted: 8, verified: 6, resolved: 3 },
  { month: "Feb", submitted: 12, verified: 9, resolved: 5 },
  { month: "Mar", submitted: 15, verified: 12, resolved: 8 },
  { month: "Apr", submitted: 10, verified: 8, resolved: 6 },
  { month: "May", submitted: 18, verified: 14, resolved: 9 },
  { month: "Jun", submitted: 22, verified: 18, resolved: 12 },
];

/**
 * achievementStore.ts — Admin achievement/XP/badge system (frontend only).
 * Isolated data for District Admin and Sub-District Admin portals.
 * Citizen and Super Admin achievements are completely separate.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Shared types ─────────────────────────────────────────────────────────────

export type AdminPortalType = "district" | "sub-district";
export type AchievementBadgeRarity = "common" | "rare" | "epic" | "legendary";
export type AchievementType = "rank" | "badge" | "points" | "action" | "streak" | "milestone";

export interface AdminBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementBadgeRarity;
  unlocked: boolean;
  progress?: number;
  total?: number;
  unlockedAt?: string;
}

export interface AdminChallenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  reward: number;
  rewardType: "xp" | "badge" | "points";
  endsAt: string;
}

export interface AdminAchievementEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  timeAgo: string;
  type: AchievementType;
  xpGained?: number;
}

export interface AdminContributionMonth {
  month: string;
  resolved: number;
  escalations: number;
  evidence: number;
}

export interface AdminRankInfo {
  level: number;
  title: string;
  icon: string;
  color: string;
  minXP: number;
  maxXP: number | null;
}

export interface AdminAchievementProfile {
  portal: AdminPortalType;
  name: string;
  designation: string;
  employeeId: string;
  currentRank: AdminRankInfo;
  totalXP: number;
  nextRankXP: number;
  totalPoints: number;
  reputationScore: number;
  streak: number;
  rankPosition: number;
  badges: AdminBadge[];
  challenges: AdminChallenge[];
  timeline: AdminAchievementEvent[];
  monthlyContribution: AdminContributionMonth[];
  impactStats: { label: string; value: string | number; icon: string }[];
}

// ─── Rank System ──────────────────────────────────────────────────────────────

export const DISTRICT_RANKS: AdminRankInfo[] = [
  { level: 1, title: "Field Officer",       icon: "shield",        color: "#22C55E", minXP: 0,     maxXP: 999   },
  { level: 2, title: "Senior Officer",      icon: "star",          color: "#3B82F6", minXP: 1000,  maxXP: 2999  },
  { level: 3, title: "District Champion",   icon: "award",         color: "#F59E0B", minXP: 3000,  maxXP: 6999  },
  { level: 4, title: "District Commander",  icon: "trophy",        color: "#8B5CF6", minXP: 7000,  maxXP: null  },
];

export const SUBDISTRICT_RANKS: AdminRankInfo[] = [
  { level: 1, title: "Field Operative",     icon: "shield",        color: "#22C55E", minXP: 0,     maxXP: 999   },
  { level: 2, title: "Zone Officer",        icon: "zap",           color: "#F59E0B", minXP: 1000,  maxXP: 2999  },
  { level: 3, title: "Zone Champion",       icon: "award",         color: "#3B82F6", minXP: 3000,  maxXP: 6999  },
  { level: 4, title: "Zone Commander",      icon: "trophy",        color: "#8B5CF6", minXP: 7000,  maxXP: null  },
];

function getRankForXP(xp: number, ranks: AdminRankInfo[]): AdminRankInfo {
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (xp >= ranks[i].minXP) return ranks[i];
  }
  return ranks[0];
}

function getNextRankXP(xp: number, ranks: AdminRankInfo[]): number {
  const current = getRankForXP(xp, ranks);
  const next = ranks.find(r => r.level === current.level + 1);
  return next?.minXP ?? current.minXP + 5000;
}

// ─── Scoring constants ────────────────────────────────────────────────────────

export const DISTRICT_XP_RULES: Record<string, number> = {
  complaint_resolved:        50,
  escalation_closed:         80,
  escalation_assigned:       20,
  evidence_verified:         30,
  sla_achieved:              40,
  governance_processed:      60,
  budget_approved:           70,
  complaint_rejected:       -10,
  streak_daily:              10,
  streak_weekly:            100,
  streak_monthly:           500,
};

export const SUBDISTRICT_XP_RULES: Record<string, number> = {
  complaint_resolved:        50,
  ticket_completed:          40,
  evidence_submitted:        25,
  sla_maintained:            35,
  escalation_handled:        60,
  resolution_approved:       45,
  field_inspection:          20,
  streak_daily:              10,
  streak_weekly:            100,
  streak_monthly:           500,
};

// ─── Seed data — District Admin ───────────────────────────────────────────────

const DISTRICT_PROFILE: AdminAchievementProfile = {
  portal: "district",
  name: "District Administrator",
  designation: "District Collector",
  employeeId: "DA-2026-DCO",
  totalXP: 3420,
  nextRankXP: 6999,
  totalPoints: 6840,
  reputationScore: 88,
  streak: 14,
  rankPosition: 3,
  get currentRank() { return getRankForXP(this.totalXP, DISTRICT_RANKS); },
  badges: [
    { id: "db1", name: "Resolution Master",    description: "100+ complaints resolved",     icon: "check-circle",  rarity: "epic",      unlocked: true,  progress: 100, total: 100, unlockedAt: "3 days ago"   },
    { id: "db2", name: "SLA Guardian",         description: "90%+ SLA compliance",          icon: "shield-check",  rarity: "rare",      unlocked: true,  progress: 92,  total: 100, unlockedAt: "1 week ago"   },
    { id: "db3", name: "Escalation Closer",    description: "50 escalations resolved",      icon: "award",         rarity: "rare",      unlocked: true,  progress: 50,  total: 50,  unlockedAt: "2 weeks ago"  },
    { id: "db4", name: "Evidence Verifier",    description: "200 evidence verified",        icon: "camera",        rarity: "legendary", unlocked: false, progress: 148, total: 200                             },
    { id: "db5", name: "Budget Champion",      description: "10 budgets approved",          icon: "trophy",        rarity: "epic",      unlocked: false, progress: 7,   total: 10                              },
    { id: "db6", name: "Streak Master",        description: "30-day contribution streak",   icon: "flame",         rarity: "rare",      unlocked: false, progress: 14,  total: 30                              },
    { id: "db7", name: "Governance Pro",       description: "20 governance requests done",  icon: "landmark",      rarity: "common",    unlocked: true,  progress: 20,  total: 20,  unlockedAt: "1 month ago"  },
    { id: "db8", name: "Commander",            description: "Reach District Commander rank",icon: "shield",        rarity: "legendary", unlocked: false, progress: 3420, total: 7000                           },
  ],
  challenges: [
    { id: "dc1", title: "Resolve 10 critical complaints this week",  description: "Clear critical backlog",  progress: 6,  total: 10, reward: 400,  rewardType: "xp",     endsAt: "5d 12h" },
    { id: "dc2", title: "Approve 3 pending governance requests",     description: "Process governance queue",progress: 1,  total: 3,  reward: 300,  rewardType: "points", endsAt: "7d 00h" },
    { id: "dc3", title: "Maintain 14-day streak",                    description: "Daily login + action",    progress: 14, total: 14, reward: 500,  rewardType: "xp",     endsAt: "Ongoing"},
    { id: "dc4", title: "Close 5 SLA-breached escalations",         description: "Clear SLA backlog",       progress: 2,  total: 5,  reward: 600,  rewardType: "xp",     endsAt: "3d 06h" },
  ],
  timeline: [
    { id: "dt1", title: "Reached District Champion Rank",           description: "Crossed 3,000 XP milestone.",                 icon: "trophy",       timeAgo: "Today",       type: "rank",      xpGained: 200 },
    { id: "dt2", title: "Escalation Closer Badge Earned",           description: "Resolved 50th escalation in record time.",    icon: "award",        timeAgo: "2 days ago",  type: "badge",     xpGained: 100 },
    { id: "dt3", title: "14-Day Streak Achieved",                   description: "Consistent contributions for 2 weeks.",       icon: "flame",        timeAgo: "Today",       type: "streak",    xpGained: 100 },
    { id: "dt4", title: "Governance Pro Badge Earned",              description: "Processed 20th governance request.",          icon: "landmark",     timeAgo: "1 month ago", type: "badge",     xpGained: 80  },
    { id: "dt5", title: "+400 XP — Complaint Batch Resolved",       description: "8 high-priority complaints closed.",          icon: "check-circle", timeAgo: "3 days ago",  type: "points",    xpGained: 400 },
    { id: "dt6", title: "SLA Guardian Badge Unlocked",              description: "Maintained 92% SLA compliance this month.",   icon: "shield-check", timeAgo: "1 week ago",  type: "badge",     xpGained: 120 },
  ],
  monthlyContribution: [
    { month: "Jan", resolved: 42, escalations: 8,  evidence: 15 },
    { month: "Feb", resolved: 58, escalations: 11, evidence: 22 },
    { month: "Mar", resolved: 71, escalations: 14, evidence: 28 },
    { month: "Apr", resolved: 63, escalations: 9,  evidence: 19 },
    { month: "May", resolved: 88, escalations: 16, evidence: 34 },
    { month: "Jun", resolved: 94, escalations: 18, evidence: 38 },
  ],
  impactStats: [
    { label: "Complaints Resolved",    value: 416,   icon: "check-circle"  },
    { label: "Escalations Closed",     value: 76,    icon: "shield"        },
    { label: "Evidence Verified",      value: 148,   icon: "camera"        },
    { label: "SLA Compliance",         value: "92%", icon: "shield-check"  },
    { label: "Budget Approvals",       value: 7,     icon: "trophy"        },
    { label: "Governance Actions",     value: 20,    icon: "landmark"      },
  ],
};

// ─── Seed data — Sub-District Admin ──────────────────────────────────────────

const SUBDISTRICT_PROFILE: AdminAchievementProfile = {
  portal: "sub-district",
  name: "R. Sharma",
  designation: "Sub-District Officer",
  employeeId: "SDA-2026-PNV",
  totalXP: 2180,
  nextRankXP: 2999,
  totalPoints: 4360,
  reputationScore: 84,
  streak: 18,
  rankPosition: 1,
  get currentRank() { return getRankForXP(this.totalXP, SUBDISTRICT_RANKS); },
  badges: [
    { id: "sb1", name: "Ticket Champion",       description: "100+ tickets completed",       icon: "check-circle",  rarity: "epic",      unlocked: true,  progress: 100, total: 100, unlockedAt: "1 week ago"   },
    { id: "sb2", name: "Field Expert",          description: "50 field inspections done",    icon: "shield",        rarity: "rare",      unlocked: true,  progress: 50,  total: 50,  unlockedAt: "3 days ago"   },
    { id: "sb3", name: "Evidence Pro",          description: "75 evidence submissions",      icon: "camera",        rarity: "common",    unlocked: true,  progress: 75,  total: 75,  unlockedAt: "2 weeks ago"  },
    { id: "sb4", name: "SLA Defender",          description: "95%+ SLA score for 30 days",  icon: "shield-check",  rarity: "legendary", unlocked: false, progress: 18,  total: 30                              },
    { id: "sb5", name: "Streak Master",         description: "30-day contribution streak",   icon: "flame",         rarity: "rare",      unlocked: false, progress: 18,  total: 30                              },
    { id: "sb6", name: "Resolution King",       description: "200 complaints resolved",      icon: "trophy",        rarity: "legendary", unlocked: false, progress: 142, total: 200                             },
    { id: "sb7", name: "Escalation Handler",    description: "25 escalations managed",      icon: "zap",           rarity: "epic",      unlocked: false, progress: 12,  total: 25                              },
    { id: "sb8", name: "Zone Commander",        description: "Reach Zone Commander rank",    icon: "award",         rarity: "legendary", unlocked: false, progress: 2180, total: 7000                           },
  ],
  challenges: [
    { id: "sc1", title: "Complete 15 tickets this week",           description: "Clear ticket backlog",      progress: 9,  total: 15, reward: 300,  rewardType: "xp",     endsAt: "4d 08h" },
    { id: "sc2", title: "Submit evidence for 5 complaints",        description: "Document resolutions",      progress: 3,  total: 5,  reward: 200,  rewardType: "points", endsAt: "6d 12h" },
    { id: "sc3", title: "Maintain 18-day streak",                  description: "Daily login + action",      progress: 18, total: 18, reward: 500,  rewardType: "xp",     endsAt: "Ongoing"},
    { id: "sc4", title: "Resolve 8 SLA-at-risk complaints",        description: "SLA rescue mission",        progress: 3,  total: 8,  reward: 450,  rewardType: "xp",     endsAt: "2d 18h" },
  ],
  timeline: [
    { id: "st1", title: "18-Day Streak — Personal Best!",          description: "Longest streak achieved.",                    icon: "flame",        timeAgo: "Today",       type: "streak",    xpGained: 500 },
    { id: "st2", title: "Ticket Champion Badge Earned",            description: "100th ticket completed ahead of schedule.",   icon: "check-circle", timeAgo: "1 week ago",  type: "badge",     xpGained: 150 },
    { id: "st3", title: "Field Expert Badge Unlocked",             description: "Completed 50 field inspections.",             icon: "shield",       timeAgo: "3 days ago",  type: "badge",     xpGained: 120 },
    { id: "st4", title: "+350 XP — Ticket Batch Resolved",         description: "7 tickets closed today.",                     icon: "zap",          timeAgo: "2 days ago",  type: "points",    xpGained: 350 },
    { id: "st5", title: "Zone Champion Rank Achieved",             description: "Crossed 1,000 XP milestone.",                icon: "award",        timeAgo: "2 weeks ago", type: "rank",      xpGained: 200 },
    { id: "st6", title: "Evidence Pro Badge Earned",               description: "75 evidence submissions verified.",           icon: "camera",       timeAgo: "2 weeks ago", type: "badge",     xpGained: 80  },
  ],
  monthlyContribution: [
    { month: "Jan", resolved: 24, escalations: 3,  evidence: 18 },
    { month: "Feb", resolved: 31, escalations: 5,  evidence: 24 },
    { month: "Mar", resolved: 38, escalations: 6,  evidence: 30 },
    { month: "Apr", resolved: 29, escalations: 4,  evidence: 21 },
    { month: "May", resolved: 44, escalations: 7,  evidence: 36 },
    { month: "Jun", resolved: 48, escalations: 8,  evidence: 39 },
  ],
  impactStats: [
    { label: "Tickets Completed",      value: 142,   icon: "check-circle"  },
    { label: "Complaints Resolved",    value: 214,   icon: "shield"        },
    { label: "Evidence Submitted",     value: 75,    icon: "camera"        },
    { label: "Field Inspections",      value: 50,    icon: "shield-check"  },
    { label: "Escalations Handled",    value: 12,    icon: "zap"           },
    { label: "SLA Score",              value: "87%", icon: "trophy"        },
  ],
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface AchievementState {
  district:    AdminAchievementProfile;
  subDistrict: AdminAchievementProfile;
  addXP:      (portal: AdminPortalType, action: string, xp: number) => void;
  unlockBadge:(portal: AdminPortalType, badgeId: string) => void;
  addEvent:   (portal: AdminPortalType, event: Omit<AdminAchievementEvent, "id">) => void;
  recomputeFromStores: () => void;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      district:    { ...DISTRICT_PROFILE },
      subDistrict: { ...SUBDISTRICT_PROFILE },

      addXP: (portal, action, xp) => {
        const key = portal === "district" ? "district" : "subDistrict";
        const profile = get()[key];
        const newXP = profile.totalXP + xp;
        const ranks = portal === "district" ? DISTRICT_RANKS : SUBDISTRICT_RANKS;
        const newRank = getRankForXP(newXP, ranks);
        const newNextXP = getNextRankXP(newXP, ranks);
        set({
          [key]: {
            ...profile,
            totalXP: newXP,
            totalPoints: profile.totalPoints + xp,
            currentRank: newRank,
            nextRankXP: newNextXP,
          },
        });
      },

      unlockBadge: (portal, badgeId) => {
        const key = portal === "district" ? "district" : "subDistrict";
        const profile = get()[key];
        set({
          [key]: {
            ...profile,
            badges: profile.badges.map(b =>
              b.id === badgeId
                ? { ...b, unlocked: true, unlockedAt: "Just now", progress: b.total ?? b.progress }
                : b
            ),
          },
        });
      },

      addEvent: (portal, event) => {
        const key = portal === "district" ? "district" : "subDistrict";
        const profile = get()[key];
        const id = `${key}-ev-${Date.now()}`;
        set({
          [key]: {
            ...profile,
            timeline: [{ ...event, id }, ...profile.timeline].slice(0, 20),
          },
        });
      },

      recomputeFromStores: () => {
        recomputeAchievementsFromStores(get, set);
      },
    }),
    { name: "reckoning-achievements" }
  )
);

export { getRankForXP, getNextRankXP };

// ─── Recompute helper (avoids circular deps by lazy access) ───────────────────

function recomputeAchievementsFromStores(
  get: () => AchievementState,
  set: (partial: Partial<AchievementState>) => void
): void {
  // Lazy imports — these modules are already loaded by the time this runs
  const { useComplaintStore } = require("@/store/complaintStore") as { useComplaintStore: { getState: () => { complaints: { status: string; slaStatus: string }[] } } };
  const { useEscalationStore } = require("@/store/escalationStore") as { useEscalationStore: { getState: () => { escalations: { status: string; slaStatus: string; tier: string }[] } } };
  const { useEvidenceStore } = require("@/store/evidenceStore") as { useEvidenceStore: { getState: () => { records: { status: string; uploadedBy: string }[] } } };
  const { useBudgetApprovalStore } = require("@/store/budgetApprovalStore") as { useBudgetApprovalStore: { getState: () => { requests: { status: string }[] } } };
  const { useGovernanceRequestStore } = require("@/store/governanceRequestStore") as { useGovernanceRequestStore: { getState: () => { requests: { status: string }[] } } };
  const { useComplaintWorkflowStore } = require("@/store/complaintWorkflowStore") as { useComplaintWorkflowStore: { getState: () => { tickets: { status: string }[] } } };

  const complaints = useComplaintStore.getState().complaints;
  const escalations = useEscalationStore.getState().escalations;
  const evidence = useEvidenceStore.getState().records;
  const budgets = useBudgetApprovalStore.getState().requests;
  const governance = useGovernanceRequestStore.getState().requests;
  const tickets = useComplaintWorkflowStore.getState().tickets;

  // ─── District challenges ──────────────────────
  const distProfile = get().district;
  const resolvedComplaints = complaints.filter((c) => c.status === "Resolved").length;
  const escalationsClosed = escalations.filter((e) => e.status === "Resolved" || e.status === "Closed").length;
  const budgetsApproved = budgets.filter((b) => b.status === "Approved").length;
  const govApproved = governance.filter((g) => g.status === "Approved").length;
  const evVerified = evidence.filter((e) => e.status === "Approved").length;
  const slaBreachedClosed = escalations.filter((e) =>
    e.slaStatus === "Breached" && (e.status === "Resolved" || e.status === "Closed")
  ).length;

  const distChallenges: AdminChallenge[] = [
    { id: "dc1", title: "Resolve 10 critical complaints this week",  description: "Clear critical backlog",  progress: Math.min(10, resolvedComplaints), total: 10, reward: 400,  rewardType: "xp",     endsAt: "5d 12h" },
    { id: "dc2", title: "Approve 3 pending governance requests",     description: "Process governance queue", progress: Math.min(3, govApproved), total: 3,  reward: 300,  rewardType: "points", endsAt: "7d 00h" },
    { id: "dc3", title: "Maintain 14-day streak",                    description: "Daily login + action",    progress: distProfile.streak, total: 14, reward: 500,  rewardType: "xp",     endsAt: "Ongoing"},
    { id: "dc4", title: "Close 5 SLA-breached escalations",         description: "Clear SLA backlog",       progress: Math.min(5, slaBreachedClosed), total: 5,  reward: 600,  rewardType: "xp",     endsAt: "3d 06h" },
  ];

  const distImpactStats = [
    { label: "Complaints Resolved",    value: resolvedComplaints,  icon: "check-circle"  },
    { label: "Escalations Closed",     value: escalationsClosed,   icon: "shield"        },
    { label: "Evidence Verified",      value: evVerified,          icon: "camera"        },
    { label: "SLA Compliance",         value: `${escalations.length > 0 ? Math.round((escalations.filter((e) => e.slaStatus === "On Track").length / escalations.length) * 100) : 0}%`, icon: "shield-check" },
    { label: "Budget Approvals",       value: budgetsApproved,     icon: "trophy"        },
    { label: "Governance Actions",     value: govApproved,         icon: "landmark"      },
  ];

  // ─── Sub-district challenges ──────────────────
  const subProfile = get().subDistrict;
  const ticketsCompleted = tickets.filter((t) => t.status === "Completed").length;
  const subComplaintsResolved = complaints.filter((c) => c.status === "Resolved").length;
  const subEvidenceSubmitted = evidence.filter((e) => e.uploadedBy.includes("Sub-District")).length;
  const slaAtRiskResolved = complaints.filter((c) =>
    (c.slaStatus === "At Risk" || c.slaStatus === "Breached") && c.status === "Resolved"
  ).length;

  const subChallenges: AdminChallenge[] = [
    { id: "sc1", title: "Complete 15 tickets this week",           description: "Clear ticket backlog",      progress: Math.min(15, ticketsCompleted), total: 15, reward: 300,  rewardType: "xp",     endsAt: "4d 08h" },
    { id: "sc2", title: "Submit evidence for 5 complaints",        description: "Document resolutions",      progress: Math.min(5, subEvidenceSubmitted), total: 5,  reward: 200,  rewardType: "points", endsAt: "6d 12h" },
    { id: "sc3", title: "Maintain 18-day streak",                  description: "Daily login + action",      progress: subProfile.streak, total: 18, reward: 500,  rewardType: "xp",     endsAt: "Ongoing"},
    { id: "sc4", title: "Resolve 8 SLA-at-risk complaints",        description: "SLA rescue mission",        progress: Math.min(8, slaAtRiskResolved), total: 8,  reward: 450,  rewardType: "xp",     endsAt: "2d 18h" },
  ];

  const subImpactStats = [
    { label: "Tickets Completed",      value: ticketsCompleted,       icon: "check-circle"  },
    { label: "Complaints Resolved",    value: subComplaintsResolved,  icon: "shield"        },
    { label: "Evidence Submitted",     value: subEvidenceSubmitted,   icon: "camera"        },
    { label: "Field Inspections",      value: tickets.filter((t) => t.status !== "Open").length, icon: "shield-check"  },
    { label: "Escalations Handled",    value: escalations.filter((e) => e.tier === "district" && (e.status === "Resolved" || e.status === "Closed")).length, icon: "zap" },
    { label: "SLA Score",              value: `${complaints.length > 0 ? Math.round((complaints.filter((c) => c.slaStatus === "On Track").length / complaints.length) * 100) : 0}%`, icon: "trophy" },
  ];

  set({
    district: { ...distProfile, challenges: distChallenges, impactStats: distImpactStats },
    subDistrict: { ...subProfile, challenges: subChallenges, impactStats: subImpactStats },
  } as Partial<AchievementState>);
}

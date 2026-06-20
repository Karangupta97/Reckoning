/**
 * leaderboardStore.ts
 *
 * Frontend-only leaderboard data for District Admin and Sub-District Admin portals.
 * Rankings are derived from live store data (complaints, escalations, evidence, budgets, governance).
 * Persisted to localStorage. Completely isolated from Citizen and Super Admin data.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useGovernanceRequestStore } from "@/store/governanceRequestStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";

// ─── District Admin Officer Entry ─────────────────────────────────────────────

export interface DistrictOfficerEntry {
  rank: number;
  prevRank: number;
  name: string;
  designation: string;
  district: string;
  casesResolved: number;
  escalationsClosed: number;
  slaScore: number;         // 0–100
  resolutionSpeedDays: number;
  evidenceVerified: number;
  governanceScore: number;  // 0–100
  points: number;
  pointsDeltaWeek: number;
  trend: "up" | "down" | "stable";
  avatarColor: string;
  initial: string;
  isCurrentUser: boolean;
}

// ─── Sub-District Officer Entry ───────────────────────────────────────────────

export interface SubDistrictOfficerEntry {
  rank: number;
  prevRank: number;
  name: string;
  team: string;
  subDistrict: string;
  ticketsCompleted: number;
  complaintsResolved: number;
  slaScore: number;         // 0–100
  fieldInspections: number;
  resolutionSpeedDays: number;
  evidenceSubmissions: number;
  points: number;
  pointsDeltaWeek: number;
  trend: "up" | "down" | "stable";
  avatarColor: string;
  initial: string;
  isCurrentUser: boolean;
}

// ─── Colour palette ────────────────────────────────────────────────────────────

const COLORS = [
  "#14b8a6", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981",
  "#ef4444", "#f97316", "#06b6d4", "#ec4899", "#22c55e",
  "#a855f7", "#0ea5e9", "#84cc16", "#e879f9", "#4ade80",
  "#fb923c", "#34d399", "#60a5fa", "#f43f5e", "#6366f1",
];
function col(i: number) { return COLORS[i % COLORS.length]; }
function ini(name: string) { return name.charAt(0).toUpperCase(); }

// ─── District Admin leaderboard — names & metadata ───────────────────────────

const DISTRICT_NAMES = [
  "R. Sharma",    "A. Singh",     "S. Gupta",     "P. Iyer",    "M. Khan",
  "T. Verma",     "K. Patil",     "D. Nair",      "J. Mishra",  "V. Rao",
  "H. Desai",     "N. Joshi",     "B. Chavan",    "L. Sinha",   "G. Mehta",
  "O. Pandey",    "F. Ansari",    "C. Reddy",     "W. Thomas",  "Y. Patel",
];
const DESIGNATIONS = [
  "District Collector", "Deputy Collector", "District Engineer",
  "Operations Head", "SLA Director", "Governance Lead",
  "Resolution Manager", "Field Coordinator", "QA Head", "Compliance Officer",
];
const DISTRICT_LABELS = [
  "Raigad", "Pune", "Nashik", "Nagpur", "Thane",
  "Aurangabad", "Kolhapur", "Solapur", "Jalgaon", "Amravati",
];

// ─── Sub-District Admin leaderboard — names & metadata ───────────────────────

const SUBDISTRICT_NAMES = [
  "R. Sharma",    "P. Nair",      "A. Kulkarni",  "M. Patil",   "S. Desai",
  "V. Joshi",     "K. Bhosale",   "D. Waghmare",  "N. More",    "B. Salve",
  "L. Gaikwad",   "O. Shinde",    "F. Jadhav",    "H. Mane",    "C. Pawar",
  "W. Deshpande", "Y. Sawant",    "G. Kale",      "T. Kamble",  "I. Naik",
];
const TEAMS = [
  "Alpha Team", "Bravo Team", "Charlie Team", "Delta Team",
  "Echo Team",  "Foxtrot Team","Golf Team",    "Hotel Team",
];
const SUBDISTRICT_LABELS = [
  "Panvel", "Andheri", "Bandra", "Kurla", "Mulund",
  "Borivali", "Malad", "Goregaon", "Chembur", "Wadala",
];

// ─── Live metric computation ──────────────────────────────────────────────────

/**
 * Compute district leaderboard from live store data.
 * The "current user" (K. Patil) gets metrics derived from actual store state.
 * Other officers get base metrics offset by rank position for realistic distribution.
 */
function computeDistrictLeaderboard(): DistrictOfficerEntry[] {
  // Pull live metrics for current user from stores
  const escalations = useEscalationStore.getState().escalations;
  const evidence = useEvidenceStore.getState().records;
  const budgets = useBudgetApprovalStore.getState().requests;
  const governance = useGovernanceRequestStore.getState().requests;
  const complaints = useComplaintStore.getState().complaints;

  // Current user live metrics
  const resolvedComplaints = complaints.filter(c => c.status === "Resolved").length;
  const escalationsClosed = escalations.filter(e => e.status === "Resolved" || e.status === "Closed").length;
  const evidenceVerified = evidence.filter(e => e.status === "Approved").length;
  const slaOnTrack = escalations.filter(e => e.slaStatus === "On Track").length;
  const totalEsc = escalations.length;
  const slaScore = totalEsc > 0 ? Math.round((slaOnTrack / totalEsc) * 100) : 75;
  const budgetsApproved = budgets.filter(b => b.status === "Approved").length;
  const govApproved = governance.filter(g => g.status === "Approved").length;
  const totalGov = governance.length;
  const governanceScore = totalGov > 0 ? Math.round((govApproved / totalGov) * 100) : 70;

  // Current user points formula
  const currentUserPoints =
    resolvedComplaints * 50 +
    escalationsClosed * 80 +
    evidenceVerified * 30 +
    budgetsApproved * 70 +
    govApproved * 60 +
    slaScore * 5;

  // Generate all officers with base metrics
  const officers = DISTRICT_NAMES.map((name, i) => {
    const isCurrentUser = name === "K. Patil";

    if (isCurrentUser) {
      return {
        name,
        designation: DESIGNATIONS[i % DESIGNATIONS.length],
        district: DISTRICT_LABELS[i % DISTRICT_LABELS.length],
        casesResolved: resolvedComplaints,
        escalationsClosed,
        slaScore,
        resolutionSpeedDays: parseFloat((1.5 + Math.random() * 0.5).toFixed(1)),
        evidenceVerified,
        governanceScore,
        points: currentUserPoints,
        pointsDeltaWeek: Math.floor(currentUserPoints * 0.08),
        avatarColor: col(i),
        initial: ini(name),
        isCurrentUser: true,
      };
    }

    // Other officers — spread around with slight variance
    const base = Math.max(10, 280 - i * 13 + (i % 6) * 4);
    const pts = base * 12 + Math.floor(base * 0.3) * (20 - i);
    return {
      name,
      designation: DESIGNATIONS[i % DESIGNATIONS.length],
      district: DISTRICT_LABELS[i % DISTRICT_LABELS.length],
      casesResolved: base,
      escalationsClosed: Math.floor(base * 0.12),
      slaScore: Math.min(99, Math.max(52, 99 - i * 2 + (i % 4))),
      resolutionSpeedDays: parseFloat((1.2 + i * 0.08 + (i % 3) * 0.05).toFixed(1)),
      evidenceVerified: Math.floor(base * 0.6),
      governanceScore: Math.min(99, Math.max(55, 97 - i * 2 + (i % 5))),
      points: pts,
      pointsDeltaWeek: Math.floor(pts * 0.05) + (i % 5) * 8,
      avatarColor: col(i),
      initial: ini(name),
      isCurrentUser: false,
    };
  });

  // Sort by points descending and assign ranks
  officers.sort((a, b) => b.points - a.points);

  return officers.map((o, i) => ({
    ...o,
    rank: i + 1,
    prevRank: Math.max(1, i + 1 + (i % 3 === 0 ? -1 : i % 4 === 0 ? 0 : 1)),
    trend: (o.pointsDeltaWeek > 50 ? "up" : o.pointsDeltaWeek > 20 ? "stable" : "down") as "up" | "down" | "stable",
  }));
}

/**
 * Compute sub-district leaderboard from live store data.
 * The "current user" (R. Sharma) gets metrics derived from actual store state.
 */
function computeSubDistrictLeaderboard(): SubDistrictOfficerEntry[] {
  // Pull live metrics for current user
  const complaints = useComplaintStore.getState().complaints;
  const tickets = useComplaintWorkflowStore.getState().tickets;
  const evidence = useEvidenceStore.getState().records;
  const escalations = useEscalationStore.getState().escalations;

  // Current user live metrics
  const complaintsResolved = complaints.filter(c => c.status === "Resolved").length;
  const ticketsCompleted = tickets.filter(t => t.status === "Completed").length;
  const evidenceSubmissions = evidence.filter(e => e.uploadedBy.includes("Sub-District")).length;
  const onTrackComplaints = complaints.filter(c => c.slaStatus === "On Track").length;
  const totalComplaints = complaints.length;
  const slaScore = totalComplaints > 0 ? Math.round((onTrackComplaints / totalComplaints) * 100) : 80;
  const fieldInspections = tickets.filter(t => t.status !== "Open").length;

  // Current user points formula
  const currentUserPoints =
    complaintsResolved * 50 +
    ticketsCompleted * 40 +
    evidenceSubmissions * 25 +
    slaScore * 4 +
    fieldInspections * 20;

  // Generate all officers
  const officers = SUBDISTRICT_NAMES.map((name, i) => {
    const isCurrentUser = name === "R. Sharma";

    if (isCurrentUser) {
      return {
        name,
        team: TEAMS[i % TEAMS.length],
        subDistrict: SUBDISTRICT_LABELS[i % SUBDISTRICT_LABELS.length],
        ticketsCompleted,
        complaintsResolved,
        slaScore,
        fieldInspections,
        resolutionSpeedDays: parseFloat((1.2 + Math.random() * 0.3).toFixed(1)),
        evidenceSubmissions,
        points: currentUserPoints,
        pointsDeltaWeek: Math.floor(currentUserPoints * 0.1),
        avatarColor: col(i + 5),
        initial: ini(name),
        isCurrentUser: true,
      };
    }

    // Other officers — spread with variance
    const base = Math.max(8, 120 - i * 5 + (i % 5) * 2);
    const pts = base * 10 + (20 - i) * 15;
    return {
      name,
      team: TEAMS[i % TEAMS.length],
      subDistrict: SUBDISTRICT_LABELS[i % SUBDISTRICT_LABELS.length],
      ticketsCompleted: base,
      complaintsResolved: Math.floor(base * 0.85),
      slaScore: Math.min(99, Math.max(50, 99 - i * 2 + (i % 5))),
      fieldInspections: Math.floor(base * 0.4),
      resolutionSpeedDays: parseFloat((1.0 + i * 0.07 + (i % 4) * 0.04).toFixed(1)),
      evidenceSubmissions: Math.floor(base * 0.7),
      points: pts,
      pointsDeltaWeek: Math.floor(pts * 0.06) + (i % 4) * 6,
      avatarColor: col(i + 5),
      initial: ini(name),
      isCurrentUser: false,
    };
  });

  // Sort by points descending and assign ranks
  officers.sort((a, b) => b.points - a.points);

  return officers.map((o, i) => ({
    ...o,
    rank: i + 1,
    prevRank: Math.max(1, i + 1 + (i % 3 === 0 ? -1 : i % 4 === 0 ? 0 : 1)),
    trend: (o.pointsDeltaWeek > 30 ? "up" : o.pointsDeltaWeek > 10 ? "stable" : "down") as "up" | "down" | "stable",
  }));
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface LeaderboardState {
  districtOfficers: DistrictOfficerEntry[];
  subDistrictOfficers: SubDistrictOfficerEntry[];
  recompute: () => void;
}

export const useLeaderboardStore = create<LeaderboardState>()(
  persist(
    (set) => ({
      districtOfficers: computeDistrictLeaderboard(),
      subDistrictOfficers: computeSubDistrictLeaderboard(),

      recompute: () => {
        set({
          districtOfficers: computeDistrictLeaderboard(),
          subDistrictOfficers: computeSubDistrictLeaderboard(),
        });
      },
    }),
    { name: "reckoning-leaderboard" }
  )
);

/**
 * Subscribe to changes in source stores and recompute leaderboard.
 * Returns an unsubscribe function to cleanup on unmount.
 */
export function initLeaderboardSync(): () => void {
  const unsubs: (() => void)[] = [];

  unsubs.push(useComplaintStore.subscribe(() => {
    useLeaderboardStore.getState().recompute();
  }));
  unsubs.push(useEscalationStore.subscribe(() => {
    useLeaderboardStore.getState().recompute();
  }));
  unsubs.push(useEvidenceStore.subscribe(() => {
    useLeaderboardStore.getState().recompute();
  }));
  unsubs.push(useBudgetApprovalStore.subscribe(() => {
    useLeaderboardStore.getState().recompute();
  }));
  unsubs.push(useComplaintWorkflowStore.subscribe(() => {
    useLeaderboardStore.getState().recompute();
  }));

  return () => { unsubs.forEach((fn) => fn()); };
}

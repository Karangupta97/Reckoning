"use client";

import { useMemo } from "react";
import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useGovernanceRequestStore } from "@/store/governanceRequestStore";
import { useLeaderboardStore } from "@/store/leaderboardStore";
import { useDateRangeStore } from "@/store/dateRangeStore";
import {
  filterComplaintsByPeriod,
  filterEscalationsByPeriod,
  filterEvidenceByPeriod,
  filterBudgetsByPeriod,
  filterGovernanceByPeriod,
} from "@/lib/governance/record-filters";
import { RAIGAD_SUB_DISTRICTS } from "@/lib/governance/district-structure";
import { parseRecordDate } from "@/lib/governance/date-range";
import {
  filterSubDistrictComplaints,
  filterSubDistrictEscalations,
  filterDistrictEscalations,
  countOpenComplaints,
  countResolvedComplaints,
} from "@/lib/dashboard-metrics";

// ─── Chart data derivation ────────────────────────────────────────────────────

export interface TrendDataPoint {
  month: string;
  complaints: number;
  resolved: number;
}

export interface ResolutionBreakdown {
  name: string;
  value: number;
}

export interface SubDistrictScore {
  sub: string;
  score: number;
}

export interface FundUtilization {
  district: string;
  requested: number;
  approved: number;
  released: number;
}

export interface ExecutiveInsight {
  label: string;
  value: string;
  severity: "info" | "warning" | "danger" | "success";
}

// ─── District Analytics Hook ──────────────────────────────────────────────────

export function useDistrictAnalyticsMetrics() {
  const period = useDateRangeStore((s) => s.period);
  const complaints = useComplaintStore((s) => s.complaints);
  const escalations = useEscalationStore((s) => s.escalations);
  const evidence = useEvidenceStore((s) => s.records);
  const budgets = useBudgetApprovalStore((s) => s.requests);
  const governance = useGovernanceRequestStore((s) => s.requests);
  const tickets = useComplaintWorkflowStore((s) => s.tickets);

  return useMemo(() => {
    const complaintsScoped = filterComplaintsByPeriod(complaints, period);
    const escalationsScoped = filterDistrictEscalations(
      filterEscalationsByPeriod(escalations, period)
    );
    const evidenceScoped = filterEvidenceByPeriod(evidence, period);
    const budgetsScoped = filterBudgetsByPeriod(budgets, period);
    const governanceScoped = filterGovernanceByPeriod(governance, period);

    const resolved = countResolvedComplaints(complaintsScoped);
    const total = complaintsScoped.length;
    const open = countOpenComplaints(complaintsScoped);

    // KPI metrics
    const escalationsReceived = escalationsScoped.length;
    const escalationsClosed = escalationsScoped.filter(
      (e) => e.status === "Resolved" || e.status === "Closed"
    ).length;
    const activeEsc = escalationsScoped.filter(
      (e) => e.status !== "Resolved" && e.status !== "Closed"
    );
    const onTrackEsc = activeEsc.filter((e) => e.slaStatus === "On Track").length;
    const slaCompliance = activeEsc.length > 0
      ? Math.round((onTrackEsc / activeEsc.length) * 100)
      : 100;
    const evidenceReviewed = evidenceScoped.filter((e) => e.status === "Approved").length;
    const budgetSubmitted = budgetsScoped.length;
    const budgetApproved = budgetsScoped.filter((b) => b.status === "Approved").length;
    const budgetApprovalRate = budgetSubmitted > 0
      ? Math.round((budgetApproved / budgetSubmitted) * 100)
      : 0;
    const govSubmitted = governanceScoped.length;
    const govApproved = governanceScoped.filter((g) => g.status === "Approved").length;
    const govApprovalRate = govSubmitted > 0
      ? Math.round((govApproved / govSubmitted) * 100)
      : 0;

    // Avg resolution time (simulated from SLA hours)
    const resolvedComplaints = complaintsScoped.filter((c) => c.status === "Resolved");
    const avgResolutionDays = resolvedComplaints.length > 0
      ? (resolvedComplaints.reduce((sum, c) => sum + c.slaTargetHours, 0) / resolvedComplaints.length / 24).toFixed(1)
      : "0";

    // Resolution rate percentage
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Escalation rate
    const escalationRate = total > 0
      ? ((complaintsScoped.filter((c) => c.status === "Escalated").length / total) * 100).toFixed(1)
      : "0";

    const trendData: TrendDataPoint[] = generateTrendFromComplaints(complaintsScoped);

    // Resolution breakdown (percentage-based)
    const inProgress = complaintsScoped.filter((c) => c.status === "In Progress" || c.status === "Assigned").length;
    const escalated = complaintsScoped.filter((c) => c.status === "Escalated").length;
    const overdue = complaintsScoped.filter((c) => c.slaStatus === "Breached" && c.status !== "Resolved").length;
    const resolvedPct = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
    const escalatedPct = total > 0 ? Math.round((escalated / total) * 100) : 0;
    const overduePct = total > 0 ? Math.round((overdue / total) * 100) : 0;

    const resolutionBreakdown: ResolutionBreakdown[] = [
      { name: "Resolved", value: resolvedPct },
      { name: "In Progress", value: inProgressPct },
      { name: "Escalated", value: escalatedPct },
      { name: "Overdue", value: overduePct },
    ];

    // Sub-district performance scores
    const subDistrictScores = computeSubDistrictScores(complaintsScoped, escalationsScoped);

    return {
      // KPIs
      avgResolutionDays,
      slaCompliance,
      escalationRate,
      resolutionRate,
      escalationsReceived,
      escalationsClosed,
      evidenceReviewed,
      budgetSubmitted,
      budgetApprovalRate,
      govSubmitted,
      govApprovalRate,
      totalComplaints: total,
      openComplaints: open,
      resolvedComplaints: resolved,
      // Chart data
      trendData,
      resolutionBreakdown,
      resolutionTotal: total,
      resolvedCount: resolved,
      overdueCount: overdue,
      subDistrictScores,
      period,
    };
  }, [complaints, escalations, evidence, budgets, governance, tickets, period]);
}

// ─── Sub-District Analytics Hook ──────────────────────────────────────────────

export function useSubDistrictAnalyticsMetrics() {
  const period = useDateRangeStore((s) => s.period);
  const complaints = useComplaintStore((s) => s.complaints);
  const escalations = useEscalationStore((s) => s.escalations);
  const tickets = useComplaintWorkflowStore((s) => s.tickets);
  const evidence = useEvidenceStore((s) => s.records);

  return useMemo(() => {
    const subComplaints = filterSubDistrictComplaints(
      filterComplaintsByPeriod(complaints, period)
    );
    const subEscalations = filterSubDistrictEscalations(
      filterEscalationsByPeriod(escalations, period)
    );
    const evidenceScoped = filterEvidenceByPeriod(evidence, period);

    const total = subComplaints.length;
    const open = countOpenComplaints(subComplaints);
    const resolved = countResolvedComplaints(subComplaints);
    const ticketsCompleted = tickets.filter((t) => t.status === "Completed").length;
    const evidenceSubmitted = evidenceScoped.filter((e) =>
      e.uploadedBy.includes("Sub-District") || e.uploadedBy.includes("R.") || e.uploadedBy.includes("P.")
    ).length;
    const escalationsRaised = subEscalations.length;
    const avgResolutionDays = resolved > 0
      ? (subComplaints.filter((c) => c.status === "Resolved")
          .reduce((sum, c) => sum + c.slaTargetHours, 0) / resolved / 24).toFixed(1)
      : "0";

    const trendData: TrendDataPoint[] = generateTrendFromComplaints(subComplaints);

    return {
      totalComplaints: total,
      openComplaints: open,
      resolvedComplaints: resolved,
      avgResolutionDays,
      evidenceSubmitted,
      ticketsCompleted,
      escalationsRaised,
      trendData,
      period,
    };
  }, [complaints, escalations, tickets, evidence, period]);
}

export function useSuperAdminAnalyticsMetrics() {
  const period = useDateRangeStore((s) => s.period);
  const complaints = useComplaintStore((s) => s.complaints);
  const escalations = useEscalationStore((s) => s.escalations);
  const evidence = useEvidenceStore((s) => s.records);
  const budgets = useBudgetApprovalStore((s) => s.requests);
  const governance = useGovernanceRequestStore((s) => s.requests);
  const { districtOfficers } = useLeaderboardStore();

  return useMemo(() => {
    const complaintsScoped = filterComplaintsByPeriod(complaints, period);
    const escalationsScoped = filterEscalationsByPeriod(escalations, period);
    const evidenceScoped = filterEvidenceByPeriod(evidence, period);
    const budgetsScoped = filterBudgetsByPeriod(budgets, period);
    const governanceScoped = filterGovernanceByPeriod(governance, period);

    const totalComplaints = complaintsScoped.length;
    const activeEscalations = escalationsScoped.filter(
      (e) => e.status !== "Resolved" && e.status !== "Closed"
    ).length;
    const pendingEvidence = evidenceScoped.filter(
      (e) => e.status === "Pending Review" || e.status === "Additional Requested"
    ).length;
    const pendingBudgets = budgetsScoped.filter(
      (b) => b.status === "Pending Approval" || b.status === "Clarification Requested"
    ).length;
    const releasedFunds = budgetsScoped
      .filter((b) => b.releasedAmount)
      .reduce((sum, b) => sum + (b.releasedAmount ?? 0), 0);
    const govRequests = governanceScoped.length;
    const resolved = countResolvedComplaints(complaintsScoped);
    const resolutionRate = totalComplaints > 0
      ? Math.round((resolved / totalComplaints) * 100)
      : 0;
    const slaBreachCount = escalationsScoped.filter((e) => e.slaStatus === "Breached").length +
      complaintsScoped.filter((c) => c.slaStatus === "Breached").length;

    const fundUtilization: FundUtilization[] = computeFundUtilization(budgetsScoped);

    // Top performers from leaderboard
    const topDistricts = districtOfficers.slice(0, 5);

    // Executive insights
    const insights = computeExecutiveInsights(
      complaintsScoped,
      escalationsScoped,
      budgetsScoped,
      evidenceScoped
    );

    return {
      totalComplaints,
      activeEscalations,
      pendingEvidence,
      pendingBudgets,
      releasedFunds,
      govRequests,
      resolutionRate,
      slaBreachCount,
      fundUtilization,
      topDistricts,
      insights,
      period,
    };
  }, [complaints, escalations, evidence, budgets, governance, districtOfficers, period]);
}

// ─── Helper: Generate trend data from complaints ──────────────────────────────

function generateTrendFromComplaints(
  complaints: { status: string; date?: string; createdDate: string }[]
): TrendDataPoint[] {
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const buckets = new Map<string, { complaints: number; resolved: number }>();

  for (const c of complaints) {
    const parsed = parseRecordDate(c.date) ?? parseRecordDate(c.createdDate);
    if (!parsed) continue;
    const key = `${parsed.getFullYear()}-${parsed.getMonth()}`;
    const cur = buckets.get(key) ?? { complaints: 0, resolved: 0 };
    cur.complaints += 1;
    if (c.status === "Resolved") cur.resolved += 1;
    buckets.set(key, cur);
  }

  const now = new Date();
  const points: TrendDataPoint[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = buckets.get(key) ?? { complaints: 0, resolved: 0 };
    points.push({
      month: monthLabels[d.getMonth()],
      complaints: bucket.complaints,
      resolved: bucket.resolved,
    });
  }

  return points;
}

// ─── Helper: Compute sub-district performance scores ──────────────────────────

function computeSubDistrictScores(
  complaints: { subDistrict: string; status: string; slaStatus: string }[],
  escalations: { subDistrict: string; status: string }[]
): SubDistrictScore[] {
  return RAIGAD_SUB_DISTRICTS.map((sd) => {
    const taluka = sd.taluka;
    const short = sd.name;
    const subComplaints = complaints.filter(
      (c) => c.subDistrict === taluka || c.subDistrict.includes(short)
    );
    const subEsc = escalations.filter(
      (e) => e.subDistrict === short || e.subDistrict.includes(short)
    );
    const total = subComplaints.length;
    const resolved = subComplaints.filter((c) => c.status === "Resolved").length;
    const onTrack = subComplaints.filter((c) => c.slaStatus === "On Track").length;
    const openEsc = subEsc.filter((e) => e.status !== "Resolved" && e.status !== "Closed").length;

    const resRate = total > 0 ? resolved / total : 0;
    const slaRate = total > 0 ? onTrack / total : 0;
    const escPenalty = Math.min(15, openEsc * 2);
    const score = Math.round(resRate * 55 + slaRate * 35 + Math.max(0, 10 - escPenalty));

    return { sub: short, score: Math.min(100, Math.max(0, score)) };
  }).sort((a, b) => b.score - a.score);
}

// ─── Helper: Fund utilization per district ────────────────────────────────────

function computeFundUtilization(
  budgets: { district: string; requestedAmount: number; approvedAmount?: number; releasedAmount?: number }[]
): FundUtilization[] {
  const map = new Map<string, FundUtilization>();

  for (const b of budgets) {
    const cur = map.get(b.district) ?? { district: b.district, requested: 0, approved: 0, released: 0 };
    cur.requested += b.requestedAmount;
    cur.approved += b.approvedAmount ?? 0;
    cur.released += b.releasedAmount ?? 0;
    map.set(b.district, cur);
  }

  return [...map.values()].sort((a, b) => b.requested - a.requested);
}

// ─── Helper: Executive insights ───────────────────────────────────────────────

function computeExecutiveInsights(
  complaints: { subDistrict: string; status: string; slaStatus: string; priority: string }[],
  escalations: { subDistrict: string; status: string; slaStatus: string; priority: string }[],
  budgets: { status: string; requestedAmount: number }[],
  evidence: { status: string }[]
): ExecutiveInsight[] {
  const insights: ExecutiveInsight[] = [];

  // Highest risk zone (most breached SLA)
  const zoneBreach = new Map<string, number>();
  for (const c of complaints) {
    if (c.slaStatus === "Breached") {
      zoneBreach.set(c.subDistrict, (zoneBreach.get(c.subDistrict) ?? 0) + 1);
    }
  }
  const riskiestZone = [...zoneBreach.entries()].sort((a, b) => b[1] - a[1])[0];
  if (riskiestZone) {
    insights.push({
      label: "Highest Risk Zone",
      value: `${riskiestZone[0]} (${riskiestZone[1]} breaches)`,
      severity: "danger",
    });
  }

  // Most escalated zone
  const zoneEsc = new Map<string, number>();
  for (const e of escalations) {
    zoneEsc.set(e.subDistrict, (zoneEsc.get(e.subDistrict) ?? 0) + 1);
  }
  const mostEscalated = [...zoneEsc.entries()].sort((a, b) => b[1] - a[1])[0];
  if (mostEscalated) {
    insights.push({
      label: "Most Escalated Zone",
      value: `${mostEscalated[0]} (${mostEscalated[1]} escalations)`,
      severity: "warning",
    });
  }

  // Largest pending budget queue
  const pendingBudget = budgets.filter(
    (b) => b.status === "Pending Approval" || b.status === "Clarification Requested"
  );
  const pendingTotal = pendingBudget.reduce((s, b) => s + b.requestedAmount, 0);
  if (pendingBudget.length > 0) {
    insights.push({
      label: "Pending Budget Queue",
      value: `${pendingBudget.length} requests (₹${pendingTotal.toFixed(1)} Cr)`,
      severity: pendingBudget.length >= 3 ? "warning" : "info",
    });
  }

  // Evidence backlog
  const pendingEv = evidence.filter((e) => e.status === "Pending Review").length;
  if (pendingEv > 0) {
    insights.push({
      label: "Evidence Backlog",
      value: `${pendingEv} awaiting review`,
      severity: pendingEv >= 5 ? "danger" : "info",
    });
  }

  // Critical escalations
  const criticalEsc = escalations.filter(
    (e) => e.priority === "Critical" && e.status !== "Resolved" && e.status !== "Closed"
  ).length;
  if (criticalEsc > 0) {
    insights.push({
      label: "Critical Escalations",
      value: `${criticalEsc} active`,
      severity: "danger",
    });
  }

  // Resolution momentum
  const resolvedCount = complaints.filter((c) => c.status === "Resolved").length;
  const resRate = complaints.length > 0 ? Math.round((resolvedCount / complaints.length) * 100) : 0;
  insights.push({
    label: "Resolution Momentum",
    value: `${resRate}% resolved`,
    severity: resRate >= 50 ? "success" : resRate >= 30 ? "info" : "warning",
  });

  return insights;
}

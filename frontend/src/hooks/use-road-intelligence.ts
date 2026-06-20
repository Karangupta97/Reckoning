"use client";

import { useMemo } from "react";
import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { DISTRICT_CONFIG } from "@/lib/district-config";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DistrictRisk {
  district: string;
  state: string;
  complaints: number;
  escalations: number;
  breaches: number;
  riskScore: number;
  riskLevel: "Healthy" | "Watchlist" | "At Risk" | "Critical";
  affectedTalukas: string[];
}

export interface CorridorRisk {
  name: string;
  district: string;
  state: string;
  complaints: number;
  escalations: number;
  riskLevel: "Healthy" | "Watchlist" | "At Risk" | "Critical";
}

export interface HealthRanking {
  district: string;
  state: string;
  healthScore: number;
  status: "Excellent" | "Good" | "Watchlist" | "Critical";
  resolutionRate: number;
  slaCompliance: number;
  escalationRate: number;
}

export interface MonthlyTrend {
  month: string;
  complaints: number;
  escalations: number;
  resolved: number;
}

export interface ExecutiveInsight {
  label: string;
  value: string;
  severity: "info" | "warning" | "danger" | "success";
}

export interface AIAlert {
  corridor: string;
  state: string;
  reason: string;
  riskScore: number;
  priority: "High" | "Medium" | "Low";
  affectedTalukas: string[];
}

// ─── Frontend Taluka → District Mapping ───────────────────────────────────────
// This maps sub-district (taluka) names to their parent district + state.
// Only used for aggregation display at Super Admin level.
// Does NOT change any store data or workflow.

interface DistrictMapping {
  district: string;
  state: string;
}

const TALUKA_TO_DISTRICT: Record<string, DistrictMapping> = {
  // Raigad District talukas
  "Panvel":     { district: "Raigad", state: "Maharashtra" },
  "Panvel Taluka": { district: "Raigad", state: "Maharashtra" },
  "Karjat":     { district: "Raigad", state: "Maharashtra" },
  "Alibag":     { district: "Raigad", state: "Maharashtra" },
  "Mahad":      { district: "Raigad", state: "Maharashtra" },
  "Murud":      { district: "Raigad", state: "Maharashtra" },
  "Mangaon":    { district: "Raigad", state: "Maharashtra" },
  // Budget store districts (already at district level)
  "Mumbai City":     { district: "Mumbai City", state: "Maharashtra" },
  "Raigad District": { district: "Raigad", state: "Maharashtra" },
  "Bengaluru Urban": { district: "Bengaluru Urban", state: "Karnataka" },
  "Patna":           { district: "Patna", state: "Bihar" },
  "Chennai":         { district: "Chennai", state: "Tamil Nadu" },
  "Jaipur":          { district: "Jaipur", state: "Rajasthan" },
  "Lucknow":         { district: "Lucknow", state: "Uttar Pradesh" },
  "Kolkata":         { district: "Kolkata", state: "West Bengal" },
  "Pune":            { district: "Pune", state: "Maharashtra" },
};

/**
 * Resolve a subDistrict/district string to its parent district + state.
 * Falls back to the store's own district field if available.
 */
function resolveDistrict(subDistrict: string, storeDistrict?: string, storeState?: string): DistrictMapping {
  // Check direct mapping first
  const mapped = TALUKA_TO_DISTRICT[subDistrict];
  if (mapped) return mapped;

  // If store already has district-level data
  if (storeDistrict) {
    const distMapped = TALUKA_TO_DISTRICT[storeDistrict];
    if (distMapped) return distMapped;
    return { district: storeDistrict.replace(" District", ""), state: storeState ?? "Maharashtra" };
  }

  // Fallback: treat as the default district
  return { district: DISTRICT_CONFIG.name, state: DISTRICT_CONFIG.state };
}

// ─── Risk Scoring ─────────────────────────────────────────────────────────────

function computeRiskLevel(score: number): "Healthy" | "Watchlist" | "At Risk" | "Critical" {
  if (score >= 75) return "Critical";
  if (score >= 50) return "At Risk";
  if (score >= 25) return "Watchlist";
  return "Healthy";
}

function computeHealthStatus(score: number): "Excellent" | "Good" | "Watchlist" | "Critical" {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Watchlist";
  return "Critical";
}

// ─── Main Hook ────────────────────────────────────────────────────────────────

export function useRoadIntelligence() {
  const complaints = useComplaintStore((s) => s.complaints);
  const escalations = useEscalationStore((s) => s.escalations);
  const evidence = useEvidenceStore((s) => s.records);
  const budgets = useBudgetApprovalStore((s) => s.requests);

  return useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    const critical = complaints.filter((c) => c.priority === "Critical").length;
    const breached = complaints.filter((c) => c.slaStatus === "Breached").length;
    const atRisk = complaints.filter((c) => c.slaStatus === "At Risk").length;
    const onTrack = complaints.filter((c) => c.slaStatus === "On Track").length;
    const escBreached = escalations.filter((e) => e.slaStatus === "Breached").length;

    // ─── Road Conditions KPIs ───────────────────────
    const healthyPct = total > 0 ? Math.round((onTrack / total) * 100) : 100;
    const needsAttentionPct = total > 0 ? Math.round((atRisk / total) * 100) : 0;
    const criticalPct = total > 0 ? Math.round((breached / total) * 100) : 0;

    // ─── Risk Distribution (pie) ────────────────────
    const riskDistribution = [
      { name: "Healthy", value: Math.max(0, total - atRisk - breached - critical), color: "#22c55e" },
      { name: "Watchlist", value: atRisk, color: "#f59e0b" },
      { name: "At Risk", value: breached, color: "#f97316" },
      { name: "Critical", value: critical, color: "#ef4444" },
    ];

    // ─── District-Level Aggregation ─────────────────
    // Aggregate complaints and escalations up to DISTRICT level
    const distAgg = new Map<string, { state: string; complaints: number; escalations: number; breaches: number; talukas: Set<string> }>();

    for (const c of complaints) {
      const { district, state } = resolveDistrict(c.subDistrict);
      const cur = distAgg.get(district) ?? { state, complaints: 0, escalations: 0, breaches: 0, talukas: new Set<string>() };
      cur.complaints++;
      if (c.slaStatus === "Breached") cur.breaches++;
      cur.talukas.add(c.subDistrict);
      distAgg.set(district, cur);
    }
    for (const e of escalations) {
      const { district, state } = resolveDistrict(e.subDistrict, e.district, e.state);
      const cur = distAgg.get(district) ?? { state, complaints: 0, escalations: 0, breaches: 0, talukas: new Set<string>() };
      cur.escalations++;
      if (e.slaStatus === "Breached") cur.breaches++;
      cur.talukas.add(e.subDistrict);
      distAgg.set(district, cur);
    }

    // Also add budget districts that may not have complaints
    for (const b of budgets) {
      const { district, state } = resolveDistrict(b.district, b.district, b.state);
      if (!distAgg.has(district)) {
        distAgg.set(district, { state, complaints: 0, escalations: 0, breaches: 0, talukas: new Set<string>() });
      }
    }

    const districtRisks: DistrictRisk[] = [...distAgg.entries()]
      .map(([district, data]) => {
        const riskScore = Math.min(100, data.complaints * 5 + data.escalations * 12 + data.breaches * 20);
        return {
          district,
          state: data.state,
          complaints: data.complaints,
          escalations: data.escalations,
          breaches: data.breaches,
          riskScore,
          riskLevel: computeRiskLevel(riskScore),
          affectedTalukas: [...data.talukas],
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);

    // ─── Critical Corridors (road-level) ────────────
    const locationMap = new Map<string, { district: string; state: string; complaints: number; escalations: number }>();
    for (const c of complaints) {
      const { district, state } = resolveDistrict(c.subDistrict);
      const loc = c.location || c.title;
      const key = loc.length > 35 ? loc.slice(0, 35) : loc;
      const cur = locationMap.get(key) ?? { district, state, complaints: 0, escalations: 0 };
      cur.complaints++;
      locationMap.set(key, cur);
    }
    for (const e of escalations) {
      const { district, state } = resolveDistrict(e.subDistrict, e.district, e.state);
      const key = e.title.length > 35 ? e.title.slice(0, 35) : e.title;
      const cur = locationMap.get(key) ?? { district, state, complaints: 0, escalations: 0 };
      cur.escalations++;
      locationMap.set(key, cur);
    }

    const corridors: CorridorRisk[] = [...locationMap.entries()]
      .map(([name, data]) => {
        const score = data.complaints * 8 + data.escalations * 15;
        return { name, ...data, riskLevel: computeRiskLevel(score) };
      })
      .sort((a, b) => (b.complaints + b.escalations * 2) - (a.complaints + a.escalations * 2))
      .slice(0, 8);

    // ─── Traffic (Governance Activity) KPIs ─────────
    const complaintVolume = total;
    const escalationVolume = escalations.length;
    const resolutionVelocity = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const avgResponseHours = complaints.length > 0
      ? Math.round(complaints.reduce((s, c) => s + Math.abs(c.slaHours), 0) / complaints.length)
      : 0;

    // ─── Monthly Trends ─────────────────────────────
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const trends: MonthlyTrend[] = months.map((month, i) => {
      const factor = 0.5 + (i / months.length) * 0.7;
      return {
        month,
        complaints: Math.max(1, Math.round((total / months.length) * factor) + (i % 3)),
        escalations: Math.max(0, Math.round((escalations.length / months.length) * factor)),
        resolved: Math.max(1, Math.round((resolved / months.length) * factor * 0.9)),
      };
    });

    // ─── Infrastructure Health Score ────────────────
    const resolutionRate = total > 0 ? (resolved / total) * 100 : 100;
    const slaCompliance = total > 0 ? (onTrack / total) * 100 : 100;
    const escalationRate = total > 0 ? (escalations.length / total) * 100 : 0;
    const budgetApproved = budgets.filter((b) => b.status === "Approved").length;
    const budgetTotal = budgets.length;
    const budgetUtilization = budgetTotal > 0 ? (budgetApproved / budgetTotal) * 100 : 0;

    const infrastructureHealthScore = Math.round(
      resolutionRate * 0.4 +
      slaCompliance * 0.3 +
      (100 - Math.min(escalationRate, 100)) * 0.2 +
      budgetUtilization * 0.1
    );

    // ─── Health Rankings by District ────────────────
    const healthRankings: HealthRanking[] = [...distAgg.entries()]
      .map(([district, data]) => {
        const dTotal = data.complaints;
        const dResolved = complaints.filter((c) => {
          const { district: cd } = resolveDistrict(c.subDistrict);
          return cd === district && c.status === "Resolved";
        }).length;
        const dOnTrack = complaints.filter((c) => {
          const { district: cd } = resolveDistrict(c.subDistrict);
          return cd === district && c.slaStatus === "On Track";
        }).length;
        const dRes = dTotal > 0 ? Math.round((dResolved / dTotal) * 100) : 100;
        const dSla = dTotal > 0 ? Math.round((dOnTrack / dTotal) * 100) : 100;
        const dEsc = dTotal > 0 ? Math.round((data.escalations / dTotal) * 100) : 0;
        const score = Math.round(dRes * 0.4 + dSla * 0.3 + (100 - Math.min(dEsc, 100)) * 0.2 + 50 * 0.1);
        return {
          district,
          state: data.state,
          healthScore: Math.min(100, Math.max(0, score)),
          status: computeHealthStatus(score),
          resolutionRate: dRes,
          slaCompliance: dSla,
          escalationRate: dEsc,
        };
      })
      .sort((a, b) => b.healthScore - a.healthScore);

    // ─── Budget Efficiency ──────────────────────────
    const totalRequested = budgets.reduce((s, b) => s + b.requestedAmount, 0);
    const totalApproved = budgets.reduce((s, b) => s + (b.approvedAmount ?? 0), 0);
    const totalReleased = budgets.reduce((s, b) => s + (b.releasedAmount ?? 0), 0);
    const issuesResolved = resolved;

    // ─── Executive Insights ─────────────────────────
    const insights: ExecutiveInsight[] = [];
    const highestRisk = districtRisks[0];
    if (highestRisk && highestRisk.riskScore > 0) {
      insights.push({ label: "Highest Risk District", value: `${highestRisk.district}, ${highestRisk.state} (Score: ${highestRisk.riskScore})`, severity: "danger" });
    }
    const bestPerformer = healthRankings[0];
    if (bestPerformer) {
      insights.push({ label: "Best Performing District", value: `${bestPerformer.district}, ${bestPerformer.state} (${bestPerformer.healthScore}/100)`, severity: "success" });
    }
    const totalBreaches = breached + escBreached;
    if (totalBreaches > 0) {
      insights.push({ label: "SLA Breaches Active", value: `${totalBreaches} across system`, severity: "danger" });
    }
    const pendingBudget = budgets.filter((b) => b.status === "Pending Approval");
    if (pendingBudget.length > 0) {
      const pendingTotal = pendingBudget.reduce((s, b) => s + b.requestedAmount, 0);
      insights.push({ label: "Pending Budget Queue", value: `${pendingBudget.length} requests (₹${pendingTotal.toFixed(1)} Cr)`, severity: "warning" });
    }
    insights.push({ label: "Resolution Momentum", value: `${resolutionVelocity}% resolved`, severity: resolutionVelocity >= 50 ? "success" : "warning" });
    insights.push({ label: "Infrastructure Health", value: `${infrastructureHealthScore}/100`, severity: infrastructureHealthScore >= 70 ? "success" : infrastructureHealthScore >= 50 ? "info" : "danger" });

    // ─── AI Alerts (rule-based, district-level) ─────
    const aiAlerts: AIAlert[] = districtRisks
      .filter((d) => d.riskScore >= 40)
      .slice(0, 5)
      .map((d) => ({
        corridor: d.district,
        state: d.state,
        reason: `${d.complaints} complaints, ${d.escalations} escalations, ${d.breaches} SLA breaches`,
        riskScore: d.riskScore,
        priority: d.riskScore >= 75 ? "High" as const : d.riskScore >= 50 ? "Medium" as const : "Low" as const,
        affectedTalukas: d.affectedTalukas,
      }));

    return {
      // Road Conditions
      roadsMonitored: total,
      healthyPct,
      needsAttentionPct,
      criticalPct,
      riskDistribution,
      corridors,
      districtRisks,
      // Traffic / Governance Activity
      complaintVolume,
      escalationVolume,
      resolutionVelocity,
      avgResponseHours,
      trends,
      // Infrastructure Health
      infrastructureHealthScore,
      healthRankings,
      resolutionRate: Math.round(resolutionRate),
      slaCompliance: Math.round(slaCompliance),
      escalationRatePct: Math.round(escalationRate),
      budgetUtilization: Math.round(budgetUtilization),
      totalRequested,
      totalApproved,
      totalReleased,
      issuesResolved,
      // Executive
      insights,
      aiAlerts,
    };
  }, [complaints, escalations, evidence, budgets]);
}

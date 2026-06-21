"use client";

import { useMemo } from "react";
import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useDateRangeStore } from "@/store/dateRangeStore";
import {
  filterComplaintsByPeriod,
  filterEscalationsByPeriod,
  filterEvidenceByPeriod,
} from "@/lib/governance/record-filters";
import {
  countActiveTickets,
  countCriticalEscalations,
  countDistrictOpenEscalations,
  countEscalatedCases,
  countEvidencePendingReview,
  countIncomingEscalations,
  countOpenComplaints,
  countOpenTickets,
  countOverdueTickets,
  countPendingResolutions,
  countResolvedComplaints,
  countSlaWarnings,
  districtSlaCompliance,
  filterSubDistrictComplaints,
  filterSubDistrictEscalations,
  officerWorkload,
  recentResolutions,
  slaBuckets,
  upcomingSlaBreaches,
  urgentComplaints,
  workloadStats,
  zoneHealthScore,
} from "@/lib/dashboard-metrics";

export function useSubDistrictDashboardMetrics() {
  const period = useDateRangeStore((s) => s.period);
  const complaints = useComplaintStore((s) => s.complaints);
  const escalations = useEscalationStore((s) => s.escalations);
  const tickets = useComplaintWorkflowStore((s) => s.tickets);
  const resolutions = useComplaintWorkflowStore((s) => s.resolutions);

  return useMemo(() => {
    const scopedComplaints = filterSubDistrictComplaints(
      filterComplaintsByPeriod(complaints, period)
    );
    const subEscalations = filterSubDistrictEscalations(
      filterEscalationsByPeriod(escalations, period)
    );
    const open = countOpenComplaints(scopedComplaints);
    const escalated = countEscalatedCases(scopedComplaints, subEscalations);
    const pendingResolutions = countPendingResolutions(resolutions);
    const slaWarning = countSlaWarnings(scopedComplaints, subEscalations);
    const sla = slaBuckets(scopedComplaints);
    const activeTickets = countActiveTickets(tickets);
    const workload = workloadStats(scopedComplaints, resolutions);

    return {
      complaints: scopedComplaints,
      open,
      escalated,
      pendingResolutions,
      slaWarning,
      sla,
      activeTickets,
      openTickets: countOpenTickets(tickets),
      overdueTickets: countOverdueTickets(tickets),
      resolved: countResolvedComplaints(scopedComplaints),
      workload,
      zoneHealth: zoneHealthScore(scopedComplaints),
      urgent: urgentComplaints(scopedComplaints),
      upcomingSla: upcomingSlaBreaches(scopedComplaints),
      recentResolved: recentResolutions(scopedComplaints),
      officers: officerWorkload(scopedComplaints),
      totalComplaints: scopedComplaints.length,
      period,
    };
  }, [complaints, escalations, tickets, resolutions, period]);
}

export function useDistrictDashboardMetrics() {
  const period = useDateRangeStore((s) => s.period);
  const complaints = useComplaintStore((s) => s.complaints);
  const escalations = useEscalationStore((s) => s.escalations);
  const tickets = useComplaintWorkflowStore((s) => s.tickets);
  const resolutions = useComplaintWorkflowStore((s) => s.resolutions);
  const evidence = useEvidenceStore((s) => s.records);

  return useMemo(() => {
    const filteredComplaints = filterComplaintsByPeriod(complaints, period);
    const filteredEscalations = filterEscalationsByPeriod(escalations, period);
    const filteredEvidence = filterEvidenceByPeriod(evidence, period);

    const incomingEscalations = countIncomingEscalations(filteredEscalations);
    const openEscalations = countDistrictOpenEscalations(filteredEscalations);
    const resolutionRequests = countPendingResolutions(resolutions);
    const newTickets = countOpenTickets(tickets);
    const evidenceReviews = countEvidencePendingReview(filteredEvidence);

    return {
      totalComplaints: filteredComplaints.length,
      openComplaints: countOpenComplaints(filteredComplaints),
      resolvedComplaints: countResolvedComplaints(filteredComplaints),
      escalatedCases: openEscalations,
      incomingEscalations,
      resolutionRequests,
      newTickets,
      evidenceReviews,
      criticalEscalations: countCriticalEscalations(filteredEscalations),
      slaCompliance: districtSlaCompliance(filteredEscalations, filteredComplaints),
      period,
    };
  }, [complaints, escalations, tickets, resolutions, evidence, period]);
}

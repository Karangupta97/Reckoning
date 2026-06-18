"use client";

import { useMemo } from "react";
import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";
import { useEvidenceStore } from "@/store/evidenceStore";
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
  const complaints = useComplaintStore((s) => s.complaints);
  const escalations = useEscalationStore((s) => s.escalations);
  const tickets = useComplaintWorkflowStore((s) => s.tickets);
  const resolutions = useComplaintWorkflowStore((s) => s.resolutions);

  return useMemo(() => {
    const subComplaints = filterSubDistrictComplaints(complaints);
    const subEscalations = filterSubDistrictEscalations(escalations);
    const open = countOpenComplaints(subComplaints);
    const escalated = countEscalatedCases(subComplaints, subEscalations);
    const pendingResolutions = countPendingResolutions(resolutions);
    const slaWarning = countSlaWarnings(subComplaints, subEscalations);
    const sla = slaBuckets(subComplaints);
    const activeTickets = countActiveTickets(tickets);
    const workload = workloadStats(subComplaints, resolutions);

    return {
      complaints: subComplaints,
      open,
      escalated,
      pendingResolutions,
      slaWarning,
      sla,
      activeTickets,
      openTickets: countOpenTickets(tickets),
      overdueTickets: countOverdueTickets(tickets),
      resolved: countResolvedComplaints(subComplaints),
      workload,
      zoneHealth: zoneHealthScore(subComplaints),
      urgent: urgentComplaints(subComplaints),
      upcomingSla: upcomingSlaBreaches(subComplaints),
      recentResolved: recentResolutions(subComplaints),
      officers: officerWorkload(subComplaints),
      totalComplaints: subComplaints.length,
    };
  }, [complaints, escalations, tickets, resolutions]);
}

export function useDistrictDashboardMetrics() {
  const complaints = useComplaintStore((s) => s.complaints);
  const escalations = useEscalationStore((s) => s.escalations);
  const tickets = useComplaintWorkflowStore((s) => s.tickets);
  const resolutions = useComplaintWorkflowStore((s) => s.resolutions);
  const evidence = useEvidenceStore((s) => s.records);

  return useMemo(() => {
    const incomingEscalations = countIncomingEscalations(escalations);
    const openEscalations = countDistrictOpenEscalations(escalations);
    const resolutionRequests = countPendingResolutions(resolutions);
    const newTickets = countOpenTickets(tickets);
    const evidenceReviews = countEvidencePendingReview(evidence);

    return {
      totalComplaints: complaints.length,
      openComplaints: countOpenComplaints(complaints),
      resolvedComplaints: countResolvedComplaints(complaints),
      escalatedCases: openEscalations,
      incomingEscalations,
      resolutionRequests,
      newTickets,
      evidenceReviews,
      criticalEscalations: countCriticalEscalations(escalations),
      slaCompliance: districtSlaCompliance(escalations, complaints),
    };
  }, [complaints, escalations, tickets, resolutions, evidence]);
}

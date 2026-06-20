/**
 * case-traceability.ts
 *
 * Shared helpers to build Related Records and Case Journey data
 * from live store state. Used by complaint detail, escalation detail,
 * evidence detail, and budget detail pages.
 *
 * Constructs full accountability chain: CMP → ESC → EV → BUD → RES → CLOSED
 */

import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";
import type { RelatedRecord } from "@/components/admin/RelatedRecordsPanel";
import type { CaseJourneyStep } from "@/components/admin/CaseJourneyTimeline";

type Portal = "district" | "sub-district" | "super";

function escRoute(id: string, portal: Portal): string {
  if (portal === "super") return `/super-admin/complaints/escalated-cases/${id}`;
  return `/district-admin/dashboard/escalation/${id}`;
}
function budRoute(_id: string, portal: Portal): string {
  if (portal === "super") return `/super-admin/governance/approvals/${_id}`;
  return `/district-admin/budget`;
}
function evRoute(_id: string, portal: Portal): string {
  if (portal === "super") return `/super-admin/evidence/${_id}`;
  return `/district-admin/evidence`;
}
function cmpRoute(id: string, portal: Portal): string {
  if (portal === "sub-district") return `/sub-district-admin/dashboard/complaints/${id}`;
  // District and Super don't open CMP routes directly — stay on current page
  return "#";
}

/**
 * Build all related records for a given complaint ID.
 */
export function getRelatedRecordsForComplaint(complaintId: string, portal: Portal): RelatedRecord[] {
  const records: RelatedRecord[] = [];
  const escalations = useEscalationStore.getState().escalations;
  const evidence = useEvidenceStore.getState().records;
  const budgets = useBudgetApprovalStore.getState().requests;
  const resolutions = useComplaintWorkflowStore.getState().resolutions;

  // Linked escalation
  const esc = escalations.find((e) => e.sourceComplaintId === complaintId);
  if (esc) {
    records.push({ id: esc.id, type: "escalation", label: esc.title, status: esc.status, href: escRoute(esc.id, portal) });

    // Evidence linked to escalation
    evidence.filter((ev) => ev.relatedEntityId === esc.id).forEach((ev) => {
      records.push({ id: ev.id, type: "evidence", label: ev.title, status: ev.status, href: evRoute(ev.id, portal) });
    });

    // Budgets linked to escalation
    budgets.filter((b) => b.linkedEscalationIds?.includes(esc.id)).forEach((b) => {
      records.push({ id: b.id, type: "budget", label: b.project, status: b.status, href: budRoute(b.id, portal) });
    });
  }

  // Evidence linked directly to complaint
  evidence.filter((ev) => ev.relatedEntityId === complaintId).forEach((ev) => {
    if (!records.find((r) => r.id === ev.id)) {
      records.push({ id: ev.id, type: "evidence", label: ev.title, status: ev.status, href: evRoute(ev.id, portal) });
    }
  });

  // Resolution
  const res = resolutions.find((r) => r.complaintId === complaintId);
  if (res) {
    records.push({ id: res.id, type: "resolution", label: `Resolution — ${res.status}`, status: res.status, href: cmpRoute(complaintId, portal) });
  }

  return records;
}

/**
 * Build all related records for a given escalation ID.
 */
export function getRelatedRecordsForEscalation(escId: string, portal: Portal): RelatedRecord[] {
  const records: RelatedRecord[] = [];
  const escalations = useEscalationStore.getState().escalations;
  const evidence = useEvidenceStore.getState().records;
  const budgets = useBudgetApprovalStore.getState().requests;
  const complaints = useComplaintStore.getState().complaints;
  const resolutions = useComplaintWorkflowStore.getState().resolutions;

  const esc = escalations.find((e) => e.id === escId);
  if (!esc) return records;

  // Source complaint
  if (esc.sourceComplaintId) {
    const cmp = complaints.find((c) => c.id === esc.sourceComplaintId);
    if (cmp) {
      records.push({ id: cmp.id, type: "complaint", label: cmp.title, status: cmp.status, href: cmpRoute(cmp.id, portal) });
    }

    // Resolution for source complaint
    const res = resolutions.find((r) => r.complaintId === esc.sourceComplaintId);
    if (res) {
      records.push({ id: res.id, type: "resolution", label: `Closure — ${res.status}`, status: res.status, href: cmpRoute(esc.sourceComplaintId, portal) });
    }
  }

  // Evidence linked to this escalation
  evidence.filter((ev) => ev.relatedEntityId === escId).forEach((ev) => {
    records.push({ id: ev.id, type: "evidence", label: ev.title, status: ev.status, href: evRoute(ev.id, portal) });
  });

  // Budgets linked to this escalation
  budgets.filter((b) => b.linkedEscalationIds?.includes(escId)).forEach((b) => {
    records.push({ id: b.id, type: "budget", label: b.project, status: b.status, href: budRoute(b.id, portal) });
  });

  return records;
}

/**
 * Build the complete case journey timeline for a complaint.
 */
export function buildCaseJourney(complaintId: string): CaseJourneyStep[] {
  const steps: CaseJourneyStep[] = [];
  const complaint = useComplaintStore.getState().getById(complaintId);
  const escalations = useEscalationStore.getState().escalations;
  const evidence = useEvidenceStore.getState().records;
  const budgets = useBudgetApprovalStore.getState().requests;
  const resolutions = useComplaintWorkflowStore.getState().resolutions;

  // Step 1: Complaint Created
  steps.push({
    label: "Complaint Created",
    entityId: complaintId,
    timestamp: complaint.createdDate,
    status: "completed",
    note: complaint.category,
  });

  // Step 2: Officer Assigned
  if (complaint.officer) {
    steps.push({
      label: "Officer Assigned",
      timestamp: complaint.officerAssignedDate,
      status: "completed",
      note: complaint.officer,
    });
  }

  // Step 3: Escalated
  const esc = escalations.find((e) => e.sourceComplaintId === complaintId);
  if (esc) {
    steps.push({
      label: "Escalated to District",
      entityId: esc.id,
      timestamp: esc.escalatedOn,
      status: "completed",
      note: `${esc.priority} priority — ${esc.category}`,
    });

    // Step 3b: Funding Requested (if flagged)
    if (esc.fundingRequired) {
      steps.push({
        label: "Funding Requested",
        entityId: esc.id,
        timestamp: esc.escalatedOn,
        status: "completed",
        note: `Est. ₹${esc.estimatedCost ?? "TBD"} Lakhs${esc.fundingReason ? ` — ${esc.fundingReason}` : ""}`,
      });
    }

    // Step 4: Evidence Submitted (for the escalation)
    const escEvidence = evidence.filter((ev) => ev.relatedEntityId === esc.id);
    if (escEvidence.length > 0) {
      steps.push({
        label: "Evidence Submitted",
        entityId: escEvidence[0].id,
        timestamp: escEvidence[0].uploadedAt,
        status: "completed",
        note: `${escEvidence.length} file${escEvidence.length > 1 ? "s" : ""} uploaded`,
      });
    }

    // Step 5: Budget Requested
    const linkedBudgets = budgets.filter((b) => b.linkedEscalationIds?.includes(esc.id));
    if (linkedBudgets.length > 0) {
      const bud = linkedBudgets[0];
      steps.push({
        label: "Budget Requested",
        entityId: bud.id,
        timestamp: bud.submittedOn,
        status: bud.status === "Approved" ? "completed" : bud.status === "Rejected" ? "completed" : "active",
        note: `₹${bud.requestedAmount} Cr — ${bud.status}`,
      });

      // Step 5b: Budget Approved
      if (bud.status === "Approved") {
        steps.push({
          label: "Budget Approved",
          entityId: bud.id,
          timestamp: bud.approvedDate,
          status: "completed",
          note: `₹${bud.approvedAmount ?? bud.requestedAmount} Cr approved`,
        });
      }

      // Step 5c: Funds Released
      if (bud.releasedAmount) {
        steps.push({
          label: "Funds Released",
          entityId: bud.id,
          timestamp: bud.releasedDate,
          status: "completed",
          note: `₹${bud.releasedAmount} Cr — ${bud.releaseStatus}`,
        });
      }
    }
  }

  // Step 6: Evidence for complaint directly
  const cmpEvidence = evidence.filter((ev) => ev.relatedEntityId === complaintId);
  if (cmpEvidence.length > 0 && !esc) {
    steps.push({
      label: "Evidence Submitted",
      entityId: cmpEvidence[0].id,
      timestamp: cmpEvidence[0].uploadedAt,
      status: "completed",
      note: `${cmpEvidence.length} file${cmpEvidence.length > 1 ? "s" : ""}`,
    });
  }

  // Step 7: Resolution
  const res = resolutions.find((r) => r.complaintId === complaintId);
  if (res) {
    // Resolution Evidence step (if before/after photos exist)
    if (res.beforePhotos?.length || res.afterPhotos?.length) {
      steps.push({
        label: "Resolution Evidence Submitted",
        entityId: res.id,
        timestamp: res.submittedAt,
        status: "completed",
        note: `${(res.beforePhotos?.length ?? 0) + (res.afterPhotos?.length ?? 0)} photos attached${res.estimatedWorkCost ? ` — ₹${res.estimatedWorkCost}` : ""}`,
      });
    }

    steps.push({
      label: "Resolution Submitted",
      entityId: res.id,
      timestamp: res.submittedAt,
      status: res.status === "Approved" ? "completed" : res.status === "Rejected" ? "completed" : "active",
      note: `${res.status}${res.submittedBy ? ` by ${res.submittedBy}` : ""}`,
    });

    if (res.status === "Approved") {
      steps.push({
        label: "Complaint Closed",
        timestamp: res.submittedAt,
        status: "completed",
        note: "Resolution approved — case closed",
      });
    }
  } else if (complaint.status === "Resolved") {
    steps.push({
      label: "Complaint Resolved",
      timestamp: complaint.updatedDate,
      status: "completed",
    });
  }

  // If complaint is still open, add pending step
  if (!["Resolved", "Rejected"].includes(complaint.status) && !res) {
    steps.push({
      label: "Awaiting Resolution",
      status: "pending",
    });
  }

  return steps;
}

/**
 * Build case journey for an escalation (from district perspective).
 */
export function buildEscalationJourney(escId: string): CaseJourneyStep[] {
  const escalations = useEscalationStore.getState().escalations;
  const esc = escalations.find((e) => e.id === escId);
  if (!esc) return [];

  // If escalation has a source complaint, build from complaint root
  if (esc.sourceComplaintId) {
    return buildCaseJourney(esc.sourceComplaintId);
  }

  // Standalone escalation journey
  const steps: CaseJourneyStep[] = [];
  const evidence = useEvidenceStore.getState().records;
  const budgets = useBudgetApprovalStore.getState().requests;

  steps.push({
    label: "Escalation Created",
    entityId: escId,
    timestamp: esc.escalatedOn,
    status: "completed",
    note: `${esc.priority} — ${esc.subDistrict}`,
  });

  if (esc.assignedTo && esc.assignedTo !== "Unassigned") {
    steps.push({ label: "Officer Assigned", status: "completed", note: esc.assignedTo });
  }

  const escEv = evidence.filter((ev) => ev.relatedEntityId === escId);
  if (escEv.length > 0) {
    steps.push({ label: "Evidence Submitted", entityId: escEv[0].id, timestamp: escEv[0].uploadedAt, status: "completed", note: `${escEv.length} files` });
  }

  const linked = budgets.filter((b) => b.linkedEscalationIds?.includes(escId));
  if (linked.length > 0) {
    steps.push({ label: "Budget Linked", entityId: linked[0].id, timestamp: linked[0].submittedOn, status: "completed", note: linked[0].project });
  }

  if (esc.status === "Resolved" || esc.status === "Closed") {
    steps.push({ label: "Escalation Closed", status: "completed", note: esc.status });
  } else {
    steps.push({ label: esc.status, status: "active" });
  }

  return steps;
}

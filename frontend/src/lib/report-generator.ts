/**
 * report-generator.ts — Generates printable reports and CSV exports from live store data.
 * Supports: District Report, Super Admin Executive Report, Case Report, Budget Audit, Evidence Report.
 */

import { exportToCsv } from "@/lib/csv-export";
import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useGovernanceRequestStore } from "@/store/governanceRequestStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";
import { useAuditLogStore } from "@/store/auditLogStore";

// ─── District Report Export (CSV) ─────────────────────────────────────────────

export function exportDistrictComplaintSummary() {
  const complaints = useComplaintStore.getState().complaints;
  exportToCsv("district_complaint_summary", complaints.map((c) => ({
    ID: c.id,
    Title: c.title,
    Category: c.category,
    Priority: c.priority,
    Status: c.status,
    Location: c.location,
    SubDistrict: c.subDistrict,
    SLAStatus: c.slaStatus,
    Officer: c.officer,
    CreatedDate: c.createdDate,
    UpdatedDate: c.updatedDate,
    ResolutionStatus: c.resolutionStatus,
  })));
}

export function exportDistrictEscalationSummary() {
  const escalations = useEscalationStore.getState().escalations;
  exportToCsv("district_escalation_summary", escalations.map((e) => ({
    ID: e.id,
    Title: e.title,
    SubDistrict: e.subDistrict,
    Category: e.category,
    Priority: e.priority,
    Status: e.status,
    SLAStatus: e.slaStatus,
    AssignedTo: e.assignedTo,
    EscalatedOn: e.escalatedOn,
    DaysOpen: e.daysOpen,
    Tier: e.tier ?? "district",
    SourceComplaint: e.sourceComplaintId ?? "—",
    FundingRequired: e.fundingRequired ? "YES" : "",
    EstimatedCost: e.estimatedCost ?? "",
    FundingReason: e.fundingReason ?? "",
  })));
}

export function exportDistrictEvidenceSummary() {
  const evidence = useEvidenceStore.getState().records;
  exportToCsv("district_evidence_summary", evidence.map((e) => ({
    ID: e.id,
    Title: e.title,
    RelatedEntity: e.relatedEntityId,
    EntityType: e.relatedEntityType,
    District: e.district,
    UploadedBy: e.uploadedBy,
    UploadedAt: e.uploadedAt,
    Status: e.status,
    FileCount: e.files.length,
  })));
}

export function exportDistrictBudgetSummary() {
  const budgets = useBudgetApprovalStore.getState().requests;
  exportToCsv("district_budget_summary", budgets.map((b) => ({
    ID: b.id,
    Project: b.project,
    District: b.district,
    RequestedAmount_Cr: b.requestedAmount,
    ApprovedAmount_Cr: b.approvedAmount ?? "—",
    ReleasedAmount_Cr: b.releasedAmount ?? "—",
    ReleaseStatus: b.releaseStatus ?? "—",
    Status: b.status,
    Priority: b.priority,
    RequestType: b.requestType,
    SubmittedOn: b.submittedOn,
    LinkedEscalations: b.linkedEscalationIds?.join(", ") ?? "—",
  })));
}

export function exportDistrictGovernanceSummary() {
  const governance = useGovernanceRequestStore.getState().requests;
  exportToCsv("district_governance_summary", governance.map((g) => ({
    ID: g.id,
    Title: g.title,
    Type: g.type,
    District: g.district,
    Status: g.status,
    SubmittedBy: g.submittedBy,
    SubmittedOn: g.submittedOn,
  })));
}

export function exportDistrictSLAMetrics() {
  const complaints = useComplaintStore.getState().complaints;
  const escalations = useEscalationStore.getState().escalations;
  const active = complaints.filter((c) => c.status !== "Resolved" && c.status !== "Rejected");
  const activeEsc = escalations.filter((e) => e.status !== "Resolved" && e.status !== "Closed");

  const rows = [
    { Metric: "Total Active Complaints", Value: active.length },
    { Metric: "Complaints On Track", Value: active.filter((c) => c.slaStatus === "On Track").length },
    { Metric: "Complaints At Risk", Value: active.filter((c) => c.slaStatus === "At Risk").length },
    { Metric: "Complaints Breached", Value: active.filter((c) => c.slaStatus === "Breached").length },
    { Metric: "Total Active Escalations", Value: activeEsc.length },
    { Metric: "Escalations On Track", Value: activeEsc.filter((e) => e.slaStatus === "On Track").length },
    { Metric: "Escalations At Risk", Value: activeEsc.filter((e) => e.slaStatus === "At Risk").length },
    { Metric: "Escalations Breached", Value: activeEsc.filter((e) => e.slaStatus === "Breached").length },
    { Metric: "SLA Compliance %", Value: active.length > 0 ? Math.round((active.filter((c) => c.slaStatus === "On Track").length / active.length) * 100) : 100 },
  ];
  exportToCsv("district_sla_metrics", rows);
}

export function exportDistrictResolutionMetrics() {
  const complaints = useComplaintStore.getState().complaints;
  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === "Resolved").length;
  const escalated = complaints.filter((c) => c.status === "Escalated").length;
  const rejected = complaints.filter((c) => c.status === "Rejected").length;

  const rows = [
    { Metric: "Total Complaints", Value: total },
    { Metric: "Resolved", Value: resolved },
    { Metric: "Escalated", Value: escalated },
    { Metric: "Rejected", Value: rejected },
    { Metric: "Resolution Rate %", Value: total > 0 ? Math.round((resolved / total) * 100) : 0 },
    { Metric: "Escalation Rate %", Value: total > 0 ? Math.round((escalated / total) * 100) : 0 },
  ];
  exportToCsv("district_resolution_metrics", rows);
}

// ─── Super Admin Executive Report ─────────────────────────────────────────────

export function exportSuperAdminExecutiveReport() {
  const complaints = useComplaintStore.getState().complaints;
  const escalations = useEscalationStore.getState().escalations;
  const evidence = useEvidenceStore.getState().records;
  const budgets = useBudgetApprovalStore.getState().requests;
  const governance = useGovernanceRequestStore.getState().requests;

  const resolved = complaints.filter((c) => c.status === "Resolved").length;
  const activeEsc = escalations.filter((e) => e.status !== "Resolved" && e.status !== "Closed").length;
  const pendingEvidence = evidence.filter((e) => e.status === "Pending Review").length;
  const releasedFunds = budgets.reduce((s, b) => s + (b.releasedAmount ?? 0), 0);
  const slaBreaches = escalations.filter((e) => e.slaStatus === "Breached").length + complaints.filter((c) => c.slaStatus === "Breached").length;

  const rows = [
    { Metric: "Total Complaints", Value: complaints.length },
    { Metric: "Active Escalations", Value: activeEsc },
    { Metric: "Budget Requests", Value: budgets.length },
    { Metric: "Released Funds (Cr)", Value: releasedFunds },
    { Metric: "Governance Requests", Value: governance.length },
    { Metric: "Resolution Rate %", Value: complaints.length > 0 ? Math.round((resolved / complaints.length) * 100) : 0 },
    { Metric: "SLA Compliance %", Value: escalations.length > 0 ? Math.round(((escalations.length - slaBreaches) / escalations.length) * 100) : 100 },
    { Metric: "Pending Evidence Reviews", Value: pendingEvidence },
    { Metric: "Budgets Approved", Value: budgets.filter((b) => b.status === "Approved").length },
    { Metric: "Budgets Rejected", Value: budgets.filter((b) => b.status === "Rejected").length },
    { Metric: "Governance Approved", Value: governance.filter((g) => g.status === "Approved").length },
  ];
  exportToCsv("super_admin_executive_report", rows);
}

// ─── Case Report (for a specific complaint) ──────────────────────────────────

export function exportCaseReport(complaintId: string) {
  const complaint = useComplaintStore.getState().getById(complaintId);
  const escalations = useEscalationStore.getState().escalations;
  const evidence = useEvidenceStore.getState().records;
  const budgets = useBudgetApprovalStore.getState().requests;
  const resolutions = useComplaintWorkflowStore.getState().resolutions;

  const linkedEsc = escalations.find((e) => e.sourceComplaintId === complaintId || e.id === complaint.escalationId);
  const linkedEv = evidence.filter((e) => e.relatedEntityId === complaintId || e.relatedEntityId === linkedEsc?.id);
  const linkedBud = budgets.filter((b) => b.linkedEscalationIds?.includes(linkedEsc?.id ?? ""));
  const linkedRes = resolutions.find((r) => r.complaintId === complaintId);

  const rows = [
    { Section: "COMPLAINT", Field: "ID", Value: complaint.id },
    { Section: "COMPLAINT", Field: "Title", Value: complaint.title },
    { Section: "COMPLAINT", Field: "Status", Value: complaint.status },
    { Section: "COMPLAINT", Field: "Priority", Value: complaint.priority },
    { Section: "COMPLAINT", Field: "SLA Status", Value: complaint.slaStatus },
    { Section: "COMPLAINT", Field: "Location", Value: complaint.location },
    { Section: "COMPLAINT", Field: "Officer", Value: complaint.officer },
    { Section: "COMPLAINT", Field: "Created", Value: complaint.createdDate },
    { Section: "COMPLAINT", Field: "Resolution Status", Value: complaint.resolutionStatus },
    ...(linkedEsc ? [
      { Section: "ESCALATION", Field: "ID", Value: linkedEsc.id },
      { Section: "ESCALATION", Field: "Status", Value: linkedEsc.status },
      { Section: "ESCALATION", Field: "Priority", Value: linkedEsc.priority },
      { Section: "ESCALATION", Field: "Assigned To", Value: linkedEsc.assignedTo },
      { Section: "ESCALATION", Field: "Escalated On", Value: linkedEsc.escalatedOn },
      { Section: "ESCALATION", Field: "Funding Required", Value: linkedEsc.fundingRequired ? "YES" : "NO" },
      ...(linkedEsc.fundingRequired ? [
        { Section: "ESCALATION", Field: "Estimated Cost", Value: `₹${linkedEsc.estimatedCost ?? "TBD"} Lakhs` },
        { Section: "ESCALATION", Field: "Funding Reason", Value: linkedEsc.fundingReason ?? "—" },
      ] : []),
    ] : []),
    ...linkedEv.map((ev) => ({
      Section: "EVIDENCE", Field: ev.id, Value: `${ev.title} — ${ev.status}`,
    })),
    ...linkedBud.map((b) => ({
      Section: "BUDGET", Field: b.id, Value: `₹${b.requestedAmount} Cr → ₹${b.approvedAmount ?? "Pending"} Cr — ${b.status} — Released: ₹${b.releasedAmount ?? 0} Cr`,
    })),
    ...(linkedRes ? [
      { Section: "RESOLUTION", Field: "ID", Value: linkedRes.id },
      { Section: "RESOLUTION", Field: "Status", Value: linkedRes.status },
      { Section: "RESOLUTION", Field: "Submitted By", Value: linkedRes.submittedBy },
      { Section: "RESOLUTION", Field: "Work Performed", Value: linkedRes.workPerformed },
      { Section: "RESOLUTION", Field: "Completion Date", Value: linkedRes.workCompletionDate ?? linkedRes.completionDate },
      { Section: "RESOLUTION", Field: "Estimated Work Cost", Value: linkedRes.estimatedWorkCost ?? linkedRes.costIncurred },
      { Section: "RESOLUTION", Field: "Completion Notes", Value: linkedRes.completionNotes ?? "—" },
      { Section: "RESOLUTION", Field: "Before Photos", Value: linkedRes.beforePhotos?.length ? `${linkedRes.beforePhotos.length} attached` : "None" },
      { Section: "RESOLUTION", Field: "After Photos", Value: linkedRes.afterPhotos?.length ? `${linkedRes.afterPhotos.length} attached` : "None" },
    ] : []),
  ];
  exportToCsv(`case_report_${complaintId}`, rows);
}

// ─── Budget Audit Report ──────────────────────────────────────────────────────

export function exportBudgetAuditReport(budgetId: string) {
  const budgets = useBudgetApprovalStore.getState().requests;
  const budget = budgets.find((b) => b.id === budgetId);
  if (!budget) return;

  const rows = [
    { Field: "Budget ID", Value: budget.id },
    { Field: "Project", Value: budget.project },
    { Field: "District", Value: budget.district },
    { Field: "Requested Amount (Cr)", Value: String(budget.requestedAmount) },
    { Field: "Approved Amount (Cr)", Value: String(budget.approvedAmount ?? "Pending") },
    { Field: "Released Amount (Cr)", Value: String(budget.releasedAmount ?? "Not Released") },
    { Field: "Difference (Cr)", Value: budget.approvedAmount ? String(budget.approvedAmount - budget.requestedAmount) : "—" },
    { Field: "Release Status", Value: budget.releaseStatus ?? "Pending Release" },
    { Field: "Status", Value: budget.status },
    { Field: "Submitted On", Value: budget.submittedOn },
    { Field: "Submitted By", Value: budget.submittedBy },
    { Field: "Approved By", Value: budget.approvedBy ?? "—" },
    { Field: "Approved Date", Value: budget.approvedDate ?? "—" },
    { Field: "Released Date", Value: budget.releasedDate ?? "—" },
    { Field: "Linked Escalations", Value: budget.linkedEscalationIds?.join(", ") ?? "None" },
    { Field: "---", Value: "--- APPROVAL HISTORY ---" },
    ...budget.approvalHistory.map((h, i) => ({
      Field: `History ${i + 1}`, Value: `[${h.time}] ${h.actor}: ${h.action}${h.amount ? ` — ₹${h.amount} Cr` : ""}${h.note ? ` | ${h.note}` : ""}`,
    })),
    { Field: "---", Value: "--- AUDIT TRAIL ---" },
    ...budget.auditTrail.map((a, i) => ({
      Field: `Audit ${i + 1}`, Value: `[${a.time}] ${a.actor}: ${a.event}${a.detail ? ` — ${a.detail}` : ""}`,
    })),
  ];
  exportToCsv(`budget_audit_${budgetId}`, rows);
}

// ─── Evidence Report ──────────────────────────────────────────────────────────

export function exportEvidenceReport(evidenceId: string) {
  const evidence = useEvidenceStore.getState().records;
  const ev = evidence.find((e) => e.id === evidenceId);
  if (!ev) return;

  const rows = [
    { Field: "Evidence ID", Value: ev.id },
    { Field: "Title", Value: ev.title },
    { Field: "Related Entity", Value: ev.relatedEntityId },
    { Field: "Entity Type", Value: ev.relatedEntityType },
    { Field: "District", Value: ev.district },
    { Field: "Uploaded By", Value: ev.uploadedBy },
    { Field: "Uploaded At", Value: ev.uploadedAt },
    { Field: "Status", Value: ev.status },
    { Field: "Files", Value: ev.files.map((f) => `${f.label} (${f.size})`).join("; ") },
    { Field: "---", Value: "--- TIMELINE ---" },
    ...ev.timeline.map((t, i) => ({
      Field: `Step ${i + 1}`, Value: `${t.label} — ${t.date}${t.done ? " ✓" : ""} ${t.note}`,
    })),
    { Field: "---", Value: "--- ACTIVITY LOG ---" },
    ...ev.activityLog.map((a, i) => ({
      Field: `Log ${i + 1}`, Value: `[${a.time}] ${a.actor}: ${a.action}`,
    })),
  ];
  exportToCsv(`evidence_report_${evidenceId}`, rows);
}

// ─── Audit Log Export ─────────────────────────────────────────────────────────

export function exportAuditLog(filters?: { category?: string; entityType?: string }) {
  let entries = useAuditLogStore.getState().entries;

  if (filters?.category) {
    entries = entries.filter((e) => e.category === filters.category);
  }
  if (filters?.entityType) {
    entries = entries.filter((e) => e.entityId.startsWith(filters.entityType!));
  }

  exportToCsv("audit_log_export", entries.map((e) => ({
    ID: e.id,
    Timestamp: e.timestamp,
    UserRole: e.userRole,
    Actor: e.actor,
    Action: e.action,
    EntityID: e.entityId,
    PreviousStatus: e.previousStatus,
    NewStatus: e.newStatus,
    Category: e.category,
    IP: e.ip ?? "—",
  })));
}

// ─── Print Report Utility ─────────────────────────────────────────────────────

export function printReport(title: string, sections: { heading: string; rows: { label: string; value: string }[] }[]) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
        h2 { font-size: 14px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
        th, td { text-align: left; padding: 6px 10px; border: 1px solid #e0e0e0; }
        th { background: #f5f5f5; font-weight: 600; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">Generated: ${new Date().toLocaleString()} • Reckoning Platform</div>
      ${sections.map((s) => `
        <h2>${s.heading}</h2>
        <table>
          <tbody>
            ${s.rows.map((r) => `<tr><th>${r.label}</th><td>${r.value}</td></tr>`).join("")}
          </tbody>
        </table>
      `).join("")}
    </body>
    </html>
  `;
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.print();
  }
}

// ─── Printable Case Report ────────────────────────────────────────────────────

export function printCaseReport(complaintId: string) {
  const complaint = useComplaintStore.getState().getById(complaintId);
  const escalations = useEscalationStore.getState().escalations;
  const evidence = useEvidenceStore.getState().records;
  const budgets = useBudgetApprovalStore.getState().requests;
  const resolutions = useComplaintWorkflowStore.getState().resolutions;

  const linkedEsc = escalations.find((e) => e.sourceComplaintId === complaintId || e.id === complaint.escalationId);
  const linkedEv = evidence.filter((e) => e.relatedEntityId === complaintId || e.relatedEntityId === linkedEsc?.id);
  const linkedBud = budgets.filter((b) => b.linkedEscalationIds?.includes(linkedEsc?.id ?? ""));
  const linkedRes = resolutions.find((r) => r.complaintId === complaintId);

  const sections = [
    {
      heading: "Complaint Details",
      rows: [
        { label: "ID", value: complaint.id },
        { label: "Title", value: complaint.title },
        { label: "Status", value: complaint.status },
        { label: "Priority", value: complaint.priority },
        { label: "SLA Status", value: complaint.slaStatus },
        { label: "Location", value: complaint.location },
        { label: "Sub-District", value: complaint.subDistrict },
        { label: "Assigned Officer", value: complaint.officer || "Unassigned" },
        { label: "Created", value: complaint.createdDate },
        { label: "Last Updated", value: complaint.updatedDate },
      ],
    },
    ...(linkedEsc ? [{
      heading: "Linked Escalation",
      rows: [
        { label: "ID", value: linkedEsc.id },
        { label: "Status", value: linkedEsc.status },
        { label: "Priority", value: linkedEsc.priority },
        { label: "Assigned To", value: linkedEsc.assignedTo },
        { label: "Escalated On", value: linkedEsc.escalatedOn },
        { label: "Days Open", value: String(linkedEsc.daysOpen) },
        { label: "Funding Required", value: linkedEsc.fundingRequired ? "Yes" : "No" },
        ...(linkedEsc.fundingRequired ? [
          { label: "Estimated Cost", value: `₹${linkedEsc.estimatedCost ?? "TBD"} Lakhs` },
          { label: "Funding Reason", value: linkedEsc.fundingReason ?? "—" },
        ] : []),
      ],
    }] : []),
    ...(linkedEv.length > 0 ? [{
      heading: "Evidence Records",
      rows: linkedEv.map((ev) => ({
        label: ev.id,
        value: `${ev.title} — Status: ${ev.status} — Uploaded: ${ev.uploadedAt}`,
      })),
    }] : []),
    ...(linkedBud.length > 0 ? [{
      heading: "Budget Allocation",
      rows: linkedBud.flatMap((b) => [
        { label: `${b.id} — Requested`, value: `₹${b.requestedAmount} Cr` },
        { label: `${b.id} — Approved`, value: `₹${b.approvedAmount ?? "Pending"} Cr` },
        { label: `${b.id} — Released`, value: `₹${b.releasedAmount ?? 0} Cr — ${b.releaseStatus ?? "Pending"}` },
      ]),
    }] : []),
    ...(linkedRes ? [{
      heading: "Resolution",
      rows: [
        { label: "ID", value: linkedRes.id },
        { label: "Status", value: linkedRes.status },
        { label: "Submitted By", value: linkedRes.submittedBy },
        { label: "Completion Date", value: linkedRes.workCompletionDate ?? linkedRes.completionDate },
        { label: "Work Performed", value: linkedRes.workPerformed },
        { label: "Estimated Work Cost", value: linkedRes.estimatedWorkCost ?? linkedRes.costIncurred },
        { label: "Completion Notes", value: linkedRes.completionNotes ?? "—" },
        { label: "Before Photos", value: linkedRes.beforePhotos?.length ? `${linkedRes.beforePhotos.length} attached` : "None" },
        { label: "After Photos", value: linkedRes.afterPhotos?.length ? `${linkedRes.afterPhotos.length} attached` : "None" },
        { label: "Evidence Verified", value: (linkedRes.beforePhotos?.length || linkedRes.afterPhotos?.length) ? "✓ Yes" : "No completion evidence" },
      ],
    }] : []),
    {
      heading: "Activity Timeline",
      rows: complaint.activityLog.slice(0, 15).map((a) => ({
        label: a.time,
        value: `${a.actor}: ${a.action}`,
      })),
    },
  ];

  printReport(`Case Report — ${complaintId}`, sections);
}

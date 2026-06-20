/**
 * budgetApprovalStore.ts — Super Admin budget & approval workflows (frontend only).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuditLogStore } from "@/store/auditLogStore";
import { useAdminNotificationStore } from "@/store/adminNotificationStore";
import { adminPersistOptions } from "@/lib/store-persist";
import { awardXP, incrementBadgeProgress } from "@/lib/xp-dispatcher";

function logBudgetAudit(entityId: string, action: string, previousStatus: string, newStatus: string) {
  useAuditLogStore.getState().addEntry({
    userRole: "Super Admin",
    actor: "Super Admin",
    action,
    entityId,
    previousStatus,
    newStatus,
    category: "Budget Decisions",
    ip: "192.168.1.10",
  });
}

function notifyDistrictBudget(entityId: string, title: string, message: string) {
  const req = useBudgetApprovalStore.getState().requests.find(r => r.id === entityId);
  const projectLabel = req ? ` — ${req.project}` : "";
  const escLabel = req?.linkedEscalationIds?.length
    ? ` [${req.linkedEscalationIds.join(", ")}]`
    : "";
  // Include amount details for budget decisions
  const amountDetail = req
    ? `\nRequested: ₹${req.requestedAmount} Cr${req.approvedAmount != null ? ` | Approved: ₹${req.approvedAmount} Cr | Diff: ${req.approvedAmount - req.requestedAmount > 0 ? "+" : ""}₹${(req.approvedAmount - req.requestedAmount).toFixed(1)} Cr` : ""}${req.releaseStatus ? ` | ${req.releaseStatus}` : ""}`
    : "";
  useAdminNotificationStore.getState().push({
    portal: "district",
    type: "budget_decision",
    title: `${title}${projectLabel}`,
    message: `${entityId}: ${message}${amountDetail}${escLabel}`,
    entityId,
    href: "/district-admin/budget",
  });
}

function notifySuperBudget(entityId: string, title: string) {
  useAdminNotificationStore.getState().push({
    portal: "super",
    type: "budget_submitted",
    title: "New budget request",
    message: `${entityId} — ${title}`,
    entityId,
    href: `/super-admin/governance/approvals/${entityId}`,
  });
}

export type BudgetRequestStatus =
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Clarification Requested"
  | "Under Audit"
  | "Sent Back For Review";

export type BudgetPriority = "Critical" | "High" | "Medium" | "Low";
export type BudgetRequestType = "Standard" | "Emergency" | "Supplementary";

export interface BudgetDocument {
  name: string;
  size: string;
  type: string;
}

export interface BudgetTimelineStep {
  label: string;
  date: string;
  done: boolean;
  note: string;
}

export interface BudgetActivityEntry {
  time: string;
  actor: string;
  action: string;
}

export interface BudgetApprovalHistoryEntry {
  time: string;
  actor: string;
  action: string;
  amount?: number;
  note?: string;
}

export interface BudgetAuditEntry {
  time: string;
  actor: string;
  event: string;
  detail?: string;
}

export interface BudgetRequest {
  id: string;
  district: string;
  state: string;
  project: string;
  requestedAmount: number;
  approvedAmount?: number;
  status: BudgetRequestStatus;
  priority: BudgetPriority;
  requestType: BudgetRequestType;
  submittedOn: string;
  submittedBy: string;
  fiscalYear: string;
  justification: string;
  notes: string;
  /** Linked escalation IDs — traceability between ESC and BUD */
  linkedEscalationIds?: string[];
  /** Fund release tracking */
  releasedAmount?: number;
  releasedDate?: string;
  releaseStatus?: "Pending Release" | "Partially Released" | "Fully Released";
  /** Approval metadata */
  approvedBy?: string;
  approvedDate?: string;
  documents: BudgetDocument[];
  timeline: BudgetTimelineStep[];
  activityLog: BudgetActivityEntry[];
  approvalHistory: BudgetApprovalHistoryEntry[];
  auditTrail: BudgetAuditEntry[];
}

function nowStr(): string {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function seedTimeline(submittedOn: string, status: BudgetRequestStatus): BudgetTimelineStep[] {
  const steps: BudgetTimelineStep[] = [
    { label: "Request Submitted", date: submittedOn, done: true, note: "District admin submitted budget request" },
    { label: "Super Admin Review", date: "Pending", done: false, note: "" },
    { label: "Approval Decision", date: "Pending", done: false, note: "" },
    { label: "Funds Disbursed", date: "Pending", done: false, note: "" },
  ];
  if (status === "Approved") {
    return [
      { ...steps[0] },
      { label: "Super Admin Review", date: "02 Jun 2026", done: true, note: "Reviewed by Super Admin" },
      { label: "Approval Decision", date: "03 Jun 2026", done: true, note: "Budget approved" },
      { label: "Funds Disbursed", date: "Pending", done: false, note: "Awaiting treasury release" },
    ];
  }
  if (status === "Rejected") {
    return [
      { ...steps[0] },
      { label: "Super Admin Review", date: "01 Jun 2026", done: true, note: "Insufficient documentation" },
      { label: "Approval Decision", date: "01 Jun 2026", done: true, note: "Request rejected" },
      { label: "Funds Disbursed", date: "—", done: false, note: "Not applicable" },
    ];
  }
  if (status === "Under Audit") {
    return [
      { ...steps[0] },
      { label: "Super Admin Review", date: "04 Jun 2026", done: true, note: "Flagged for audit" },
      { label: "Audit In Progress", date: "04 Jun 2026", done: true, note: "Audit Cell A assigned" },
      { label: "Approval Decision", date: "Pending", done: false, note: "" },
      { label: "Funds Disbursed", date: "Pending", done: false, note: "" },
    ];
  }
  return steps;
}

const SEED: BudgetRequest[] = [
  {
    id: "BUD-2026-001",
    district: "Mumbai City",
    state: "Maharashtra",
    project: "NH-48 Emergency Bridge Repair",
    requestedAmount: 85,
    status: "Pending Approval",
    priority: "Critical",
    requestType: "Emergency",
    submittedOn: "05 Jun 2026",
    submittedBy: "District Officer K. Patil",
    fiscalYear: "FY 2026-27",
    linkedEscalationIds: ["ESC-4022", "ESC-4024"],
    justification:
      "Structural assessment reports confirm immediate risk on NH-48 bridge segment. Emergency allocation required to prevent traffic closure and safety incidents.",
    notes: "District has attached geotechnical survey and contractor quotations.",
    documents: [
      { name: "Structural_Assessment_Report.pdf", size: "2.4 MB", type: "PDF" },
      { name: "Contractor_Quotation_L&T.pdf", size: "890 KB", type: "PDF" },
      { name: "Site_Photos_Jun2026.zip", size: "12.1 MB", type: "ZIP" },
    ],
    timeline: seedTimeline("05 Jun 2026", "Pending Approval"),
    activityLog: [
      { time: "05 Jun 2026 09:12", actor: "District Officer K. Patil", action: "Submitted emergency budget request BUD-2026-001" },
      { time: "05 Jun 2026 09:30", actor: "System", action: "Routed to Super Admin approval queue — Critical priority" },
    ],
    approvalHistory: [],
    auditTrail: [
      { time: "05 Jun 2026 09:12", actor: "System", event: "Request Created", detail: "Emergency flag auto-applied" },
    ],
  },
  {
    id: "BUD-2026-002",
    district: "Raigad District",
    state: "Maharashtra",
    project: "Urban Road Resurfacing Phase II",
    requestedAmount: 42.5,
    status: "Pending Approval",
    priority: "High",
    requestType: "Standard",
    submittedOn: "04 Jun 2026",
    submittedBy: "District Officer S. Gupta",
    fiscalYear: "FY 2026-27",
    justification:
      "Phase II resurfacing covers 48 km of arterial roads with documented pothole density above threshold. Aligns with monsoon preparedness plan.",
    notes: "Prior phase utilisation report attached at 94%.",
    documents: [
      { name: "Phase_II_BoQ.xlsx", size: "1.1 MB", type: "XLSX" },
      { name: "Phase_I_Utilisation_Report.pdf", size: "640 KB", type: "PDF" },
    ],
    timeline: seedTimeline("04 Jun 2026", "Pending Approval"),
    activityLog: [
      { time: "04 Jun 2026 14:20", actor: "District Officer S. Gupta", action: "Submitted budget request for urban resurfacing" },
    ],
    approvalHistory: [],
    auditTrail: [{ time: "04 Jun 2026 14:20", actor: "System", event: "Request Created" }],
  },
  {
    id: "BUD-2026-003",
    district: "Bengaluru Urban",
    state: "Karnataka",
    project: "Smart Corridor Signal Upgrade",
    requestedAmount: 18.2,
    approvedAmount: 16.5,
    approvedBy: "Super Admin",
    approvedDate: "03 Jun 2026 11:00",
    releasedAmount: 16.5,
    releasedDate: "05 Jun 2026 09:00",
    releaseStatus: "Fully Released",
    status: "Approved",
    priority: "Medium",
    requestType: "Standard",
    submittedOn: "28 May 2026",
    submittedBy: "District Officer R. Sharma",
    fiscalYear: "FY 2026-27",
    justification: "Upgrade adaptive traffic signals on 12 corridors to reduce congestion and incident response time.",
    notes: "Approved with 10% scope reduction on peripheral corridors.",
    documents: [{ name: "Signal_Upgrade_Proposal.pdf", size: "3.2 MB", type: "PDF" }],
    timeline: seedTimeline("28 May 2026", "Approved"),
    activityLog: [
      { time: "03 Jun 2026 11:00", actor: "Super Admin", action: "Approved budget at ₹16.5 Cr (modified from ₹18.2 Cr)" },
      { time: "28 May 2026 10:00", actor: "District Officer R. Sharma", action: "Submitted budget request" },
    ],
    approvalHistory: [
      { time: "03 Jun 2026 11:00", actor: "Super Admin", action: "Approved", amount: 16.5, note: "Scope trimmed on peripheral corridors" },
    ],
    auditTrail: [
      { time: "03 Jun 2026 11:00", actor: "Super Admin", event: "Approval Recorded" },
      { time: "28 May 2026 10:00", actor: "System", event: "Request Created" },
    ],
  },
  {
    id: "BUD-2026-004",
    district: "Patna",
    state: "Bihar",
    project: "Rural Link Road Package — Block 7",
    requestedAmount: 55,
    status: "Rejected",
    priority: "High",
    requestType: "Standard",
    submittedOn: "26 May 2026",
    submittedBy: "District Officer A. Singh",
    fiscalYear: "FY 2026-27",
    justification: "Connectivity package for 14 villages; DPR submitted with PMGSY alignment.",
    notes: "Rejected pending revised DPR with updated cost estimates.",
    documents: [{ name: "DPR_Block7_Draft.pdf", size: "5.8 MB", type: "PDF" }],
    timeline: seedTimeline("26 May 2026", "Rejected"),
    activityLog: [
      { time: "01 Jun 2026 16:45", actor: "Super Admin", action: "Rejected — DPR cost estimates outdated" },
      { time: "26 May 2026 08:30", actor: "District Officer A. Singh", action: "Submitted budget request" },
    ],
    approvalHistory: [
      { time: "01 Jun 2026 16:45", actor: "Super Admin", action: "Rejected", note: "DPR cost estimates outdated" },
    ],
    auditTrail: [{ time: "01 Jun 2026 16:45", actor: "Super Admin", event: "Rejection Recorded" }],
  },
  {
    id: "BUD-2026-005",
    district: "Chennai",
    state: "Tamil Nadu",
    project: "Stormwater Drain Network Extension",
    requestedAmount: 72,
    status: "Clarification Requested",
    priority: "High",
    requestType: "Standard",
    submittedOn: "03 Jun 2026",
    submittedBy: "District Officer M. Khan",
    fiscalYear: "FY 2026-27",
    justification: "Extend stormwater drainage along IT corridor to mitigate recurring flood damage to road infrastructure.",
    notes: "Clarification requested on environmental clearance status.",
    documents: [
      { name: "Hydrology_Study.pdf", size: "4.1 MB", type: "PDF" },
      { name: "Budget_Breakdown.xlsx", size: "780 KB", type: "XLSX" },
    ],
    timeline: seedTimeline("03 Jun 2026", "Pending Approval"),
    activityLog: [
      { time: "04 Jun 2026 10:15", actor: "Super Admin", action: "Clarification requested — provide environmental clearance certificate" },
      { time: "03 Jun 2026 11:40", actor: "District Officer M. Khan", action: "Submitted budget request" },
    ],
    approvalHistory: [],
    auditTrail: [{ time: "04 Jun 2026 10:15", actor: "Super Admin", event: "Clarification Requested" }],
  },
  {
    id: "BUD-2026-006",
    district: "Jaipur",
    state: "Rajasthan",
    project: "Highway Maintenance Contingency Fund",
    requestedAmount: 120,
    status: "Under Audit",
    priority: "Critical",
    requestType: "Supplementary",
    submittedOn: "02 Jun 2026",
    submittedBy: "District Officer P. Iyer",
    fiscalYear: "FY 2026-27",
    justification: "Supplementary allocation for unplanned maintenance on Jaipur-Agra corridor after extreme weather events.",
    notes: "Flagged by AI alert ALT-001 for budget anomaly review.",
    documents: [
      { name: "Weather_Damage_Assessment.pdf", size: "2.9 MB", type: "PDF" },
      { name: "Expenditure_Variance_Report.pdf", size: "1.4 MB", type: "PDF" },
    ],
    timeline: seedTimeline("02 Jun 2026", "Under Audit"),
    activityLog: [
      { time: "04 Jun 2026 09:00", actor: "Super Admin", action: "Marked under audit — Audit Cell A assigned" },
      { time: "02 Jun 2026 15:00", actor: "District Officer P. Iyer", action: "Submitted supplementary budget request" },
    ],
    approvalHistory: [],
    auditTrail: [
      { time: "04 Jun 2026 09:00", actor: "Audit Cell A", event: "Audit Started", detail: "Linked to AI anomaly ALT-001" },
      { time: "02 Jun 2026 15:00", actor: "System", event: "Request Created" },
    ],
  },
  {
    id: "BUD-2026-007",
    district: "Lucknow",
    state: "Uttar Pradesh",
    project: "Flyover Retrofit Package",
    requestedAmount: 95,
    status: "Sent Back For Review",
    priority: "High",
    requestType: "Standard",
    submittedOn: "30 May 2026",
    submittedBy: "District Officer T. Verma",
    fiscalYear: "FY 2026-27",
    justification: "Structural retrofit of three flyovers identified in national safety audit.",
    notes: "Sent back for revised contractor selection matrix.",
    documents: [{ name: "Retrofit_Technical_Spec.pdf", size: "6.2 MB", type: "PDF" }],
    timeline: seedTimeline("30 May 2026", "Pending Approval"),
    activityLog: [
      { time: "03 Jun 2026 14:30", actor: "Super Admin", action: "Sent back for review — revise contractor selection matrix" },
      { time: "30 May 2026 09:00", actor: "District Officer T. Verma", action: "Submitted budget request" },
    ],
    approvalHistory: [],
    auditTrail: [{ time: "03 Jun 2026 14:30", actor: "Super Admin", event: "Sent Back For Review" }],
  },
  {
    id: "BUD-2026-008",
    district: "Kolkata",
    state: "West Bengal",
    project: "Flood Barrier Emergency Works",
    requestedAmount: 38,
    status: "Pending Approval",
    priority: "Critical",
    requestType: "Emergency",
    submittedOn: "05 Jun 2026",
    submittedBy: "District Officer S. Das",
    fiscalYear: "FY 2026-27",
    justification: "Immediate flood barrier reinforcement required before forecasted cyclone landfall.",
    notes: "IMD cyclone advisory attached. 72-hour deployment window.",
    documents: [
      { name: "IMD_Cyclone_Advisory.pdf", size: "420 KB", type: "PDF" },
      { name: "Emergency_Deployment_Plan.pdf", size: "1.8 MB", type: "PDF" },
    ],
    timeline: seedTimeline("05 Jun 2026", "Pending Approval"),
    activityLog: [
      { time: "05 Jun 2026 07:45", actor: "District Officer S. Das", action: "Submitted emergency budget request" },
      { time: "05 Jun 2026 07:50", actor: "System", action: "Escalated to emergency approval queue" },
    ],
    approvalHistory: [],
    auditTrail: [{ time: "05 Jun 2026 07:45", actor: "System", event: "Emergency Request Created" }],
  },
];

function patchTimeline(
  timeline: BudgetTimelineStep[],
  label: string,
  patch: Partial<BudgetTimelineStep>
): BudgetTimelineStep[] {
  return timeline.map((s) => (s.label === label ? { ...s, ...patch } : s));
}

export type BudgetSubmitInput = Omit<
  BudgetRequest,
  "id" | "status" | "timeline" | "activityLog" | "approvalHistory" | "auditTrail" | "submittedOn" | "approvedAmount"
>;

interface BudgetApprovalState {
  requests: BudgetRequest[];
  nextBudgetId: number;
  submitBudgetRequest: (entry: BudgetSubmitInput) => string;
  respondToClarification: (id: string, response: string) => void;
  approveBudget: (id: string, note: string, approvedAmount?: number) => void;
  rejectBudget: (id: string, reason: string, note: string) => void;
  requestClarification: (id: string, message: string) => void;
  modifyApprovedAmount: (id: string, amount: number, note: string) => void;
  sendBackForReview: (id: string, note: string) => void;
  markUnderAudit: (id: string, note: string) => void;
  releaseFunds: (id: string, amount: number, note: string) => void;
  appendActivity: (id: string, actor: string, action: string) => void;
  appendNote: (id: string, note: string) => void;
}

function updateRequest(
  requests: BudgetRequest[],
  id: string,
  patch: Partial<BudgetRequest>
): BudgetRequest[] {
  return requests.map((r) => (r.id === id ? { ...r, ...patch } : r));
}

export const useBudgetApprovalStore = create<BudgetApprovalState>()(
  persist(
    (set, get) => ({
  requests: SEED,
  nextBudgetId: 9,

  submitBudgetRequest: (entry) => {
    const id = `BUD-2026-${String(get().nextBudgetId).padStart(3, "0")}`;
    set({ nextBudgetId: get().nextBudgetId + 1 });
    const time = nowStr();
    const submittedOn = time;

    // Build activity log with escalation links
    const activityEntries: BudgetActivityEntry[] = [
      { time, actor: entry.submittedBy, action: `Submitted budget request ${id}` },
    ];
    if (entry.linkedEscalationIds && entry.linkedEscalationIds.length > 0) {
      activityEntries.push({
        time,
        actor: "System",
        action: `Budget ${id} linked to ${entry.linkedEscalationIds.join(", ")}`,
      });
    }

    const req: BudgetRequest = {
      ...entry,
      id,
      submittedOn,
      status: "Pending Approval",
      timeline: seedTimeline(submittedOn, "Pending Approval"),
      activityLog: activityEntries,
      approvalHistory: [],
      auditTrail: [{ time, actor: "System", event: "Request Created" }],
    };
    set({ requests: [req, ...get().requests] });
    useAuditLogStore.getState().addEntry({
      userRole: "District Admin",
      actor: entry.submittedBy,
      action: `Budget request submitted — ${entry.project}${entry.linkedEscalationIds?.length ? ` (linked: ${entry.linkedEscalationIds.join(", ")})` : ""}`,
      entityId: id,
      previousStatus: "—",
      newStatus: "Pending Approval",
      category: "Budget Decisions",
      ip: "10.0.0.42",
    });
    notifySuperBudget(id, entry.project);
    return id;
  },

  respondToClarification: (id, response) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    const time = nowStr();
    set({
      requests: updateRequest(get().requests, id, {
        status: "Pending Approval",
        notes: req.notes ? `${req.notes}\n\n[${time}] District response: ${response}` : response,
        activityLog: [{ time, actor: req.submittedBy, action: "Clarification response submitted" }, ...req.activityLog],
      }),
    });
    useAdminNotificationStore.getState().push({
      portal: "super",
      type: "budget_submitted",
      title: "Budget clarification received",
      message: `${id} — district responded`,
      entityId: id,
      href: `/super-admin/governance/approvals/${id}`,
    });
  },

  approveBudget: (id, note, approvedAmount) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    const amount = approvedAmount ?? req.requestedAmount;
    const time = nowStr();
    const entry: BudgetApprovalHistoryEntry = { time, actor: "Super Admin", action: "Approved", amount, note };
    set({
      requests: updateRequest(get().requests, id, {
        status: "Approved",
        approvedAmount: amount,
        approvedBy: "Super Admin",
        approvedDate: time,
        releaseStatus: "Pending Release",
        timeline: patchTimeline(
          patchTimeline(
            patchTimeline(req.timeline, "Super Admin Review", { done: true, date: time, note: "Review complete" }),
            "Approval Decision",
            { done: true, date: time, note: `Approved at ₹${amount} Cr` }
          ),
          "Funds Disbursed",
          { date: "Pending", done: false, note: "Awaiting disbursement" }
        ),
        activityLog: [
          { time, actor: "Super Admin", action: `Approved budget at ₹${amount} Cr${note ? ` — ${note}` : ""}` },
          ...req.activityLog,
        ],
        approvalHistory: [entry, ...req.approvalHistory],
        auditTrail: [{ time, actor: "Super Admin", event: "Approval Recorded", detail: note }, ...req.auditTrail],
      }),
    });
    const diff = amount - req.requestedAmount;
    const diffLabel = diff === 0 ? "" : ` (${diff > 0 ? "+" : ""}${diff} Cr difference)`;
    logBudgetAudit(id, `Budget approved at ₹${amount} Cr`, req.status, "Approved");
    notifyDistrictBudget(id, "Budget approved", `${id} approved at ₹${amount} Cr${diffLabel}`);
    // Award XP for budget approval
    awardXP("district", "budget_approved", `Budget ${id} approved`);
    incrementBadgeProgress("district", "db5"); // Budget Champion badge
  },

  rejectBudget: (id, reason, note) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    const time = nowStr();
    const entry: BudgetApprovalHistoryEntry = { time, actor: "Super Admin", action: "Rejected", note: `${reason}${note ? ` | ${note}` : ""}` };
    set({
      requests: updateRequest(get().requests, id, {
        status: "Rejected",
        timeline: patchTimeline(
          patchTimeline(req.timeline, "Super Admin Review", { done: true, date: time }),
          "Approval Decision",
          { done: true, date: time, note: `Rejected — ${reason}` }
        ),
        activityLog: [{ time, actor: "Super Admin", action: `Rejected — ${reason}` }, ...req.activityLog],
        approvalHistory: [entry, ...req.approvalHistory],
        auditTrail: [{ time, actor: "Super Admin", event: "Rejection Recorded" }, ...req.auditTrail],
      }),
    });
    logBudgetAudit(id, `Budget rejected — ${reason}`, req.status, "Rejected");
    notifyDistrictBudget(id, "Budget rejected", reason);
  },

  requestClarification: (id, message) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    const time = nowStr();
    set({
      requests: updateRequest(get().requests, id, {
        status: "Clarification Requested",
        activityLog: [{ time, actor: "Super Admin", action: `Clarification requested: ${message}` }, ...req.activityLog],
        auditTrail: [{ time, actor: "Super Admin", event: "Clarification Requested", detail: message }, ...req.auditTrail],
      }),
    });
    logBudgetAudit(id, "Clarification requested", req.status, "Clarification Requested");
    notifyDistrictBudget(id, "Clarification requested", message);
  },

  modifyApprovedAmount: (id, amount, note) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    const time = nowStr();
    const entry: BudgetApprovalHistoryEntry = { time, actor: "Super Admin", action: "Amount Modified", amount, note };
    set({
      requests: updateRequest(get().requests, id, {
        approvedAmount: amount,
        status: req.status === "Pending Approval" ? "Approved" : req.status,
        activityLog: [{ time, actor: "Super Admin", action: `Modified approved amount to ₹${amount} Cr` }, ...req.activityLog],
        approvalHistory: [entry, ...req.approvalHistory],
        auditTrail: [{ time, actor: "Super Admin", event: "Amount Modified", detail: note }, ...req.auditTrail],
      }),
    });
    const newStatus = req.status === "Pending Approval" ? "Approved" : req.status;
    logBudgetAudit(id, `Approved amount modified to ₹${amount} Cr`, req.status, newStatus);
    notifyDistrictBudget(id, "Budget amount modified", `Approved amount updated to ₹${amount} Cr`);
  },

  sendBackForReview: (id, note) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    const time = nowStr();
    set({
      requests: updateRequest(get().requests, id, {
        status: "Sent Back For Review",
        activityLog: [{ time, actor: "Super Admin", action: `Sent back for review${note ? ` — ${note}` : ""}` }, ...req.activityLog],
        auditTrail: [{ time, actor: "Super Admin", event: "Sent Back For Review", detail: note }, ...req.auditTrail],
      }),
    });
    logBudgetAudit(id, "Sent back for review", req.status, "Sent Back For Review");
    notifyDistrictBudget(id, "Budget sent back for review", note || "Please revise and resubmit");
  },

  markUnderAudit: (id, note) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    const time = nowStr();
    set({
      requests: updateRequest(get().requests, id, {
        status: "Under Audit",
        timeline: patchTimeline(req.timeline, "Audit In Progress", { done: true, date: time, note: "Audit Cell A" }).length
          ? patchTimeline(req.timeline, "Audit In Progress", { done: true, date: time })
          : [
              ...req.timeline.slice(0, 2),
              { label: "Audit In Progress", date: time, done: true, note: "Audit Cell A assigned" },
              ...req.timeline.slice(2),
            ],
        activityLog: [{ time, actor: "Super Admin", action: `Marked under audit${note ? ` — ${note}` : ""}` }, ...req.activityLog],
        auditTrail: [{ time, actor: "Audit Cell A", event: "Audit Started", detail: note }, ...req.auditTrail],
      }),
    });
    logBudgetAudit(id, "Marked under audit", req.status, "Under Audit");
    notifyDistrictBudget(id, "Budget under audit", note || "Audit in progress");
  },

  releaseFunds: (id, amount, note) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    const time = nowStr();
    const approved = req.approvedAmount ?? req.requestedAmount;
    const releaseStatus = amount >= approved ? "Fully Released" : "Partially Released";
    set({
      requests: updateRequest(get().requests, id, {
        releasedAmount: amount,
        releasedDate: time,
        releaseStatus: releaseStatus as "Fully Released" | "Partially Released",
        timeline: patchTimeline(req.timeline, "Funds Disbursed", {
          done: true, date: time, note: `₹${amount} Cr released`,
        }),
        activityLog: [
          { time, actor: "Super Admin", action: `Funds released: ₹${amount} Cr${note ? ` — ${note}` : ""}` },
          ...req.activityLog,
        ],
        auditTrail: [{ time, actor: "Treasury", event: "Funds Released", detail: `₹${amount} Cr` }, ...req.auditTrail],
      }),
    });
    logBudgetAudit(id, `Funds released: ₹${amount} Cr`, req.status, releaseStatus);
    notifyDistrictBudget(id, "Funds released", `₹${amount} Cr released for ${req.project}`);
  },

  appendActivity: (id, actor, action) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    set({
      requests: updateRequest(get().requests, id, {
        activityLog: [{ time: nowStr(), actor, action }, ...req.activityLog],
      }),
    });
  },

  appendNote: (id, note) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    set({
      requests: updateRequest(get().requests, id, {
        notes: req.notes ? `${req.notes}\n\n[${nowStr()}] ${note}` : note,
      }),
    });
  },
}),
    adminPersistOptions("budget-approval", (s) => ({
      requests: s.requests,
      nextBudgetId: s.nextBudgetId,
    }))
  )
);

/** Format amount in Crores for display */
export function formatBudgetAmount(cr: number): string {
  return `₹${cr.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr`;
}

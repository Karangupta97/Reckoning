/**
 * budgetApprovalStore.ts — Super Admin budget & approval workflows (frontend only).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuditLogStore } from "@/store/auditLogStore";
import { useAdminNotificationStore } from "@/store/adminNotificationStore";
import { adminPersistOptions } from "@/lib/store-persist";
import { awardXP, incrementBadgeProgress } from "@/lib/xp-dispatcher";
import { GOVERNANCE_BUDGETS } from "@/lib/governance/seeds";

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

const SEED = GOVERNANCE_BUDGETS;

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

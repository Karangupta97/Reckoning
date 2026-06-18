/**
 * governanceRequestStore.ts — District governance requests → Super Admin review (frontend only).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuditLogStore } from "@/store/auditLogStore";
import { useAdminNotificationStore } from "@/store/adminNotificationStore";
import { adminPersistOptions } from "@/lib/store-persist";
import { districtLabel } from "@/lib/district-config";

export type GovernanceRequestStatus =
  | "Pending Review"
  | "Approved"
  | "Rejected"
  | "Clarification Requested"
  | "Under Audit"
  | "Sent Back For Review";

export type GovernanceRequestType =
  | "Policy Exception"
  | "Access Request"
  | "Compliance Waiver"
  | "Role Change";

export interface GovernanceActivityEntry {
  time: string;
  actor: string;
  action: string;
}

export interface GovernanceApprovalEntry {
  time: string;
  actor: string;
  action: string;
  note?: string;
}

export interface GovernanceRequest {
  id: string;
  district: string;
  state: string;
  title: string;
  type: GovernanceRequestType;
  submittedBy: string;
  submittedOn: string;
  status: GovernanceRequestStatus;
  justification: string;
  notes: string;
  activityLog: GovernanceActivityEntry[];
  approvalHistory: GovernanceApprovalEntry[];
  auditTrail: { time: string; actor: string; event: string; detail?: string }[];
}

function nowStr(): string {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const SEED: GovernanceRequest[] = [
  {
    id: "GOV-2026-001",
    district: districtLabel,
    state: "Maharashtra",
    title: "Extended contractor onboarding window",
    type: "Policy Exception",
    submittedBy: "District Officer S. Gupta",
    submittedOn: "04 Jun 2026",
    status: "Pending Review",
    justification: "Request 30-day extension for Q2 contractor onboarding due to monsoon preparedness delays.",
    notes: "",
    activityLog: [{ time: "04 Jun 2026 14:00", actor: "District Officer S. Gupta", action: "Submitted governance request GOV-2026-001" }],
    approvalHistory: [],
    auditTrail: [{ time: "04 Jun 2026 14:00", actor: "System", event: "Request Created" }],
  },
  {
    id: "GOV-2026-002",
    district: districtLabel,
    state: "Maharashtra",
    title: "Temporary access for external audit team",
    type: "Access Request",
    submittedBy: "District Officer K. Patil",
    submittedOn: "03 Jun 2026",
    status: "Approved",
    justification: "External audit team requires read-only access to expenditure dashboards for 14 days.",
    notes: "Approved with 14-day expiry.",
    activityLog: [
      { time: "04 Jun 2026 10:00", actor: "Super Admin", action: "Governance request approved" },
      { time: "03 Jun 2026 11:30", actor: "District Officer K. Patil", action: "Submitted governance request" },
    ],
    approvalHistory: [{ time: "04 Jun 2026 10:00", actor: "Super Admin", action: "Approved", note: "14-day read-only access" }],
    auditTrail: [{ time: "04 Jun 2026 10:00", actor: "Super Admin", event: "Approval Recorded" }],
  },
];

function logGovAudit(entityId: string, action: string, prev: string, next: string) {
  useAuditLogStore.getState().addEntry({
    userRole: "Super Admin",
    actor: "Super Admin",
    action,
    entityId,
    previousStatus: prev,
    newStatus: next,
    category: "Approval Actions",
    ip: "192.168.1.10",
  });
}

function notifyDistrictDecision(entityId: string, title: string, message: string) {
  useAdminNotificationStore.getState().push({
    portal: "district",
    type: "governance_decision",
    title,
    message,
    entityId,
    href: "/district-admin/governance",
  });
}

function notifySuperNew(entityId: string, title: string) {
  useAdminNotificationStore.getState().push({
    portal: "super",
    type: "governance_submitted",
    title: "New governance request",
    message: `${entityId} — ${title}`,
    entityId,
    href: `/super-admin/governance/district-requests/${entityId}`,
  });
}

interface GovernanceState {
  requests: GovernanceRequest[];
  nextGovId: number;
  submitRequest: (entry: Omit<GovernanceRequest, "id" | "submittedOn" | "status" | "activityLog" | "approvalHistory" | "auditTrail">) => string;
  approveRequest: (id: string, note: string) => void;
  rejectRequest: (id: string, reason: string, note: string) => void;
  requestClarification: (id: string, message: string) => void;
  sendBackForReview: (id: string, note: string) => void;
  markUnderAudit: (id: string, note: string) => void;
  respondToClarification: (id: string, response: string) => void;
}

export const useGovernanceRequestStore = create<GovernanceState>()(
  persist(
    (set, get) => ({
  requests: SEED,
  nextGovId: 3,

  submitRequest: (entry) => {
    const id = `GOV-2026-${String(get().nextGovId).padStart(3, "0")}`;
    set({ nextGovId: get().nextGovId + 1 });
    const time = nowStr();
    const req: GovernanceRequest = {
      ...entry,
      id,
      submittedOn: time,
      status: "Pending Review",
      activityLog: [{ time, actor: entry.submittedBy, action: `Submitted governance request ${id}` }],
      approvalHistory: [],
      auditTrail: [{ time, actor: "System", event: "Request Created" }],
    };
    set({ requests: [req, ...get().requests] });
    notifySuperNew(id, entry.title);
    useAuditLogStore.getState().addEntry({
      userRole: "District Admin",
      actor: entry.submittedBy,
      action: `Governance request submitted — ${entry.title}`,
      entityId: id,
      previousStatus: "—",
      newStatus: "Pending Review",
      category: "Approval Actions",
      ip: "10.0.0.42",
    });
    return id;
  },

  approveRequest: (id, note) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    const time = nowStr();
    const prev = req.status;
    set({
      requests: get().requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Approved",
              activityLog: [{ time, actor: "Super Admin", action: `Approved${note ? ` — ${note}` : ""}` }, ...r.activityLog],
              approvalHistory: [{ time, actor: "Super Admin", action: "Approved", note }, ...r.approvalHistory],
              auditTrail: [{ time, actor: "Super Admin", event: "Approved", detail: note }, ...r.auditTrail],
            }
          : r
      ),
    });
    logGovAudit(id, "Governance request approved", prev, "Approved");
    notifyDistrictDecision(id, "Governance request approved", `${id} has been approved`);
  },

  rejectRequest: (id, reason, note) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    const time = nowStr();
    const prev = req.status;
    set({
      requests: get().requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Rejected",
              activityLog: [{ time, actor: "Super Admin", action: `Rejected — ${reason}` }, ...r.activityLog],
              approvalHistory: [{ time, actor: "Super Admin", action: "Rejected", note: reason }, ...r.approvalHistory],
            }
          : r
      ),
    });
    logGovAudit(id, `Governance request rejected — ${reason}`, prev, "Rejected");
    notifyDistrictDecision(id, "Governance request rejected", reason);
  },

  requestClarification: (id, message) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    const time = nowStr();
    const prev = req.status;
    set({
      requests: get().requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Clarification Requested",
              activityLog: [{ time, actor: "Super Admin", action: `Clarification requested: ${message}` }, ...r.activityLog],
            }
          : r
      ),
    });
    logGovAudit(id, "Clarification requested", prev, "Clarification Requested");
    notifyDistrictDecision(id, "Clarification requested", message);
  },

  sendBackForReview: (id, note) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    const time = nowStr();
    const prev = req.status;
    set({
      requests: get().requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Sent Back For Review",
              activityLog: [{ time, actor: "Super Admin", action: `Sent back for review${note ? ` — ${note}` : ""}` }, ...r.activityLog],
            }
          : r
      ),
    });
    logGovAudit(id, "Sent back for review", prev, "Sent Back For Review");
    notifyDistrictDecision(id, "Sent back for review", note || "Please revise and resubmit");
  },

  markUnderAudit: (id, note) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    const time = nowStr();
    const prev = req.status;
    set({
      requests: get().requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Under Audit",
              activityLog: [{ time, actor: "Super Admin", action: `Marked under audit${note ? ` — ${note}` : ""}` }, ...r.activityLog],
            }
          : r
      ),
    });
    logGovAudit(id, "Marked under audit", prev, "Under Audit");
    notifyDistrictDecision(id, "Governance under audit", note || "Audit in progress");
  },

  respondToClarification: (id, response) => {
    const req = get().requests.find((r) => r.id === id);
    if (!req) return;
    const time = nowStr();
    set({
      requests: get().requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Pending Review",
              notes: r.notes ? `${r.notes}\n\n[${time}] ${response}` : response,
              activityLog: [{ time, actor: req.submittedBy, action: `Clarification response submitted` }, ...r.activityLog],
            }
          : r
      ),
    });
    useAdminNotificationStore.getState().push({
      portal: "super",
      type: "governance_submitted",
      title: "Governance clarification received",
      message: `${id} — district responded`,
      entityId: id,
      href: `/super-admin/governance/district-requests/${id}`,
    });
  },
}),
    adminPersistOptions("governance-requests", (s) => ({
      requests: s.requests,
      nextGovId: s.nextGovId,
    }))
  )
);

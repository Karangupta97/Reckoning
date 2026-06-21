/**
 * escalationStore.ts — Shared escalation records (sub-district, district, super-admin).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuditLogStore } from "@/store/auditLogStore";
import { useAdminNotificationStore } from "@/store/adminNotificationStore";
import { adminPersistOptions } from "@/lib/store-persist";
import { districtLabel } from "@/lib/district-config";
import { syncComplaintFromEscalation, useComplaintStore } from "@/store/complaintStore";
import { awardXP, incrementBadgeProgress } from "@/lib/xp-dispatcher";

export type EscalationPriority = "Critical" | "High" | "Medium" | "Low";
export type EscalationStatus = "Pending Review" | "Assigned" | "Investigating" | "Resolved" | "Closed";
export type EscalationCategory =
  | "Sanitation"
  | "Infrastructure"
  | "Flooding"
  | "Road Damage"
  | "Utilities"
  | "Civic"
  | "Safety";
export type EscalationSLAStatus = "On Track" | "At Risk" | "Breached";

export interface EscalationActivityEntry {
  time: string;
  actor: string;
  action: string;
}

export interface Escalation {
  id: string;
  sourceComplaintId?: string;
  parentEscalationId?: string;
  tier?: "district" | "super";
  district?: string;
  state?: string;
  submittedBy?: string;
  title: string;
  subDistrict: string;
  category: EscalationCategory;
  priority: EscalationPriority;
  status: EscalationStatus;
  slaStatus: EscalationSLAStatus;
  slaLabel: string;
  slaHours: number;
  assignedTo: string;
  escalatedOn: string;
  daysOpen: number;
  reason?: string;
  notes?: string;
  /** Funding traceability — set by sub-district during escalation */
  fundingRequired?: boolean;
  estimatedCost?: number;
  fundingReason?: string;
  activityLog?: EscalationActivityEntry[];
}

function nowStr(): string {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function todayDate(): string {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(",", "");
}

import { GOVERNANCE_ESCALATIONS } from "@/lib/governance/seeds";

function logEscalationAudit(entityId: string, action: string, prev: string, next: string, role: string) {
  useAuditLogStore.getState().addEntry({
    userRole: role,
    actor: role,
    action,
    entityId,
    previousStatus: prev,
    newStatus: next,
    category: "Escalations",
    ip: role === "Super Admin" ? "192.168.1.10" : "10.0.0.42",
  });
}

function patchEscalation(escalations: Escalation[], id: string, patch: Partial<Escalation>): Escalation[] {
  return escalations.map((e) => (e.id === id ? { ...e, ...patch } : e));
}

function appendLog(esc: Escalation, actor: string, action: string): EscalationActivityEntry[] {
  return [{ time: nowStr(), actor, action }, ...(esc.activityLog ?? [])];
}

function isDistrictActor(actor: string): boolean {
  return actor.includes("District");
}

function notifySubDistrict(
  esc: Escalation,
  title: string,
  message: string,
  type: "escalation_update" | "escalation_decision" | "clarification_request" = "escalation_update"
) {
  const href = esc.sourceComplaintId
    ? `/sub-district-admin/dashboard/complaints/${esc.sourceComplaintId}`
    : "/sub-district-admin/dashboard/complaints";
  useAdminNotificationStore.getState().push({
    portal: "sub-district",
    type,
    title,
    message,
    entityId: esc.id,
    href,
  });
}

interface EscalationState {
  escalations: Escalation[];
  nextId: number;
  addEscalation: (entry: Omit<Escalation, "id" | "status" | "slaStatus" | "slaLabel" | "slaHours" | "assignedTo" | "daysOpen" | "escalatedOn" | "activityLog">) => string;
  updateEscalation: (id: string, patch: Partial<Escalation>) => void;
  appendActivity: (id: string, actor: string, action: string) => void;
  assignOfficer: (id: string, officer: string, actor?: string) => void;
  setStatus: (id: string, status: EscalationStatus, actor: string, action: string) => void;
  escalateToSuperAdmin: (id: string, params: { priority: EscalationPriority; reason: string; description: string; district?: string; state?: string; submittedBy?: string }) => string;
  resolveEscalation: (id: string, note: string, actor?: string) => void;
  rejectEscalation: (id: string, reason: string, note: string, actor?: string) => void;
  requestClarification: (id: string, message: string, actor?: string) => void;
  findByComplaintId: (complaintId: string) => Escalation | undefined;
}

export const useEscalationStore = create<EscalationState>()(
  persist(
    (set, get) => ({
  escalations: GOVERNANCE_ESCALATIONS,
  nextId: 4100,

  addEscalation: (entry) => {
    const id = `ESC-${get().nextId}`;
    set({ nextId: get().nextId + 1 });
    const escalatedOn = todayDate();
    const newEscalation: Escalation = {
      ...entry,
      id,
      tier: entry.tier ?? "district",
      status: "Pending Review",
      slaStatus: entry.priority === "Critical" ? "At Risk" : "On Track",
      slaLabel: entry.priority === "Critical" ? "24h Left" : entry.priority === "High" ? "48h Left" : "72h Left",
      slaHours: entry.priority === "Critical" ? 24 : entry.priority === "High" ? 48 : 72,
      assignedTo: "Unassigned",
      daysOpen: 0,
      escalatedOn,
      activityLog: [{ time: nowStr(), actor: "System", action: `Escalation ${id} created` }],
    };
    set((state) => ({ escalations: [newEscalation, ...state.escalations] }));
    useAdminNotificationStore.getState().push({
      portal: "district",
      type: "escalation_new",
      title: "New escalation received",
      message: `${id} — ${entry.title}`,
      entityId: id,
      href: `/district-admin/dashboard/escalation/${id}`,
    });
    return id;
  },

  updateEscalation: (id, patch) => {
    set({ escalations: patchEscalation(get().escalations, id, patch) });
  },

  appendActivity: (id, actor, action) => {
    const esc = get().escalations.find((e) => e.id === id);
    if (!esc) return;
    set({ escalations: patchEscalation(get().escalations, id, { activityLog: appendLog(esc, actor, action) }) });
  },

  assignOfficer: (id, officer, actor = "District Admin") => {
    const esc = get().escalations.find((e) => e.id === id);
    if (!esc) return;
    const prev = esc.status;
    const status: EscalationStatus = esc.status === "Pending Review" ? "Assigned" : esc.status;
    set({
      escalations: patchEscalation(get().escalations, id, {
        assignedTo: officer,
        status,
        activityLog: appendLog(esc, actor, `Assigned to ${officer}`),
      }),
    });
    logEscalationAudit(id, `Assigned to ${officer}`, prev, status, actor);
    // Award XP for assignment
    if (isDistrictActor(actor)) {
      awardXP("district", "escalation_assigned", `Escalation ${id} assigned to ${officer}`);
      notifySubDistrict(
        { ...esc, assignedTo: officer, status },
        "Officer assigned",
        `${id} assigned to ${officer}`,
        "escalation_update"
      );
      syncComplaintFromEscalation({ ...esc, assignedTo: officer, status });
    }
  },

  setStatus: (id, status, actor, action) => {
    const esc = get().escalations.find((e) => e.id === id);
    if (!esc) return;
    const prev = esc.status;
    set({
      escalations: patchEscalation(get().escalations, id, {
        status,
        activityLog: appendLog(esc, actor, action),
      }),
    });
    logEscalationAudit(id, action, prev, status, actor);
    if (actor === "Super Admin") {
      useAdminNotificationStore.getState().push({
        portal: "district",
        type: "escalation_decision",
        title: "Escalation updated",
        message: `${id} — ${status}`,
        entityId: id,
        href: `/district-admin/dashboard/escalation/${id}`,
      });
    } else if (isDistrictActor(actor) && status === "Investigating") {
      notifySubDistrict(esc, "Investigation started", `${id} is now under district investigation`, "escalation_update");
      syncComplaintFromEscalation({ ...esc, status });
    }
  },

  escalateToSuperAdmin: (id, params) => {
    const parent = get().escalations.find((e) => e.id === id);
    if (!parent) return "";
    const superId = `ESC-${get().nextId}`;
    set({ nextId: get().nextId + 1 });
    const escalatedOn = todayDate();
    const superEsc: Escalation = {
      id: superId,
      parentEscalationId: id,
      sourceComplaintId: parent.sourceComplaintId,
      tier: "super",
      district: params.district ?? parent.district ?? districtLabel,
      state: params.state ?? parent.state ?? "Maharashtra",
      submittedBy: params.submittedBy ?? "District Admin",
      title: parent.title,
      subDistrict: parent.subDistrict,
      category: parent.category,
      priority: params.priority,
      status: "Pending Review",
      slaStatus: "At Risk",
      slaLabel: "24h Left",
      slaHours: 24,
      assignedTo: "Super Admin Review",
      daysOpen: 0,
      escalatedOn,
      reason: params.reason,
      notes: params.description,
      activityLog: [
        { time: nowStr(), actor: "District Admin", action: `Escalated from ${id} — ${params.reason}` },
      ],
    };
    set({
      escalations: [
        superEsc,
        ...patchEscalation(get().escalations, id, {
          status: "Closed",
          activityLog: appendLog(parent, "District Admin", `Escalated to Super Admin as ${superId}`),
        }),
      ],
    });
    logEscalationAudit(superId, `Escalated from district — ${params.reason}`, "—", "Pending Review", "District Admin");
    useAdminNotificationStore.getState().push({
      portal: "super",
      type: "escalation_escalated",
      title: "District escalation received",
      message: `${superId} — ${parent.title}`,
      entityId: superId,
      href: `/super-admin/complaints/escalated-cases/${superId}`,
    });
    return superId;
  },

  resolveEscalation: (id, note, actor = "District Admin") => {
    const esc = get().escalations.find((e) => e.id === id);
    if (!esc) return;
    get().setStatus(id, "Resolved", actor, `Resolved${note ? ` — ${note}` : ""}`);
    if (isDistrictActor(actor)) {
      notifySubDistrict(esc, "Escalation resolved", `${id} marked resolved by district`, "escalation_decision");
      syncComplaintFromEscalation({ ...esc, status: "Resolved" });
      // Award XP for district admin
      awardXP("district", "escalation_closed", `Escalation ${id} resolved`);
      incrementBadgeProgress("district", "db3"); // Escalation Closer badge
    }
  },

  rejectEscalation: (id, reason, note, actor = "District Admin") => {
    const esc = get().escalations.find((e) => e.id === id);
    if (!esc) return;
    get().setStatus(id, "Closed", actor, `Rejected — ${reason}${note ? ` | ${note}` : ""}`);
    if (actor === "Super Admin") {
      useAdminNotificationStore.getState().push({
        portal: "district",
        type: "escalation_decision",
        title: "Escalation rejected",
        message: `${id} — ${reason}`,
        entityId: id,
        href: `/district-admin/dashboard/escalation/${id}`,
      });
    } else if (isDistrictActor(actor)) {
      notifySubDistrict(
        esc,
        "Escalation returned",
        `${id} rejected — ${reason}. Please revise and resubmit.`,
        "escalation_decision"
      );
      syncComplaintFromEscalation({ ...esc, status: "Closed" });
    }
  },

  requestClarification: (id, message, actor = "District Admin") => {
    const esc = get().escalations.find((e) => e.id === id);
    if (!esc) return;
    set({
      escalations: patchEscalation(get().escalations, id, {
        notes: esc.notes ? `${esc.notes}\n\n[Clarification] ${message}` : message,
        activityLog: appendLog(esc, actor, `Clarification requested — ${message}`),
      }),
    });
    notifySubDistrict(esc, "Clarification requested", message, "clarification_request");
    useComplaintStore.getState().appendNote(esc.sourceComplaintId ?? "", `[District] ${message}`);
  },

  findByComplaintId: (complaintId) =>
    get().escalations.find((e) => e.sourceComplaintId === complaintId),
}),
    adminPersistOptions("escalation-v2", (s) => ({ escalations: s.escalations, nextId: s.nextId }))
  )
);

/** Pending escalations for Super Admin dashboard */
export function pendingSuperEscalations(escalations: Escalation[]): Escalation[] {
  return escalations.filter(
    (e) =>
      !["Resolved", "Closed"].includes(e.status) &&
      (e.tier === "super" || (e.priority === "Critical" && e.status === "Pending Review"))
  );
}

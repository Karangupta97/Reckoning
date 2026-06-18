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

const D = districtLabel;
const S = "Maharashtra";

const SEED: Escalation[] = [
  { id: "ESC-4021", title: "Sewage overflow — Alibag Main Road", subDistrict: "Alibag", district: D, state: S, category: "Sanitation", priority: "Critical", status: "Pending Review", slaStatus: "Breached", slaLabel: "BREACHED", slaHours: -18, assignedTo: "R. Sharma", escalatedOn: "28 May 2026", daysOpen: 7, tier: "district", submittedBy: "Sub-District Officer", activityLog: [{ time: "28 May 09:30", actor: "Sub-District", action: "Escalated to district" }] },
  { id: "ESC-4022", title: "Bridge structural crack report", subDistrict: "Panvel", district: D, state: S, category: "Infrastructure", priority: "Critical", status: "Investigating", slaStatus: "At Risk", slaLabel: "2h Left", slaHours: 2, assignedTo: "A. Singh", escalatedOn: "01 Jun 2026", daysOpen: 3, tier: "district" },
  { id: "ESC-4023", title: "Waterlogging — Karjat sector", subDistrict: "Karjat", district: D, state: S, category: "Flooding", priority: "High", status: "Assigned", slaStatus: "At Risk", slaLabel: "6h Left", slaHours: 6, assignedTo: "S. Gupta", escalatedOn: "30 May 2026", daysOpen: 5, tier: "district" },
  { id: "ESC-4024", title: "Road pothole cluster — NH-66", subDistrict: "Mahad", district: D, state: S, category: "Road Damage", priority: "High", status: "Pending Review", slaStatus: "Breached", slaLabel: "BREACHED", slaHours: -30, assignedTo: "P. Iyer", escalatedOn: "26 May 2026", daysOpen: 9, tier: "district" },
  { id: "ESC-4025", title: "Street light outage — Mangaon", subDistrict: "Mangaon", district: D, state: S, category: "Utilities", priority: "Medium", status: "Investigating", slaStatus: "On Track", slaLabel: "14h Left", slaHours: 14, assignedTo: "M. Khan", escalatedOn: "03 Jun 2026", daysOpen: 2, tier: "district" },
  { id: "ESC-4026", title: "Illegal construction complaint", subDistrict: "Murud", district: D, state: S, category: "Civic", priority: "Low", status: "Resolved", slaStatus: "On Track", slaLabel: "Resolved", slaHours: 99, assignedTo: "T. Verma", escalatedOn: "02 Jun 2026", daysOpen: 0, tier: "district" },
  { id: "ESC-4027", title: "Broken water main — Ward 4", subDistrict: "Alibag", district: D, state: S, category: "Infrastructure", priority: "Critical", status: "Investigating", slaStatus: "At Risk", slaLabel: "4h Left", slaHours: 4, assignedTo: "R. Sharma", escalatedOn: "31 May 2026", daysOpen: 4, tier: "district" },
  { id: "ESC-4028", title: "Garbage dump — Market area", subDistrict: "Panvel", district: D, state: S, category: "Sanitation", priority: "High", status: "Assigned", slaStatus: "Breached", slaLabel: "BREACHED", slaHours: -6, assignedTo: "M. Khan", escalatedOn: "29 May 2026", daysOpen: 6, tier: "district" },
  { id: "ESC-4029", title: "Footpath encroachment report", subDistrict: "Karjat", district: D, state: S, category: "Civic", priority: "Medium", status: "Closed", slaStatus: "On Track", slaLabel: "Closed", slaHours: 99, assignedTo: "P. Iyer", escalatedOn: "04 Jun 2026", daysOpen: 0, tier: "district" },
  { id: "ESC-4030", title: "Road accident black spot", subDistrict: "Panvel", district: D, state: S, category: "Safety", priority: "Critical", status: "Pending Review", slaStatus: "At Risk", slaLabel: "1h Left", slaHours: 1, assignedTo: "A. Singh", escalatedOn: "03 Jun 2026", daysOpen: 2, tier: "super", parentEscalationId: "ESC-4022", submittedBy: "District Admin", reason: "Requires state-level intervention" },
  { id: "ESC-4031", title: "Collapsed boundary wall — Park", subDistrict: "Mahad", district: D, state: S, category: "Infrastructure", priority: "High", status: "Pending Review", slaStatus: "On Track", slaLabel: "20h Left", slaHours: 20, assignedTo: "S. Gupta", escalatedOn: "04 Jun 2026", daysOpen: 1, tier: "district" },
  { id: "ESC-4032", title: "Open drain near school", subDistrict: "Alibag", district: D, state: S, category: "Sanitation", priority: "Critical", status: "Assigned", slaStatus: "At Risk", slaLabel: "3h Left", slaHours: 3, assignedTo: "R. Sharma", escalatedOn: "04 Jun 2026", daysOpen: 1, tier: "district" },
];

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
  escalations: SEED,
  nextId: 4033,

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
      state: params.state ?? parent.state ?? S,
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
    adminPersistOptions("escalation", (s) => ({ escalations: s.escalations, nextId: s.nextId }))
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

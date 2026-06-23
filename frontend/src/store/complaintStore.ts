/**
 * complaintStore.ts — Shared complaint records (sub-district + district sync).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adminPersistOptions } from "@/lib/store-persist";
import { COMPLAINT_SEED } from "@/lib/complaint-seed";
import { useAdminNotificationStore } from "@/store/adminNotificationStore";
import { awardXP, incrementBadgeProgress } from "@/lib/xp-dispatcher";
import type { Escalation, EscalationStatus } from "@/store/escalationStore";
import type { ResolutionRequestStatus } from "@/store/complaintWorkflowStore";

export type ComplaintStatus =
  | "Open"
  | "Assigned"
  | "In Progress"
  | "Resolved"
  | "Rejected"
  | "Escalated";

export type ComplaintPriority = "Critical" | "High" | "Medium" | "Low";
export type ComplaintSLAStatus = "Breached" | "At Risk" | "On Track";
export type ComplaintResolutionStatus =
  | "None"
  | "Pending District Review"
  | "Approved"
  | "Rejected"
  | "Clarification Requested";

export interface ComplaintActivityEntry {
  time: string;
  actor: string;
  action: string;
}

export interface ComplaintTimelineStep {
  label: string;
  date: string;
  done: boolean;
  note: string;
}

export interface ComplaintEvidenceFile {
  label: string;
  by: string;
  time: string;
  coords: string;
}

export interface ComplaintRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  location: string;
  coordinates: string;
  subDistrict: string;
  zone: string;
  date: string;
  createdDate: string;
  updatedDate: string;
  officer: string;
  officerAssignedDate: string;
  expectedVisit: string;
  slaRisk: string;
  supervisor: string;
  slaStatus: ComplaintSLAStatus;
  slaLabel: string;
  slaHours: number;
  slaTargetHours: number;
  resolutionTarget: string;
  reportCount: number;
  nearbyCount: number;
  escalationId?: string;
  resolutionStatus: ComplaintResolutionStatus;
  resolutionRequestId?: string;
  notes: string;
  evidenceCount: number;
  timeline: ComplaintTimelineStep[];
  activityLog: ComplaintActivityEntry[];
  evidence: {
    citizen: ComplaintEvidenceFile[];
    inspection: ComplaintEvidenceFile[];
    resolution: ComplaintEvidenceFile[];
  };
}

/** Detail-page view shape (officer as nested object) */
export interface ComplaintDetailView {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdDate: string;
  updatedDate: string;
  location: string;
  coordinates: string;
  subDistrict: string;
  zone: string;
  slaStatus: ComplaintSLAStatus;
  slaLabel: string;
  slaHours: number;
  slaTargetHours: number;
  resolutionTarget: string;
  reportCount: number;
  nearbyCount: number;
  escalationId?: string;
  resolutionStatus: ComplaintResolutionStatus;
  notes: string;
  evidenceCount: number;
  officer: {
    name: string;
    assignedDate: string;
    expectedVisit: string;
    slaRisk: string;
    supervisor: string;
  };
  timeline: ComplaintTimelineStep[];
  activityLog: ComplaintActivityEntry[];
  evidence: ComplaintRecord["evidence"];
}

function nowStr(): string {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function patchComplaint(
  complaints: ComplaintRecord[],
  id: string,
  patch: Partial<ComplaintRecord>
): ComplaintRecord[] {
  return complaints.map((c) => (c.id === id ? { ...c, ...patch, updatedDate: nowStr() } : c));
}

function appendActivity(
  c: ComplaintRecord,
  actor: string,
  action: string
): ComplaintActivityEntry[] {
  return [{ time: nowStr(), actor, action }, ...c.activityLog];
}

export function toComplaintDetailView(c: ComplaintRecord): ComplaintDetailView {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    priority: c.priority,
    status: c.status,
    createdDate: c.createdDate,
    updatedDate: c.updatedDate,
    location: c.location,
    coordinates: c.coordinates,
    subDistrict: c.subDistrict,
    zone: c.zone,
    slaStatus: c.slaStatus,
    slaLabel: c.slaLabel,
    slaHours: c.slaHours,
    slaTargetHours: c.slaTargetHours,
    resolutionTarget: c.resolutionTarget,
    reportCount: c.reportCount,
    nearbyCount: c.nearbyCount,
    escalationId: c.escalationId,
    resolutionStatus: c.resolutionStatus,
    notes: c.notes,
    evidenceCount: c.evidenceCount,
    officer: {
      name: c.officer || "Unassigned",
      assignedDate: c.officerAssignedDate,
      expectedVisit: c.expectedVisit,
      slaRisk: c.slaRisk,
      supervisor: c.supervisor,
    },
    timeline: c.timeline,
    activityLog: c.activityLog,
    evidence: c.evidence,
  };
}

function fallbackComplaint(id: string): ComplaintRecord {
  return {
    id,
    title: `Complaint ${id}`,
    description: "No additional details available for this complaint.",
    category: "General",
    priority: "Medium",
    status: "Open",
    location: "Unknown location",
    coordinates: "N/A",
    subDistrict: "Panvel Taluka",
    zone: "N/A",
    date: "—",
    createdDate: "—",
    updatedDate: "—",
    officer: "",
    officerAssignedDate: "—",
    expectedVisit: "—",
    slaRisk: "Low",
    supervisor: "—",
    slaStatus: "On Track",
    slaLabel: "48h Left",
    slaHours: 48,
    slaTargetHours: 48,
    resolutionTarget: "—",
    reportCount: 1,
    nearbyCount: 0,
    resolutionStatus: "None",
    notes: "",
    evidenceCount: 0,
    timeline: [{ label: "Complaint Created", date: "—", done: true, note: "Received" }],
    activityLog: [{ time: "—", actor: "System", action: "Complaint received and registered" }],
    evidence: { citizen: [], inspection: [], resolution: [] },
  };
}

function mapEscalationStatus(status: EscalationStatus): ComplaintStatus {
  if (status === "Resolved") return "Resolved";
  if (status === "Closed") return "Rejected";
  return "Escalated";
}

interface ComplaintState {
  complaints: ComplaintRecord[];
  getById: (id: string) => ComplaintRecord;
  getAll: () => ComplaintRecord[];
  assignOfficer: (id: string, officer: string, actor?: string) => void;
  setStatus: (id: string, status: ComplaintStatus, actor?: string, action?: string) => void;
  setPriority: (id: string, priority: ComplaintPriority) => void;
  linkEscalation: (id: string, escalationId: string, actor?: string) => void;
  setResolutionStatus: (
    id: string,
    status: ComplaintResolutionStatus,
    resolutionRequestId?: string,
    note?: string
  ) => void;
  appendActivity: (id: string, actor: string, action: string) => void;
  appendNote: (id: string, note: string) => void;
  addEvidence: (
    id: string,
    section: "citizen" | "inspection" | "resolution",
    file: ComplaintEvidenceFile
  ) => void;
  syncFromEscalation: (esc: Escalation) => void;
}

export const useComplaintStore = create<ComplaintState>()(
  persist(
    (set, get) => ({
      complaints: COMPLAINT_SEED,

      getById: (id) => get().complaints.find((c) => c.id === id) ?? fallbackComplaint(id),

      getAll: () => get().complaints,

      assignOfficer: (id, officer, actor = "System") => {
        const c = get().complaints.find((x) => x.id === id);
        if (!c) return;
        const status: ComplaintStatus = c.status === "Open" ? "Assigned" : c.status;
        set({
          complaints: patchComplaint(get().complaints, id, {
            officer,
            status,
            officerAssignedDate: nowStr(),
            activityLog: appendActivity(c, actor, `Complaint assigned to ${officer}`),
          }),
        });
        // Push notification for assignment
        useAdminNotificationStore.getState().push({
          portal: "sub-district",
          type: "escalation_update",
          title: "Officer assigned",
          message: `${id} assigned to ${officer}`,
          entityId: id,
          href: `/sub-district-admin/dashboard/complaints/${id}`,
        });
      },

      setStatus: (id, status, actor = "System", action) => {
        const c = get().complaints.find((x) => x.id === id);
        if (!c) return;
        set({
          complaints: patchComplaint(get().complaints, id, {
            status,
            activityLog: appendActivity(c, actor, action ?? `Status updated to ${status}`),
          }),
        });
        // Award XP on resolution
        if (status === "Resolved") {
          awardXP("sub-district", "complaint_resolved", `Complaint ${id} resolved`);
          incrementBadgeProgress("sub-district", "sb6"); // Resolution King badge
        }
      },

      setPriority: (id, priority) => {
        set({ complaints: patchComplaint(get().complaints, id, { priority }) });
      },

      linkEscalation: (id, escalationId, actor = "Sub-District") => {
        const c = get().complaints.find((x) => x.id === id);
        if (!c) return;
        set({
          complaints: patchComplaint(get().complaints, id, {
            escalationId,
            status: "Escalated",
            activityLog: appendActivity(c, actor, `Linked to district escalation ${escalationId}`),
          }),
        });
      },

      setResolutionStatus: (id, resolutionStatus, resolutionRequestId, note) => {
        const c = get().complaints.find((x) => x.id === id);
        if (!c) return;
        const status: ComplaintStatus =
          resolutionStatus === "Approved"
            ? "Resolved"
            : resolutionStatus === "Rejected"
              ? "Rejected"
              : c.status;
        set({
          complaints: patchComplaint(get().complaints, id, {
            resolutionStatus,
            resolutionRequestId: resolutionRequestId ?? c.resolutionRequestId,
            status,
            notes: note ? (c.notes ? `${c.notes}\n${note}` : note) : c.notes,
            activityLog: appendActivity(
              c,
              "District Admin",
              `Resolution ${resolutionStatus}${note ? ` — ${note}` : ""}`
            ),
          }),
        });
      },

      appendActivity: (id, actor, action) => {
        const c = get().complaints.find((x) => x.id === id);
        if (!c) return;
        set({
          complaints: patchComplaint(get().complaints, id, {
            activityLog: appendActivity(c, actor, action),
          }),
        });
      },

      appendNote: (id, note) => {
        const c = get().complaints.find((x) => x.id === id);
        if (!c) return;
        set({
          complaints: patchComplaint(get().complaints, id, {
            notes: c.notes ? `${c.notes}\n${note}` : note,
          }),
        });
      },

      addEvidence: (id, section, file) => {
        const c = get().complaints.find((x) => x.id === id);
        if (!c) return;
        const evidence = {
          ...c.evidence,
          [section]: [...c.evidence[section], file],
        };
        set({
          complaints: patchComplaint(get().complaints, id, {
            evidence,
            evidenceCount: c.evidenceCount + 1,
            activityLog: appendActivity(c, file.by, `Evidence added — ${file.label}`),
          }),
        });
      },

      syncFromEscalation: (esc) => {
        if (!esc.sourceComplaintId) return;
        const c = get().complaints.find((x) => x.id === esc.sourceComplaintId);
        if (!c) return;

        const targetStatus = mapEscalationStatus(esc.status);
        const targetOfficer = (esc.assignedTo && esc.assignedTo !== "Unassigned") ? esc.assignedTo : c.officer;
        const targetEscalationId = esc.id;

        if (
          c.escalationId === targetEscalationId &&
          c.status === targetStatus &&
          c.officer === targetOfficer
        ) {
          return;
        }

        const patch: Partial<ComplaintRecord> = {
          escalationId: targetEscalationId,
          status: targetStatus,
        };
        if (esc.assignedTo && esc.assignedTo !== "Unassigned") {
          patch.officer = esc.assignedTo;
        }
        set({
          complaints: patchComplaint(get().complaints, esc.sourceComplaintId, patch),
        });
      },
    }),
    adminPersistOptions("complaints", (s) => ({ complaints: s.complaints }))
  )
);

/** Sync complaint when district acts on linked escalation */
export function syncComplaintFromEscalation(esc: Escalation) {
  useComplaintStore.getState().syncFromEscalation(esc);
}

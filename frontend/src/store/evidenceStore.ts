/**
 * evidenceStore.ts — Super Admin evidence review workflows (frontend only).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuditLogStore } from "@/store/auditLogStore";
import { useAdminNotificationStore } from "@/store/adminNotificationStore";
import { adminPersistOptions } from "@/lib/store-persist";
import { awardXP, incrementBadgeProgress } from "@/lib/xp-dispatcher";
import { GOVERNANCE_EVIDENCE } from "@/lib/governance/seeds";

export type EvidenceStatus =
  | "Pending Review"
  | "Approved"
  | "Rejected"
  | "Flagged"
  | "Additional Requested";

export type EvidenceEntityType = "Complaint" | "Escalation";

export interface EvidenceFile {
  id: string;
  label: string;
  type: "image" | "pdf" | "video";
  size: string;
  /** Client-side preview URL (not persisted across refresh) */
  previewUrl?: string;
}

export interface EvidenceActivityEntry {
  time: string;
  actor: string;
  action: string;
}

export interface EvidenceTimelineStep {
  label: string;
  date: string;
  done: boolean;
  note: string;
}

export interface EvidenceRecord {
  id: string;
  relatedEntityId: string;
  relatedEntityType: EvidenceEntityType;
  title: string;
  district: string;
  state: string;
  uploadedBy: string;
  uploadedAt: string;
  status: EvidenceStatus;
  notes: string;
  files: EvidenceFile[];
  activityLog: EvidenceActivityEntry[];
  timeline: EvidenceTimelineStep[];
}

function nowStr(): string {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function logAudit(
  entityId: string,
  action: string,
  previousStatus: string,
  newStatus: string,
  role = "Super Admin"
) {
  useAuditLogStore.getState().addEntry({
    userRole: role,
    actor: role,
    action,
    entityId,
    previousStatus,
    newStatus,
    category: "Evidence Decisions",
    ip: role === "Super Admin" ? "192.168.1.10" : "10.0.0.42",
  });
}

function notifyDistrictEvidence(entityId: string, title: string, message: string) {
  useAdminNotificationStore.getState().push({
    portal: "district",
    type: "evidence_decision",
    title,
    message,
    entityId,
    href: "/district-admin/evidence",
  });
}

const SEED = GOVERNANCE_EVIDENCE;

function patchTimeline(
  timeline: EvidenceTimelineStep[],
  label: string,
  patch: Partial<EvidenceTimelineStep>
): EvidenceTimelineStep[] {
  return timeline.map((s) => (s.label === label ? { ...s, ...patch } : s));
}

function updateRecord(records: EvidenceRecord[], id: string, patch: Partial<EvidenceRecord>): EvidenceRecord[] {
  return records.map((r) => (r.id === id ? { ...r, ...patch } : r));
}

export type EvidenceSubmitInput = Omit<
  EvidenceRecord,
  "id" | "status" | "uploadedAt" | "activityLog" | "timeline"
>;

interface EvidenceState {
  records: EvidenceRecord[];
  nextEvId: number;
  submitEvidence: (entry: EvidenceSubmitInput) => string;
  submitAdditionalEvidence: (id: string, files: EvidenceFile[], note: string) => void;
  approveEvidence: (id: string, note: string) => void;
  rejectEvidence: (id: string, reason: string, note: string) => void;
  flagForInvestigation: (id: string, note: string) => void;
  requestAdditionalEvidence: (id: string, message: string) => void;
  appendNote: (id: string, note: string) => void;
}

export const useEvidenceStore = create<EvidenceState>()(
  persist(
    (set, get) => ({
  records: SEED,
  nextEvId: 9,

  submitEvidence: (entry) => {
    const id = `EV-2026-${String(get().nextEvId).padStart(3, "0")}`;
    set({ nextEvId: get().nextEvId + 1 });
    const time = nowStr();
    const rec: EvidenceRecord = {
      ...entry,
      id,
      uploadedAt: time,
      status: "Pending Review",
      timeline: [
        { label: "Evidence Uploaded", date: time, done: true, note: entry.uploadedBy },
        { label: "Super Admin Review", date: "Pending", done: false, note: "" },
        { label: "Decision Recorded", date: "Pending", done: false, note: "" },
      ],
      activityLog: [{ time, actor: entry.uploadedBy, action: `Submitted evidence ${id} for ${entry.relatedEntityId}` }],
    };
    set({ records: [rec, ...get().records] });
    logAudit(id, `Evidence submitted for ${entry.relatedEntityId}`, "—", "Pending Review", "District Admin");
    useAdminNotificationStore.getState().push({
      portal: "super",
      type: "evidence_submitted",
      title: "New evidence submission",
      message: `${id} — ${entry.title}`,
      entityId: id,
      href: `/super-admin/evidence/${id}`,
    });
    if (entry.uploadedBy.includes("Sub-District")) {
      useAdminNotificationStore.getState().push({
        portal: "district",
        type: "evidence_submitted",
        title: "Evidence from sub-district",
        message: `${id} — ${entry.relatedEntityId}`,
        entityId: id,
        href: "/district-admin/evidence",
      });
    }
    // Award XP for evidence submission
    if (entry.uploadedBy.includes("Sub-District")) {
      awardXP("sub-district", "evidence_submitted", `Evidence ${id} submitted`);
      incrementBadgeProgress("sub-district", "sb3"); // Evidence Pro badge
    } else {
      awardXP("district", "evidence_verified", `Evidence ${id} submitted`);
      incrementBadgeProgress("district", "db4"); // Evidence Verifier badge
    }
    return id;
  },

  submitAdditionalEvidence: (id, files, note) => {
    const rec = get().records.find((r) => r.id === id);
    if (!rec) return;
    const time = nowStr();
    set({
      records: updateRecord(get().records, id, {
        status: "Pending Review",
        files: [...rec.files, ...files],
        activityLog: [{ time, actor: rec.uploadedBy, action: `Additional evidence submitted${note ? ` — ${note}` : ""}` }, ...rec.activityLog],
      }),
    });
    useAdminNotificationStore.getState().push({
      portal: "super",
      type: "evidence_submitted",
      title: "Additional evidence received",
      message: `${id} — district uploaded more files`,
      entityId: id,
      href: `/super-admin/evidence/${id}`,
    });
  },

  approveEvidence: (id, note) => {
    const rec = get().records.find((r) => r.id === id);
    if (!rec) return;
    const time = nowStr();
    const prev = rec.status;
    set({
      records: updateRecord(get().records, id, {
        status: "Approved",
        timeline: patchTimeline(
          patchTimeline(rec.timeline, "Super Admin Review", { done: true, date: time, note: "Review complete" }),
          "Decision Recorded",
          { done: true, date: time, note: "Approved" }
        ),
        activityLog: [{ time, actor: "Super Admin", action: `Evidence approved${note ? ` — ${note}` : ""}` }, ...rec.activityLog],
        notes: note ? `${rec.notes}\n\n[${time}] Approved: ${note}` : rec.notes,
      }),
    });
    logAudit(id, `Evidence approved for ${rec.relatedEntityId}`, prev, "Approved");
    notifyDistrictEvidence(id, "Evidence approved", `${id} approved for ${rec.relatedEntityId}`);
  },

  rejectEvidence: (id, reason, note) => {
    const rec = get().records.find((r) => r.id === id);
    if (!rec) return;
    const time = nowStr();
    const prev = rec.status;
    set({
      records: updateRecord(get().records, id, {
        status: "Rejected",
        timeline: patchTimeline(
          patchTimeline(rec.timeline, "Super Admin Review", { done: true, date: time }),
          "Decision Recorded",
          { done: true, date: time, note: `Rejected — ${reason}` }
        ),
        activityLog: [{ time, actor: "Super Admin", action: `Evidence rejected — ${reason}` }, ...rec.activityLog],
        notes: note ? `${rec.notes}\n\n[${time}] Rejected: ${reason}. ${note}` : rec.notes,
      }),
    });
    logAudit(id, `Evidence rejected — ${reason}`, prev, "Rejected");
    notifyDistrictEvidence(id, "Evidence rejected", reason);
  },

  flagForInvestigation: (id, note) => {
    const rec = get().records.find((r) => r.id === id);
    if (!rec) return;
    const time = nowStr();
    const prev = rec.status;
    set({
      records: updateRecord(get().records, id, {
        status: "Flagged",
        timeline: [
          ...patchTimeline(rec.timeline, "Super Admin Review", { done: true, date: time }),
          { label: "Investigation", date: time, done: true, note: note || "Flagged for investigation" },
        ],
        activityLog: [{ time, actor: "Super Admin", action: `Flagged for investigation${note ? ` — ${note}` : ""}` }, ...rec.activityLog],
      }),
    });
    logAudit(id, `Evidence flagged for investigation`, prev, "Flagged");
    notifyDistrictEvidence(id, "Evidence flagged", note || "Under investigation");
  },

  requestAdditionalEvidence: (id, message) => {
    const rec = get().records.find((r) => r.id === id);
    if (!rec) return;
    const time = nowStr();
    const prev = rec.status;
    set({
      records: updateRecord(get().records, id, {
        status: "Additional Requested",
        timeline: patchTimeline(rec.timeline, "Additional Evidence", { done: true, date: time, note: message }),
        activityLog: [{ time, actor: "Super Admin", action: `Additional evidence requested: ${message}` }, ...rec.activityLog],
      }),
    });
    logAudit(id, `Additional evidence requested`, prev, "Additional Requested");
    notifyDistrictEvidence(id, "Additional evidence requested", message);
  },

  appendNote: (id, note) => {
    const rec = get().records.find((r) => r.id === id);
    if (!rec) return;
    const time = nowStr();
    set({
      records: updateRecord(get().records, id, {
        notes: rec.notes ? `${rec.notes}\n\n[${time}] ${note}` : note,
        activityLog: [{ time, actor: "Super Admin", action: `Note added: ${note}` }, ...rec.activityLog],
      }),
    });
  },
}),
    adminPersistOptions("evidence", (s) => ({
      records: s.records.map((r) => ({
        ...r,
        files: r.files.map(({ previewUrl: _p, ...f }) => f),
      })),
      nextEvId: s.nextEvId,
    }))
  )
);

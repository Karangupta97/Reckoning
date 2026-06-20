/**
 * evidenceStore.ts — Super Admin evidence review workflows (frontend only).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuditLogStore } from "@/store/auditLogStore";
import { useAdminNotificationStore } from "@/store/adminNotificationStore";
import { adminPersistOptions } from "@/lib/store-persist";
import { awardXP, incrementBadgeProgress } from "@/lib/xp-dispatcher";

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

const SEED: EvidenceRecord[] = [
  {
    id: "EV-2026-001",
    relatedEntityId: "CMP-1024",
    relatedEntityType: "Complaint",
    title: "NH-48 pothole damage — citizen photos",
    district: "Pune",
    state: "Maharashtra",
    uploadedBy: "Citizen via App",
    uploadedAt: "14 Jun 2026 08:58",
    status: "Pending Review",
    notes: "Three photos showing lane-wide pothole cluster near Pune Bypass.",
    files: [
      { id: "f1", label: "Road damage — front lane", type: "image", size: "2.1 MB" },
      { id: "f2", label: "Road damage — side angle", type: "image", size: "1.8 MB" },
      { id: "f3", label: "Traffic disruption context", type: "image", size: "2.4 MB" },
    ],
    timeline: [
      { label: "Evidence Uploaded", date: "14 Jun 2026 08:58", done: true, note: "Citizen mobile app" },
      { label: "Super Admin Review", date: "Pending", done: false, note: "" },
      { label: "Decision Recorded", date: "Pending", done: false, note: "" },
    ],
    activityLog: [
      { time: "14 Jun 08:58", actor: "Citizen", action: "Uploaded 3 photos for CMP-1024" },
      { time: "14 Jun 09:00", actor: "System", action: "Routed to Super Admin evidence queue" },
    ],
  },
  {
    id: "EV-2026-002",
    relatedEntityId: "CMP-1025",
    relatedEntityType: "Complaint",
    title: "Budget leak audit documents",
    district: "Bengaluru",
    state: "Karnataka",
    uploadedBy: "Audit Officer",
    uploadedAt: "12 Jun 2026 10:10",
    status: "Pending Review",
    notes: "Financial audit report and expenditure breakdown for Smart Road Initiative.",
    files: [
      { id: "f1", label: "Q2 Audit Report", type: "pdf", size: "4.2 MB" },
      { id: "f2", label: "Expenditure Breakdown", type: "pdf", size: "1.6 MB" },
    ],
    timeline: [
      { label: "Evidence Uploaded", date: "12 Jun 2026 10:10", done: true, note: "Audit officer portal" },
      { label: "Super Admin Review", date: "Pending", done: false, note: "" },
      { label: "Decision Recorded", date: "Pending", done: false, note: "" },
    ],
    activityLog: [
      { time: "12 Jun 10:10", actor: "Audit Officer", action: "Uploaded audit documents for CMP-1025" },
    ],
  },
  {
    id: "EV-2026-003",
    relatedEntityId: "ESC-4022",
    relatedEntityType: "Escalation",
    title: "Bridge structural crack inspection",
    district: "Panvel",
    state: "Maharashtra",
    uploadedBy: "District Officer A. Singh",
    uploadedAt: "01 Jun 2026 14:30",
    status: "Approved",
    notes: "Engineering inspection photos approved for escalation ESC-4022.",
    files: [
      { id: "f1", label: "Crack close-up — pier 3", type: "image", size: "3.0 MB" },
      { id: "f2", label: "Structural engineer report", type: "pdf", size: "2.2 MB" },
    ],
    timeline: [
      { label: "Evidence Uploaded", date: "01 Jun 2026 14:30", done: true, note: "District officer" },
      { label: "Super Admin Review", date: "02 Jun 2026 09:00", done: true, note: "Reviewed by Super Admin" },
      { label: "Decision Recorded", date: "02 Jun 2026 09:15", done: true, note: "Approved" },
    ],
    activityLog: [
      { time: "02 Jun 09:15", actor: "Super Admin", action: "Evidence approved for ESC-4022" },
      { time: "01 Jun 14:30", actor: "District Officer A. Singh", action: "Uploaded bridge inspection evidence" },
    ],
  },
  {
    id: "EV-2026-004",
    relatedEntityId: "ESC-4024",
    relatedEntityType: "Escalation",
    title: "NH-48 pothole cluster — officer photos",
    district: "Mahad",
    state: "Maharashtra",
    uploadedBy: "District Officer P. Iyer",
    uploadedAt: "26 May 2026 16:00",
    status: "Flagged",
    notes: "Image metadata inconsistent with reported location — flagged for investigation.",
    files: [
      { id: "f1", label: "Pothole cluster — aerial", type: "image", size: "2.8 MB" },
      { id: "f2", label: "Site visit video", type: "video", size: "18.4 MB" },
    ],
    timeline: [
      { label: "Evidence Uploaded", date: "26 May 2026 16:00", done: true, note: "District officer" },
      { label: "Super Admin Review", date: "02 Jun 2026 15:40", done: true, note: "Metadata review" },
      { label: "Investigation", date: "02 Jun 2026 15:40", done: true, note: "Flagged" },
    ],
    activityLog: [
      { time: "02 Jun 15:40", actor: "Super Admin", action: "Flagged for investigation — metadata mismatch" },
      { time: "26 May 16:00", actor: "District Officer P. Iyer", action: "Uploaded site evidence for ESC-4024" },
    ],
  },
  {
    id: "EV-2026-005",
    relatedEntityId: "CMP-1026",
    relatedEntityType: "Complaint",
    title: "Quality issue — road crack photos",
    district: "Raigad District",
    state: "Maharashtra",
    uploadedBy: "Citizen via Portal",
    uploadedAt: "13 Jun 2026 13:55",
    status: "Rejected",
    notes: "Rejected — images too low resolution for QA assessment. Citizen asked to re-upload.",
    files: [{ id: "f1", label: "Road crack close-up", type: "image", size: "420 KB" }],
    timeline: [
      { label: "Evidence Uploaded", date: "13 Jun 2026 13:55", done: true, note: "Citizen portal" },
      { label: "Super Admin Review", date: "14 Jun 2026 10:00", done: true, note: "Quality check failed" },
      { label: "Decision Recorded", date: "14 Jun 2026 10:05", done: true, note: "Rejected" },
    ],
    activityLog: [
      { time: "14 Jun 10:05", actor: "Super Admin", action: "Evidence rejected — insufficient resolution" },
      { time: "13 Jun 13:55", actor: "Citizen", action: "Uploaded photo for CMP-1026" },
    ],
  },
  {
    id: "EV-2026-006",
    relatedEntityId: "ESC-4030",
    relatedEntityType: "Escalation",
    title: "Accident black spot — dashcam footage",
    district: "Panvel",
    state: "Maharashtra",
    uploadedBy: "Traffic Police Liaison",
    uploadedAt: "03 Jun 2026 11:20",
    status: "Additional Requested",
    notes: "Additional wide-angle site photos requested to corroborate dashcam timestamps.",
    files: [
      { id: "f1", label: "Dashcam clip — incident", type: "video", size: "24.1 MB" },
      { id: "f2", label: "Police incident report", type: "pdf", size: "890 KB" },
    ],
    timeline: [
      { label: "Evidence Uploaded", date: "03 Jun 2026 11:20", done: true, note: "Traffic police" },
      { label: "Super Admin Review", date: "04 Jun 2026 08:30", done: true, note: "Partial review" },
      { label: "Additional Evidence", date: "04 Jun 2026 08:30", done: true, note: "Request sent" },
    ],
    activityLog: [
      { time: "04 Jun 08:30", actor: "Super Admin", action: "Requested additional wide-angle site photos" },
      { time: "03 Jun 11:20", actor: "Traffic Police Liaison", action: "Submitted dashcam evidence for ESC-4030" },
    ],
  },
  {
    id: "EV-2026-007",
    relatedEntityId: "ESC-4021",
    relatedEntityType: "Escalation",
    title: "Sewage overflow — site documentation",
    district: "Alibag",
    state: "Maharashtra",
    uploadedBy: "Sub-District Officer R. Sharma",
    uploadedAt: "28 May 2026 09:45",
    status: "Pending Review",
    notes: "Before/after photos and drainage map overlay for sewage overflow escalation.",
    files: [
      { id: "f1", label: "Overflow — main road", type: "image", size: "1.9 MB" },
      { id: "f2", label: "Drainage map overlay", type: "pdf", size: "1.2 MB" },
      { id: "f3", label: "Citizen complaint video", type: "video", size: "8.6 MB" },
    ],
    timeline: [
      { label: "Evidence Uploaded", date: "28 May 2026 09:45", done: true, note: "Sub-district officer" },
      { label: "Super Admin Review", date: "Pending", done: false, note: "" },
      { label: "Decision Recorded", date: "Pending", done: false, note: "" },
    ],
    activityLog: [
      { time: "28 May 09:45", actor: "Sub-District Officer R. Sharma", action: "Uploaded site documentation for ESC-4021" },
    ],
  },
  {
    id: "EV-2026-008",
    relatedEntityId: "CMP-1027",
    relatedEntityType: "Complaint",
    title: "Highway delay — contractor progress photos",
    district: "Chennai",
    state: "Tamil Nadu",
    uploadedBy: "Contractor Team B",
    uploadedAt: "05 Jun 2026 17:00",
    status: "Approved",
    notes: "Progress documentation approved for resolved delay complaint.",
    files: [
      { id: "f1", label: "Work resumed — site A", type: "image", size: "2.0 MB" },
      { id: "f2", label: "Material delivery receipt", type: "pdf", size: "540 KB" },
    ],
    timeline: [
      { label: "Evidence Uploaded", date: "05 Jun 2026 17:00", done: true, note: "Contractor portal" },
      { label: "Super Admin Review", date: "06 Jun 2026 10:00", done: true, note: "Verified progress" },
      { label: "Decision Recorded", date: "06 Jun 2026 10:05", done: true, note: "Approved" },
    ],
    activityLog: [
      { time: "06 Jun 10:05", actor: "Super Admin", action: "Evidence approved for CMP-1027" },
      { time: "05 Jun 17:00", actor: "Contractor Team B", action: "Uploaded progress photos" },
    ],
  },
];

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

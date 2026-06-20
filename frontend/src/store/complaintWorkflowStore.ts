/**
 * complaintWorkflowStore.ts — Sub-district ↔ District complaint workflows (frontend only).
 * Resolution requests, work tickets, and closure approvals.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adminPersistOptions } from "@/lib/store-persist";
import { useAdminNotificationStore } from "@/store/adminNotificationStore";
import { SUB_DISTRICT_CONFIG } from "@/lib/sub-district-config";
import { districtLabel } from "@/lib/district-config";
import { useComplaintStore } from "@/store/complaintStore";
import { TICKET_SEED } from "@/lib/ticket-seed";
import { awardXP, incrementBadgeProgress } from "@/lib/xp-dispatcher";

export type ResolutionRequestStatus =
  | "Pending District Review"
  | "Approved"
  | "Rejected"
  | "Clarification Requested";

export type TicketStatus = "Open" | "In Progress" | "Overdue" | "Completed";
export type TicketPriority = "Critical" | "High" | "Medium" | "Low";

export interface TicketTimelineStep {
  label: string;
  time: string;
  done: boolean;
}

export interface TicketMaterial {
  item: string;
  qty: string;
  cost: string;
}

export interface TicketAttachment {
  name: string;
  size: string;
}

export interface ResolutionRequest {
  id: string;
  complaintId: string;
  escalationId?: string;
  subDistrict: string;
  district: string;
  state: string;
  resolutionNotes: string;
  workPerformed: string;
  costIncurred: string;
  completionDate: string;
  status: ResolutionRequestStatus;
  submittedAt: string;
  submittedBy: string;
  clarificationMessage?: string;
  districtNote?: string;
  evidenceId?: string;
  /** Resolution evidence — before/after verification */
  beforePhotos?: string[];
  afterPhotos?: string[];
  completionNotes?: string;
  workCompletionDate?: string;
  estimatedWorkCost?: string;
}

export interface WorkTicket {
  id: string;
  complaintId: string;
  title: string;
  description: string;
  team: string;
  assignedOfficer: string;
  teamLead?: string;
  teamMembers?: string[];
  teamContact?: string;
  priority: TicketPriority;
  status: TicketStatus;
  created: string;
  due: string;
  submittedBy: string;
  subDistrict: string;
  notes: string;
  timeline: TicketTimelineStep[];
  materials?: TicketMaterial[];
  attachments?: TicketAttachment[];
}

function nowStr(): string {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function todayDate(): string {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(",", "");
}

function patchTicket(tickets: WorkTicket[], id: string, patch: Partial<WorkTicket>): WorkTicket[] {
  return tickets.map((t) => (t.id === id ? { ...t, ...patch } : t));
}

interface ComplaintWorkflowState {
  resolutions: ResolutionRequest[];
  tickets: WorkTicket[];
  nextResId: number;
  nextTktId: number;
  submitResolutionRequest: (input: {
    complaintId: string;
    escalationId?: string;
    resolutionNotes: string;
    workPerformed: string;
    costIncurred: string;
    completionDate: string;
    evidenceId?: string;
    submittedBy?: string;
    beforePhotos?: string[];
    afterPhotos?: string[];
    completionNotes?: string;
    workCompletionDate?: string;
    estimatedWorkCost?: string;
  }) => string;
  approveResolution: (id: string, note?: string, actor?: string) => void;
  rejectResolution: (id: string, note: string, actor?: string) => void;
  requestResolutionClarification: (id: string, message: string, actor?: string) => void;
  submitTicket: (input: {
    complaintId: string;
    team: string;
    priority: string;
    due: string;
    assignedOfficer?: string;
    submittedBy?: string;
  }) => string;
  getTicketById: (id: string) => WorkTicket | undefined;
  getTickets: () => WorkTicket[];
  updateTicketStatus: (id: string, status: TicketStatus, actor?: string) => void;
  updateTicketPriority: (id: string, priority: TicketPriority, actor?: string) => void;
  assignTicketOfficer: (id: string, officer: string, actor?: string) => void;
  appendTicketNote: (id: string, note: string, actor?: string) => void;
  appendTicketTimeline: (id: string, step: TicketTimelineStep) => void;
  getResolutionByComplaint: (complaintId: string) => ResolutionRequest | undefined;
  getResolutionByEscalation: (escalationId: string) => ResolutionRequest | undefined;
  getPendingResolutions: () => ResolutionRequest[];
}

export const useComplaintWorkflowStore = create<ComplaintWorkflowState>()(
  persist(
    (set, get) => ({
      resolutions: [],
      tickets: TICKET_SEED,
      nextResId: 100,
      nextTktId: 511,

      submitResolutionRequest: (input) => {
        const id = `RES-${get().nextResId}`;
        set({ nextResId: get().nextResId + 1 });
        const req: ResolutionRequest = {
          id,
          complaintId: input.complaintId,
          escalationId: input.escalationId,
          subDistrict: SUB_DISTRICT_CONFIG.name,
          district: districtLabel,
          state: SUB_DISTRICT_CONFIG.state,
          resolutionNotes: input.resolutionNotes,
          workPerformed: input.workPerformed,
          costIncurred: input.costIncurred,
          completionDate: input.completionDate,
          status: "Pending District Review",
          submittedAt: nowStr(),
          submittedBy: input.submittedBy ?? "Sub-District Officer",
          evidenceId: input.evidenceId,
          beforePhotos: input.beforePhotos,
          afterPhotos: input.afterPhotos,
          completionNotes: input.completionNotes,
          workCompletionDate: input.workCompletionDate,
          estimatedWorkCost: input.estimatedWorkCost,
        };
        set({ resolutions: [req, ...get().resolutions] });
        const escHref = input.escalationId
          ? `/district-admin/dashboard/escalation/${input.escalationId}`
          : "/district-admin/dashboard/escalation";
        useAdminNotificationStore.getState().push({
          portal: "district",
          type: "resolution_submitted",
          title: "Resolution request submitted",
          message: `${input.complaintId} — pending closure approval`,
          entityId: id,
          href: escHref,
        });
        useComplaintStore.getState().setResolutionStatus(
          input.complaintId,
          "Pending District Review",
          id,
          input.resolutionNotes
        );
        return id;
      },

      approveResolution: (id, note, actor = "District Admin") => {
        const req = get().resolutions.find((r) => r.id === id);
        if (!req) return;
        set({
          resolutions: get().resolutions.map((r) =>
            r.id === id
              ? { ...r, status: "Approved" as const, districtNote: note ?? "Closure approved" }
              : r
          ),
        });
        useAdminNotificationStore.getState().push({
          portal: "sub-district",
          type: "resolution_decision",
          title: "Closure approved",
          message: `${req.complaintId} — district approved resolution`,
          entityId: req.complaintId,
          href: `/sub-district-admin/dashboard/complaints/${req.complaintId}`,
        });
        useComplaintStore.getState().setResolutionStatus(req.complaintId, "Approved", id, note);
        // Award XP for resolution approval
        awardXP("sub-district", "resolution_approved", `Resolution ${id} approved`);
        awardXP("district", "complaint_resolved", `Resolution ${id} approved for ${req.complaintId}`);
      },

      rejectResolution: (id, note, actor = "District Admin") => {
        const req = get().resolutions.find((r) => r.id === id);
        if (!req) return;
        set({
          resolutions: get().resolutions.map((r) =>
            r.id === id ? { ...r, status: "Rejected" as const, districtNote: note } : r
          ),
        });
        useAdminNotificationStore.getState().push({
          portal: "sub-district",
          type: "resolution_decision",
          title: "Closure rejected",
          message: `${req.complaintId} — ${note}`,
          entityId: req.complaintId,
          href: `/sub-district-admin/dashboard/complaints/${req.complaintId}`,
        });
        useComplaintStore.getState().setResolutionStatus(req.complaintId, "Rejected", id, note);
      },

      requestResolutionClarification: (id, message, actor = "District Admin") => {
        const req = get().resolutions.find((r) => r.id === id);
        if (!req) return;
        set({
          resolutions: get().resolutions.map((r) =>
            r.id === id
              ? { ...r, status: "Clarification Requested" as const, clarificationMessage: message }
              : r
          ),
        });
        useAdminNotificationStore.getState().push({
          portal: "sub-district",
          type: "clarification_request",
          title: "Clarification requested",
          message: `${req.complaintId} — ${message}`,
          entityId: req.complaintId,
          href: `/sub-district-admin/dashboard/complaints/${req.complaintId}/resolve`,
        });
        useComplaintStore.getState().setResolutionStatus(
          req.complaintId,
          "Clarification Requested",
          id,
          message
        );
      },

      submitTicket: (input) => {
        const id = `TKT-${get().nextTktId}`;
        set({ nextTktId: get().nextTktId + 1 });
        const complaint = useComplaintStore.getState().getById(input.complaintId);
        const time = nowStr();
        const ticket: WorkTicket = {
          id,
          complaintId: input.complaintId,
          title: `Work order — ${complaint.title}`,
          description: complaint.description,
          team: input.team,
          assignedOfficer: input.assignedOfficer ?? input.team,
          teamLead: input.assignedOfficer,
          priority: input.priority as TicketPriority,
          status: "Open",
          created: todayDate(),
          due: input.due,
          submittedBy: input.submittedBy ?? "Sub-District Officer",
          subDistrict: SUB_DISTRICT_CONFIG.name,
          notes: "",
          timeline: [
            { label: "Ticket Created", time, done: true },
            { label: "Team Assigned", time: "Pending", done: false },
          ],
        };
        set({ tickets: [ticket, ...get().tickets] });
        useAdminNotificationStore.getState().push({
          portal: "district",
          type: "ticket_submitted",
          title: "New work ticket",
          message: `${id} for ${input.complaintId} — ${input.team}`,
          entityId: id,
          href: "/district-admin/dashboard/escalation",
        });
        return id;
      },

      getTicketById: (id) => get().tickets.find((t) => t.id === id),

      getTickets: () => get().tickets,

      updateTicketStatus: (id, status, actor = "Sub-District Officer") => {
        const t = get().tickets.find((x) => x.id === id);
        if (!t) return;
        const timeline = [
          ...t.timeline,
          { label: `Status → ${status}`, time: nowStr(), done: true },
        ];
        set({
          tickets: patchTicket(get().tickets, id, { status, timeline }),
        });
        // Award XP when ticket is completed
        if (status === "Completed") {
          awardXP("sub-district", "ticket_completed", `Ticket ${id} completed`);
          incrementBadgeProgress("sub-district", "sb1"); // Ticket Champion badge
        }
      },

      updateTicketPriority: (id, priority, actor = "Sub-District Officer") => {
        const t = get().tickets.find((x) => x.id === id);
        if (!t) return;
        set({
          tickets: patchTicket(get().tickets, id, { priority }),
        });
      },

      assignTicketOfficer: (id, officer, actor = "Sub-District Officer") => {
        const t = get().tickets.find((x) => x.id === id);
        if (!t) return;
        const timeline = t.timeline.some((s) => s.label === "Team Assigned")
          ? t.timeline.map((s) =>
              s.label === "Team Assigned" ? { ...s, time: nowStr(), done: true } : s
            )
          : [...t.timeline, { label: "Team Assigned", time: nowStr(), done: true }];
        set({
          tickets: patchTicket(get().tickets, id, {
            assignedOfficer: officer,
            teamLead: officer,
            status: t.status === "Open" ? "In Progress" : t.status,
            timeline,
          }),
        });
      },

      appendTicketNote: (id, note, actor = "Sub-District Officer") => {
        const t = get().tickets.find((x) => x.id === id);
        if (!t || !note.trim()) return;
        const entry = `[${nowStr()}] ${note.trim()}`;
        set({
          tickets: patchTicket(get().tickets, id, {
            notes: t.notes ? `${t.notes}\n${entry}` : entry,
          }),
        });
      },

      appendTicketTimeline: (id, step) => {
        const t = get().tickets.find((x) => x.id === id);
        if (!t) return;
        set({
          tickets: patchTicket(get().tickets, id, {
            timeline: [...t.timeline, step],
          }),
        });
      },

      getResolutionByComplaint: (complaintId) =>
        get().resolutions.find((r) => r.complaintId === complaintId),

      getResolutionByEscalation: (escalationId) =>
        get().resolutions.find((r) => r.escalationId === escalationId),

      getPendingResolutions: () =>
        get().resolutions.filter((r) => r.status === "Pending District Review"),
    }),
    adminPersistOptions("complaint-workflow", (s) => ({
      resolutions: s.resolutions,
      tickets: s.tickets,
      nextResId: s.nextResId,
      nextTktId: s.nextTktId,
    }))
  )
);

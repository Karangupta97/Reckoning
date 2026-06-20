"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Calendar,
  CheckCircle2, Clock, AlertTriangle, Camera, FileText,
  ShieldAlert, UserCheck, Timer, ZoomIn, ChevronLeft,
  ChevronRight, Download, X, ExternalLink, Map,
  Activity, MessageSquare, TrendingUp, ArrowUpRight,
  ClipboardCheck, Wrench, Search, CircleDot, Check,
  ChevronDown, Share2,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useEscalationStore } from "@/store/escalationStore";
import type { EscalationPriority, EscalationCategory } from "@/store/escalationStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";
import {
  useComplaintStore,
  toComplaintDetailView,
  type ComplaintDetailView,
  type ComplaintSLAStatus,
  type ComplaintStatus,
} from "@/store/complaintStore";
import { SUB_DISTRICT_CONFIG } from "@/lib/sub-district-config";
import { useAdminNotificationStore } from "@/store/adminNotificationStore";
import IndiaMap from "@/components/map/IndiaMap";
import { RelatedRecordsPanel } from "@/components/admin/RelatedRecordsPanel";
import { CaseJourneyTimeline } from "@/components/admin/CaseJourneyTimeline";
import { ClarificationThread, parseNotesToThread, ClarificationRequiredBadge } from "@/components/admin/ClarificationThread";
import { getRelatedRecordsForComplaint, buildCaseJourney } from "@/lib/case-traceability";
import { ImpactCard } from "@/components/citizen/ImpactCard";
import { CitizenTransparencyTimeline } from "@/components/citizen/CitizenTransparencyTimeline";

type SLAStatus = ComplaintSLAStatus;
type ComplaintDetail = ComplaintDetailView;

/* ─── Helpers ────────────────────────────────────────────────── */
const PRIORITY_CLS: Record<string, string> = {
  Critical: "dashboard-table-badge-status-open",
  High:     "dashboard-table-badge-status-escalated",
  Medium:   "dashboard-table-badge-status-review",
  Low:      "dashboard-table-badge-status-resolved",
};
const STATUS_CLS: Record<string, string> = {
  Open: "dashboard-table-badge-status-open", Assigned: "dashboard-table-badge-status-escalated",
  "In Progress": "dashboard-table-badge-status-review", Resolved: "dashboard-table-badge-status-resolved",
  Rejected: "dashboard-table-badge-priority-high", Escalated: "dashboard-table-badge-status-open",
};

/* ─── Breadcrumb ─────────────────────────────────────────────── */
function Breadcrumb({ id }: { id: string }) {
  return (
    <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]" aria-label="Breadcrumb">
      <Link href="/sub-district-admin/dashboard" className="hover:text-[var(--color-text-secondary)] transition-colors">Dashboard</Link>
      <span className="opacity-40">›</span>
      <Link href="/sub-district-admin/dashboard/complaints" className="hover:text-[var(--color-text-secondary)] transition-colors">Complaints</Link>
      <span className="opacity-40">›</span>
      <span className="text-[var(--color-text-secondary)] font-medium font-mono">{id}</span>
    </nav>
  );
}

/* ─── SLA Block ──────────────────────────────────────────────── */
function SlaBlock({ status, label, hours }: { status: "Breached"|"At Risk"|"On Track"; label: string; hours: number }) {
  const cfg = {
    Breached: { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.35)",   color: "var(--color-danger)",  icon: "🔴", pulse: true  },
    "At Risk":{ bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.35)",  color: "var(--sda-amber)",     icon: "🟠", pulse: false },
    "On Track":{ bg:"rgba(34,197,94,0.08)",   border:"rgba(34,197,94,0.3)",     color:"var(--color-success)",  icon: "🟢", pulse: false },
  }[status];
  const pct = status === "Breached" ? 100 : Math.max(0, Math.min(100, (1 - hours / 48) * 100));
  return (
    <div className="rounded-xl border p-4" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Timer size={15} style={{ color: cfg.color }} />
          <span className="text-xs font-bold text-[var(--color-text-primary)]">SLA Status</span>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-bold ${cfg.pulse ? "animate-pulse" : ""}`} style={{ color: cfg.color }}>
          {cfg.icon} {label}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.color }} />
      </div>
      <p className="mt-1.5 text-[10px]" style={{ color: cfg.color }}>
        {status === "Breached" ? "SLA breached — escalation required" : `${status} — ${label} remaining`}
      </p>
    </div>
  );
}

/* ─── Evidence Gallery ───────────────────────────────────────── */
type EvidenceItem = { label: string; by: string; time: string; coords: string };

function EvidenceSection({
  title, color, items, emptyLabel,
}: { title: string; color: string; items: EvidenceItem[]; emptyLabel: string }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{title}</span>
        <span className="text-[10px] text-[var(--color-text-muted)]">({items.length})</span>
      </div>
      {items.length === 0 ? (
        <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)]">
          <span className="text-xs text-[var(--color-text-muted)]">{emptyLabel}</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map((img, i) => (
            <motion.div key={i} whileHover={{ scale: 1.02 }}
              onClick={() => setLightbox(i)}
              className="relative aspect-video rounded-xl border overflow-hidden cursor-zoom-in group"
              style={{ borderColor: `color-mix(in srgb, ${color} 25%, var(--color-border))`, background: `color-mix(in srgb, ${color} 6%, var(--color-surface))` }}>
              {/* Placeholder graphic */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera size={22} style={{ color: `color-mix(in srgb, ${color} 60%, transparent)` }} />
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <ZoomIn size={16} className="text-white" />
              </div>
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 px-2 py-1.5">
                <p className="text-[10px] font-medium text-white truncate">{img.label}</p>
                <p className="text-[9px] text-white/60 truncate">{img.by} · {img.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightbox(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Placeholder */}
              <div className="aspect-video rounded-2xl border border-white/10 flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${color} 8%, #111)` }}>
                <Camera size={48} style={{ color: `color-mix(in srgb, ${color} 50%, transparent)` }} />
              </div>
              {/* Meta */}
              <div className="mt-3 flex items-center justify-between px-1">
                <div>
                  <p className="text-sm font-semibold text-white">{items[lightbox]?.label}</p>
                  <p className="text-xs text-white/50">{items[lightbox]?.by} · {items[lightbox]?.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"><Download size={14} /></button>
                  <button onClick={() => setLightbox(null)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"><X size={14} /></button>
                </div>
              </div>
              {/* Prev / Next */}
              {items.length > 1 && (
                <>
                  <button onClick={() => setLightbox((lightbox - 1 + items.length) % items.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setLightbox((lightbox + 1) % items.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Update Status Dialog ───────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: "Assigned",    label: "Assigned",     icon: UserCheck,    border: "rgba(59,130,246,0.4)",  bg: "rgba(59,130,246,0.1)",  text: "var(--color-info)"    },
  { value: "In Progress", label: "In Progress",  icon: Wrench,       border: "rgba(245,158,11,0.4)",  bg: "rgba(245,158,11,0.1)",  text: "var(--sda-amber)"     },
  { value: "Resolved",    label: "Resolved",     icon: CheckCircle2, border: "rgba(34,197,94,0.4)",   bg: "rgba(34,197,94,0.1)",   text: "var(--color-success)" },
  { value: "Rejected",    label: "Rejected",     icon: AlertTriangle,border: "rgba(239,68,68,0.4)",   bg: "rgba(239,68,68,0.1)",   text: "var(--color-danger)"  },
] as const;

type UpdatableStatus = "Assigned" | "In Progress" | "Resolved" | "Rejected";

function UpdateStatusDialog({
  complaint,
  currentStatus,
  onClose,
  onSubmit,
}: {
  complaint: ComplaintDetail;
  currentStatus: string;
  onClose: () => void;
  onSubmit: (newStatus: UpdatableStatus, note: string) => void;
}) {
  const [selected, setSelected] = useState<UpdatableStatus>(
    STATUS_OPTIONS.some((s) => s.value === currentStatus)
      ? (currentStatus as UpdatableStatus)
      : "In Progress"
  );
  const [note,      setNote]      = useState("");
  const [submitting,setSubmitting] = useState(false);
  const [done,      setDone]       = useState(false);

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setDone(true);
      setSubmitting(false);
      setTimeout(() => onSubmit(selected, note.trim()), 900);
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 320 }}
        className="w-full max-w-md rounded-2xl border shadow-xl flex flex-col"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border"
              style={{ background: "color-mix(in srgb, var(--sda-amber) 10%, transparent)", borderColor: "var(--sda-border-amber)" }}>
              <ClipboardCheck size={15} style={{ color: "var(--sda-amber)" }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Update Status</h3>
              <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">{complaint.id}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Complaint summary pill */}
          <div className="rounded-lg border px-3 py-2 flex items-start gap-2"
            style={{ borderColor: "rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.05)" }}>
            <FileText size={12} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
              {complaint.title}
            </p>
          </div>

          {/* Current status indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">Current status:</span>
            <span className={`dashboard-table-badge ${STATUS_CLS[currentStatus] ?? ""}`}>{currentStatus}</span>
          </div>

          {/* Status selector */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-2">
              Set New Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const active  = selected === opt.value;
                const isCurrent = opt.value === currentStatus;
                return (
                  <button key={opt.value} type="button"
                    onClick={() => setSelected(opt.value)}
                    className="flex items-center gap-2.5 h-11 px-3 rounded-xl border text-xs font-medium transition-all text-left relative"
                    style={{
                      borderColor: active ? opt.border : "var(--color-border)",
                      background:  active ? opt.bg     : "var(--color-surface)",
                      color:       active ? opt.text   : "var(--color-text-muted)",
                    }}>
                    <opt.icon size={14} />
                    <span>{opt.label}</span>
                    {isCurrent && (
                      <span className="ml-auto text-[9px] font-semibold opacity-60">current</span>
                    )}
                    {active && !isCurrent && (
                      <Check size={12} className="ml-auto shrink-0" style={{ color: opt.text }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">
              Note <span className="text-[var(--color-text-muted)] font-normal">(optional)</span>
            </label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Add a note about this status change…"
              className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none transition-colors"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
          </div>

          {/* Info strip */}
          <div className="rounded-lg border px-3 py-2 flex items-center gap-2"
            style={{ borderColor: "rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.05)" }}>
            <Activity size={11} className="text-blue-400 shrink-0" />
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Status change will be logged to the{" "}
              <span className="font-semibold text-blue-400">Officer Notes & Activity</span> timeline.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3 shrink-0">
          <button onClick={onClose} disabled={submitting || done}
            className="h-9 px-4 rounded-lg border text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: done || submitting ? 1 : 1.02 }}
            whileTap={{ scale: done || submitting ? 1 : 0.97 }}
            onClick={handleSubmit}
            disabled={submitting || done || selected === currentStatus}
            className="flex items-center gap-2 h-9 px-5 rounded-lg border text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              borderColor: done ? "rgba(34,197,94,0.4)"  : "var(--sda-border-amber)",
              background:  done ? "rgba(34,197,94,0.1)"  : "color-mix(in srgb, var(--sda-amber) 12%, transparent)",
              color:       done ? "var(--color-success)"  : "var(--sda-amber)",
            }}>
            {done ? (
              <><Check size={14} /> Updated!</>
            ) : submitting ? (
              <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" />
                Saving…</>
            ) : (
              <><ClipboardCheck size={14} /> Update Status</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Escalate Dialog ────────────────────────────────────────── */
// Lightweight dialog collecting reason / priority / notes before pushing
// to the shared escalationStore so district-admin sees it immediately.
const ESCALATION_REASONS = [
  "Funding Required",
  "Technical Expertise Required",
  "Emergency Intervention",
  "Multi-Zone Impact",
  "Policy Approval Required",
  "SLA Breach — Needs District Resources",
  "Critical Safety Hazard",
  "Repeated Citizen Complaints",
  "Officer Unable to Resolve",
];

const ESCALATION_CATEGORIES: EscalationCategory[] = [
  "Sanitation", "Infrastructure", "Flooding", "Road Damage",
  "Utilities", "Civic", "Safety",
];

function EscalateDialog({
  complaint,
  onClose,
  onSubmit,
}: {
  complaint: ComplaintDetail;
  onClose: () => void;
  onSubmit: (escId: string, priority: EscalationPriority, reason: string) => void;
}) {
  const addEscalation = useEscalationStore((s) => s.addEscalation);
  const [reason,   setReason]   = useState(ESCALATION_REASONS[0]);
  const [priority, setPriority] = useState<EscalationPriority>(
    (complaint.priority as EscalationPriority) ?? "High"
  );
  const [notes,    setNotes]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done,     setDone]     = useState(false);
  const [escId,    setEscId]    = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [fundingReason, setFundingReason] = useState("");

  const isFundingRequired = reason === "Funding Required";

  // Map complaint category to escalation category
  const mapCategory = (cat: string): EscalationCategory => {
    const map: Record<string, EscalationCategory> = {
      "Road Damage": "Road Damage", "Sanitation": "Sanitation",
      "Waterlogging": "Flooding",   "Sewage": "Sanitation",
      "Streetlight": "Utilities",   "Garbage": "Sanitation",
      "Water Supply": "Utilities",  "Tree Fallen": "Safety",
      "Noise Pollution": "Civic",
    };
    return map[cat] ?? "Infrastructure";
  };

  const handleSubmit = () => {
    setSubmitting(true);
    // Small artificial delay for UX feel
    setTimeout(() => {
      const id = addEscalation({
        sourceComplaintId: complaint.id,
        title: complaint.title,
        subDistrict: SUB_DISTRICT_CONFIG.name,
        district: `${SUB_DISTRICT_CONFIG.district} District`,
        state: SUB_DISTRICT_CONFIG.state,
        submittedBy: "Sub-District Officer",
        tier: "district",
        category: mapCategory(complaint.category),
        priority,
        reason,
        notes: notes.trim() || undefined,
        fundingRequired: isFundingRequired || undefined,
        estimatedCost: isFundingRequired && estimatedCost ? parseFloat(estimatedCost) : undefined,
        fundingReason: isFundingRequired && fundingReason ? fundingReason : undefined,
      });
      setEscId(id);
      setDone(true);
      setSubmitting(false);
      // Notify district about funding requirement
      if (isFundingRequired) {
        useAdminNotificationStore.getState().push({
          portal: "district",
          type: "escalation_update",
          title: "Funding requirement identified",
          message: `${id} — Est. ₹${estimatedCost || "TBD"} Lakhs — ${fundingReason || reason}`,
          entityId: id,
          href: `/district-admin/dashboard/escalation/${id}`,
        });
      }
      setTimeout(() => onSubmit(id, priority, reason), 1200);
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 320 }}
        className="w-full max-w-md rounded-2xl border shadow-xl flex flex-col"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)", maxHeight: "90vh" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
              <ShieldAlert size={15} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Escalate to District</h3>
              <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">{complaint.id}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Complaint summary pill */}
          <div className="rounded-lg border px-3 py-2 flex items-start gap-2"
            style={{ borderColor: "rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.05)" }}>
            <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
              {complaint.title}
            </p>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">
              Escalation Priority
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["Critical","High","Medium","Low"] as EscalationPriority[]).map((p) => {
                const colors: Record<EscalationPriority, { border: string; bg: string; text: string }> = {
                  Critical: { border: "rgba(239,68,68,0.4)",   bg: "rgba(239,68,68,0.1)",   text: "#ef4444" },
                  High:     { border: "rgba(249,115,22,0.4)",  bg: "rgba(249,115,22,0.1)",  text: "#f97316" },
                  Medium:   { border: "rgba(245,158,11,0.4)",  bg: "rgba(245,158,11,0.1)",  text: "#f59e0b" },
                  Low:      { border: "rgba(34,197,94,0.4)",   bg: "rgba(34,197,94,0.1)",   text: "#22c55e" },
                };
                const c = colors[p];
                const active = priority === p;
                return (
                  <button key={p} type="button" onClick={() => setPriority(p)}
                    className="h-8 rounded-lg border text-[11px] font-semibold transition-all"
                    style={{
                      borderColor: active ? c.border : "var(--color-border)",
                      background:  active ? c.bg    : "var(--color-surface)",
                      color:       active ? c.text  : "var(--color-text-muted)",
                    }}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">
              Reason for Escalation
            </label>
            <div className="relative">
              <select value={reason} onChange={(e) => setReason(e.target.value)}
                className="w-full h-9 appearance-none rounded-lg border pl-3 pr-8 text-xs outline-none transition-colors"
                style={{ borderColor: "var(--sda-border-amber)", background: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
                {ESCALATION_REASONS.map((r) => (
                  <option key={r} value={r} style={{ background: "var(--color-card)" }}>{r}</option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">
              Additional Notes <span className="text-[var(--color-text-muted)] font-normal">(optional)</span>
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe why this needs district-level attention…"
              className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] resize-none focus:outline-none focus:border-orange-500/40 transition-colors" />
          </div>

          {/* Funding fields — shown when "Funding Required" reason selected */}
          {isFundingRequired && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden flex flex-col gap-3 rounded-lg border p-3"
              style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.05)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-400">Funding Details</p>
              <div>
                <label className="text-[11px] font-medium text-[var(--color-text-secondary)] block mb-1">
                  Estimated Cost (₹ Lakhs)
                </label>
                <input type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full h-9 rounded-lg border px-3 text-xs bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-amber-500/40" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--color-text-secondary)] block mb-1">
                  Funding Reason
                </label>
                <select value={fundingReason} onChange={(e) => setFundingReason(e.target.value)}
                  className="w-full h-9 appearance-none rounded-lg border pl-3 pr-8 text-xs bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none">
                  <option value="">Select reason…</option>
                  <option value="Bridge reconstruction">Bridge reconstruction</option>
                  <option value="Road resurfacing">Road resurfacing</option>
                  <option value="Drainage repair">Drainage repair</option>
                  <option value="Emergency flood restoration">Emergency flood restoration</option>
                  <option value="Traffic signal replacement">Traffic signal replacement</option>
                  <option value="Structural reinforcement">Structural reinforcement</option>
                  <option value="Other infrastructure repair">Other infrastructure repair</option>
                </select>
              </div>
            </motion.div>
          )}

          {/* District target info */}
          <div className="rounded-lg border px-3 py-2 flex items-center gap-2"
            style={{ borderColor: "rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.05)" }}>
            <ShieldAlert size={11} className="text-blue-400 shrink-0" />
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Escalation will appear in{" "}
              <span className="font-semibold text-blue-400">District Admin → Escalation Management Center</span>
              {" "}as <span className="font-mono font-semibold text-blue-300">Pending Review</span>.
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3 shrink-0">
          <button onClick={onClose} disabled={submitting || done}
            className="h-9 px-4 rounded-lg border text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: done || submitting ? 1 : 1.02 }}
            whileTap={{ scale: done || submitting ? 1 : 0.97 }}
            onClick={handleSubmit}
            disabled={submitting || done}
            className="flex items-center gap-2 h-9 px-5 rounded-lg border text-sm font-semibold transition-all disabled:opacity-60"
            style={{
              borderColor: done ? "rgba(34,197,94,0.4)"   : "rgba(249,115,22,0.4)",
              background:  done ? "rgba(34,197,94,0.1)"   : "rgba(249,115,22,0.1)",
              color:       done ? "var(--color-success)"  : "#f97316",
            }}>
            {done ? (
              <><Check size={14} /> Escalated as {escId}</>
            ) : submitting ? (
              <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" />
                Escalating…</>
            ) : (
              <><ShieldAlert size={14} /> Escalate to District</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Officers list — same as complaints list page ───────────── */
const OFFICERS = ["R. Sharma", "P. Nair", "A. Kulkarni", "M. Patil", "S. Desai"];

/* ─── Assign Officer Modal ───────────────────────────────────── */
// Reused from complaints/page.tsx — same component, same officer list.
function AssignModal({
  complaintId,
  currentOfficer,
  onClose,
  onAssign,
}: {
  complaintId: string;
  currentOfficer: string;
  onClose: () => void;
  onAssign: (officer: string) => void;
}) {
  const [selected, setSelected] = useState(currentOfficer || "");
  const [success,  setSuccess]  = useState(false);

  const handleAssign = () => {
    if (!selected) return;
    onAssign(selected);
    setSuccess(true);
    setTimeout(onClose, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 320 }}
        className="w-full max-w-sm rounded-2xl border shadow-xl"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Assign Officer</h3>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 font-mono">{complaintId}</p>
          </div>
          <button onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors">
            <X size={15} />
          </button>
        </div>
        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <label className="text-xs font-medium text-[var(--color-text-secondary)] block mb-0.5">
            Select Officer
          </label>
          <div className="flex flex-col gap-1.5">
            {OFFICERS.map((o) => (
              <button key={o} type="button" onClick={() => setSelected(o)}
                className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm text-left transition-all"
                style={{
                  borderColor: selected === o ? "var(--sda-border-amber)" : "var(--color-border)",
                  background:  selected === o ? "color-mix(in srgb, var(--sda-amber) 8%, transparent)" : "var(--color-surface)",
                  color:       selected === o ? "var(--sda-amber)" : "var(--color-text-secondary)",
                }}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold"
                    style={{
                      borderColor: selected === o ? "var(--sda-border-amber)" : "var(--color-border)",
                      background:  selected === o ? "color-mix(in srgb, var(--sda-amber) 12%, transparent)" : "var(--color-card)",
                      color:       selected === o ? "var(--sda-amber)" : "var(--color-text-muted)",
                    }}>
                    {o.charAt(0)}
                  </div>
                  <span className="font-medium">{o}</span>
                </div>
                {selected === o && <Check size={14} className="text-amber-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3">
          <button onClick={onClose}
            className="h-9 px-4 rounded-lg border text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            Cancel
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleAssign}
            disabled={!selected || success}
            className="flex items-center gap-2 h-9 px-5 rounded-lg border text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              borderColor: success ? "rgba(34,197,94,0.4)"  : "var(--sda-border-amber)",
              background:  success ? "rgba(34,197,94,0.1)"  : "color-mix(in srgb, var(--sda-amber) 12%, transparent)",
              color:       success ? "var(--color-success)"  : "var(--sda-amber)",
            }}>
            {success ? <><Check size={14} /> Assigned!</> : <><UserCheck size={14} /> Assign</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Sticky Actions Panel ───────────────────────────────────── */
// Each action wired to its existing workflow:
//   Assign Officer    → AssignModal (reused from complaints/page.tsx)
//   Mark In Progress  → local status state update (same pattern as list page)
//   Upload Evidence   → navigates to /resolve page (has FileUploadZone)
//   Resolve Complaint → navigates to /resolve page (existing route)
//   Reject            → local status state update
//   Escalate          → EscalateDialog → pushes to shared escalationStore
function StickyActions({
  id,
  status,
  officerName,
  onAssign,
  onMarkInProgress,
  onReject,
  onEscalate,
  complaint,
}: {
  id: string;
  status: string;
  officerName: string;
  onAssign: (officer: string) => void;
  onMarkInProgress: () => void;
  onReject: () => void;
  onEscalate: (escId: string, priority: EscalationPriority, reason: string) => void;
  complaint: ComplaintDetail;
}) {
  const [assignOpen,   setAssignOpen]   = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const isResolved   = status === "Resolved"  || status === "Rejected";
  const isEscalated  = status === "Escalated";
  const isInProgress = status === "In Progress";
  const isOwnedByDistrict = isEscalated; // Case ownership transferred

  return (
    <div className="lg:sticky lg:top-4">
      <DashboardCard className="p-4 flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
          Case Actions
        </p>

        {/* Awaiting District Action banner */}
        {isOwnedByDistrict && !isResolved && (
          <div className="rounded-lg border px-3 py-2 mb-1 flex items-center gap-2"
            style={{ borderColor: "rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.06)" }}>
            <ShieldAlert size={12} className="text-orange-400 shrink-0" />
            <span className="text-[11px] text-orange-400 font-medium">Awaiting District Action</span>
          </div>
        )}

        {/* Assign Officer — opens AssignModal (existing component from list page) */}
        <motion.button
          whileHover={{ x: isResolved || isOwnedByDistrict ? 0 : 2 }} whileTap={{ scale: isResolved || isOwnedByDistrict ? 1 : 0.97 }}
          disabled={isResolved || isOwnedByDistrict}
          onClick={() => setAssignOpen(true)}
          className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)", color: "var(--color-info)" }}>
          <UserCheck size={14} /> Assign Officer
        </motion.button>

        {/* Mark In Progress — local state update (no dedicated page exists) */}
        <motion.button
          whileHover={{ x: isResolved || isInProgress || isOwnedByDistrict ? 0 : 2 }}
          whileTap={{ scale: isResolved || isInProgress || isOwnedByDistrict ? 1 : 0.97 }}
          disabled={isResolved || isInProgress || isOwnedByDistrict}
          onClick={onMarkInProgress}
          className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "var(--sda-border-amber)", background: "color-mix(in srgb, var(--sda-amber) 8%, transparent)", color: "var(--sda-amber)" }}>
          <Clock size={14} />
          {isInProgress ? "Already In Progress" : "Mark In Progress"}
        </motion.button>

        {/* Upload Evidence — navigates to resolve page which has FileUploadZone */}
        <Link href={`/sub-district-admin/dashboard/complaints/${id}/resolve`} className={`block ${isResolved ? "pointer-events-none opacity-40" : ""}`}>
          <motion.button
            whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: isResolved ? 1 : 0.97 }}
            disabled={isResolved}
            className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full"
            style={{ borderColor: "rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#a78bfa" }}>
            <Camera size={14} /> Upload Evidence
          </motion.button>
        </Link>

        <div className="my-1 border-t border-[var(--color-border)]" />

        {/* Resolve Complaint — existing /resolve route */}
        <Link href={`/sub-district-admin/dashboard/complaints/${id}/resolve`}
          className={`block ${isResolved || isOwnedByDistrict ? "pointer-events-none opacity-40" : ""}`}>
          <motion.button
            whileHover={{ x: isResolved || isOwnedByDistrict ? 0 : 2 }} whileTap={{ scale: isResolved || isOwnedByDistrict ? 1 : 0.97 }}
            disabled={isResolved || isOwnedByDistrict}
            className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-semibold text-left transition-all w-full"
            style={{ borderColor: "rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.1)", color: "var(--color-success)" }}>
            <CheckCircle2 size={14} /> Resolve Complaint
          </motion.button>
        </Link>

        {/* Reject — disabled when escalated (district owns it) */}
        <motion.button
          whileHover={{ x: isResolved || isOwnedByDistrict ? 0 : 2 }} whileTap={{ scale: isResolved || isOwnedByDistrict ? 1 : 0.97 }}
          disabled={isResolved || isOwnedByDistrict}
          onClick={onReject}
          className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "var(--color-danger)" }}>
          <AlertTriangle size={14} /> Reject
        </motion.button>

        {/* Escalate to District — opens EscalateDialog → pushes to shared escalationStore */}
        <motion.button
          whileHover={{ x: isResolved || isEscalated ? 0 : 2 }}
          whileTap={{ scale: isResolved || isEscalated ? 1 : 0.97 }}
          disabled={isResolved || isEscalated}
          onClick={() => setEscalateOpen(true)}
          className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            borderColor: isEscalated ? "rgba(249,115,22,0.5)" : "rgba(249,115,22,0.3)",
            background:  isEscalated ? "rgba(249,115,22,0.12)" : "rgba(249,115,22,0.07)",
            color: "#f97316",
          }}>
          <ShieldAlert size={14} />
          {isEscalated ? "Escalated to District ✓" : "Escalate to District"}
        </motion.button>
      </DashboardCard>

      {/* Assign Officer Modal */}
      <AnimatePresence>
        {assignOpen && (
          <AssignModal
            complaintId={id}
            currentOfficer={officerName}
            onClose={() => setAssignOpen(false)}
            onAssign={(officer) => { onAssign(officer); setAssignOpen(false); }}
          />
        )}
      </AnimatePresence>

      {/* Escalate Dialog */}
      <AnimatePresence>
        {escalateOpen && (
          <EscalateDialog
            complaint={complaint}
            onClose={() => setEscalateOpen(false)}
            onSubmit={(escId, priority, reason) => {
              setEscalateOpen(false);
              onEscalate(escId, priority, reason);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const complaintId = id ?? "CMP-1024";
  const record = useComplaintStore((s) => s.complaints.find((x) => x.id === complaintId) ?? s.getById(complaintId));
  const assignOfficer = useComplaintStore((s) => s.assignOfficer);
  const setComplaintStatus = useComplaintStore((s) => s.setStatus);
  const linkEscalation = useComplaintStore((s) => s.linkEscalation);
  const appendActivity = useComplaintStore((s) => s.appendActivity);
  const syncFromEscalation = useComplaintStore((s) => s.syncFromEscalation);

  const linkedEsc = useEscalationStore((s) => s.escalations.find((e) => e.sourceComplaintId === complaintId));
  const resolution = useComplaintWorkflowStore((s) => s.resolutions.find((r) => r.complaintId === complaintId));

  const [toast, setToast] = useState<string | null>(null);
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
  const [escalateOpen2, setEscalateOpen2] = useState(false);
  const [impactCardOpen, setImpactCardOpen] = useState(false);

  const c = useMemo(() => toComplaintDetailView(record), [record]);
  const escId = record.escalationId ?? linkedEsc?.id ?? null;
  const escalated = !!escId;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (linkedEsc) syncFromEscalation(linkedEsc);
  }, [linkedEsc, syncFromEscalation]);

  const handleAssign = (officer: string) => {
    assignOfficer(complaintId, officer);
    showToast(`Assigned to ${officer}`);
  };

  const handleMarkInProgress = () => {
    if (c.status !== "Resolved" && c.status !== "Rejected" && c.status !== "In Progress") {
      setComplaintStatus(complaintId, "In Progress");
      showToast("Status updated to In Progress");
    }
  };

  const handleReject = () => {
    if (c.status !== "Resolved" && c.status !== "Rejected") {
      setComplaintStatus(complaintId, "Rejected", "Officer", "Complaint rejected by officer");
      showToast("Complaint marked as Rejected");
    }
  };

  const handleUpdateStatus = (newStatus: UpdatableStatus, note: string) => {
    setUpdateStatusOpen(false);
    if (newStatus === c.status) return;
    setComplaintStatus(
      complaintId,
      newStatus as ComplaintStatus,
      "Officer",
      `Status updated to ${newStatus}${note ? ` — ${note}` : ""}`
    );
    showToast(`Status updated to ${newStatus}`);
  };

  const handleEscalate = (newEscId: string, priority: EscalationPriority, reason: string) => {
    linkEscalation(complaintId, newEscId);
    appendActivity(complaintId, "Sub-District", `Escalated to district as ${newEscId} — ${reason} (${priority})`);
    showToast(`Escalated as ${newEscId} — visible in District Admin`);
  };

  return (
    <div className="flex flex-col gap-3 pb-6">
      <Breadcrumb id={c.id} />

      {/* District escalation status */}
      <AnimatePresence>
        {escalated && escId && linkedEsc && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
            style={{ borderColor: "rgba(249,115,22,0.35)", background: "rgba(249,115,22,0.08)" }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldAlert size={14} className="text-orange-400 shrink-0" />
              <span className="text-xs text-[var(--color-text-secondary)]">
                District escalation <span className="font-mono font-bold text-orange-400">{escId}</span>
                {" "}— <span className="font-semibold text-orange-400">{linkedEsc.status}</span>
                {linkedEsc.assignedTo !== "Unassigned" && (
                  <> · assigned to <span className="font-medium">{linkedEsc.assignedTo}</span></>
                )}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(resolution || record.resolutionStatus !== "None") && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border px-4 py-3 text-xs"
          style={{
            borderColor: record.resolutionStatus === "Approved" ? "rgba(34,197,94,0.35)" : record.resolutionStatus === "Rejected" ? "rgba(239,68,68,0.35)" : "rgba(6,182,212,0.35)",
            background: record.resolutionStatus === "Approved" ? "rgba(34,197,94,0.08)" : record.resolutionStatus === "Rejected" ? "rgba(239,68,68,0.08)" : "rgba(6,182,212,0.08)",
          }}
        >
          <span className="font-semibold text-[var(--color-text-primary)]">
            Resolution {record.resolutionRequestId ?? resolution?.id ?? "—"}
          </span>
          {" "}— <span className="text-[var(--color-text-secondary)]">{record.resolutionStatus}</span>
          {resolution?.clarificationMessage && (
            <p className="mt-1 text-[var(--color-text-muted)]">District: {resolution.clarificationMessage}</p>
          )}
          {record.resolutionStatus === "Clarification Requested" && (
            <Link href={`/sub-district-admin/dashboard/complaints/${complaintId}/resolve`} className="ml-2 text-amber-400 hover:underline">
              Respond →
            </Link>
          )}
        </motion.div>
      )}

      {/* Success toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium"
            style={{ background: "var(--color-card)", borderColor: "rgba(249,115,22,0.35)", color: "#f97316" }}
          >
            <Check size={15} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/sub-district-admin/dashboard/complaints">
            <motion.button whileHover={{ x: -2 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mt-0.5">
              <ArrowLeft size={15} /> Back
            </motion.button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold" style={{ color: "var(--sda-amber)" }}>{c.id}</span>
              <span className={`dashboard-table-badge ${PRIORITY_CLS[c.priority] ?? ""}`}>{c.priority}</span>
              <span className={`dashboard-table-badge ${STATUS_CLS[c.status] ?? ""}`}>{c.status}</span>
            </div>
            <h1 className="text-base font-bold text-[var(--color-text-primary)] mt-1 leading-snug max-w-xl">{c.title}</h1>
          </div>
        </div>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

        {/* ── Left (2/3) ── */}
        <div className="flex flex-col gap-3 lg:col-span-2">

          {/* Case Summary (operational, not form-like) */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: "var(--sda-amber)" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Case Summary</h3>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{c.description}</p>

              {/* SLA Status Block */}
              <SlaBlock status={c.slaStatus} label={c.slaLabel} hours={c.slaHours} />

              {/* Case metrics grid */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Reported On",    value: c.createdDate.split(",")[0] },
                  { label: "Last Updated",   value: c.updatedDate.split(",")[0] },
                  { label: "Reports",        value: String(c.reportCount)       },
                  { label: "Similar Nearby", value: String(c.nearbyCount)       },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                    <div className="text-sm font-bold text-[var(--color-text-primary)]">{m.value}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Resolution target */}
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"
                style={{ borderColor: "rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.06)" }}>
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-green-400" />
                  <span className="text-xs text-[var(--color-text-secondary)]">Resolution Target</span>
                </div>
                <span className="text-xs font-bold text-green-400">{c.resolutionTarget}</span>
              </div>
            </DashboardCard>
          </motion.div>

          {/* Location with mini map */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              {/* Header — with Full Map link */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: "var(--sda-amber)" }} />
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Location</h3>
                </div>
                <Link href="/sub-district-admin/dashboard/map"
                  className="flex items-center gap-1 text-[11px] font-medium transition-colors hover:underline"
                  style={{ color: "var(--sda-amber)" }}>
                  <Map size={11} /> <ExternalLink size={10} /> Full Map
                </Link>
              </div>

              {/* Metadata grid — label left, value right, no overlap */}
              <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-x-6 divide-y divide-[var(--color-border)] sm:divide-y-0">
                {[
                  { label: "Address",      value: c.location     },
                  { label: "Coordinates",  value: c.coordinates  },
                  { label: "Sub-District", value: c.subDistrict  },
                  { label: "Zone",         value: c.zone         },
                ].map((r) => (
                  <div key={r.label} className="flex items-start justify-between gap-3 py-2 border-b border-[var(--color-border)] last:border-0 sm:border-b-0 sm:py-1.5">
                    <span className="text-[11px] text-[var(--color-text-muted)] shrink-0 w-24 pt-px">{r.label}</span>
                    <span className="text-[11px] text-[var(--color-text-primary)] font-medium text-right min-w-0 break-words">{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Real interactive map */}
              <div className="rounded-xl overflow-hidden">
                <IndiaMap
                  adminRole="sub_district_admin"
                  height="220px"
                  showBreadcrumb={false}
                  showControls={false}
                  showLegend={false}
                  showSidebar={false}
                  isDark
                />
              </div>
            </DashboardCard>
          </motion.div>

          {/* Evidence Gallery */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <DashboardCard className="p-4 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Camera size={14} style={{ color: "var(--sda-amber)" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Evidence Gallery</h3>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {c.evidence.citizen.length + c.evidence.inspection.length + c.evidence.resolution.length} files
                </span>
              </div>
              <EvidenceSection title="Citizen Evidence — Before Inspection"  color="var(--sda-amber)"     items={c.evidence.citizen}    emptyLabel="No citizen evidence uploaded" />
              <EvidenceSection title="Officer Inspection Evidence"           color="var(--color-info)"    items={c.evidence.inspection} emptyLabel="No inspection photos yet" />
              <EvidenceSection title="Resolution Evidence — After Completion" color="var(--color-success)" items={c.evidence.resolution} emptyLabel="No resolution evidence yet" />
            </DashboardCard>
          </motion.div>

          {/* Activity Timeline (Officer Notes) */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Activity size={14} style={{ color: "var(--sda-amber)" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Officer Notes & Activity</h3>
              </div>
              {/* Timeline */}
              <div className="activity-timeline">
                <div className="sda-activity-timeline-line activity-timeline-line" />
                <div className="activity-timeline-list">
                  {c.activityLog.map((entry, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.04 }} className="activity-timeline-item">
                      <div className={`activity-timeline-icon ${entry.actor === "System" ? "activity-timeline-icon-info" : "sda-activity-timeline-icon-amber"}`}>
                        {entry.actor === "System" ? <Activity size={12} /> : <MessageSquare size={12} />}
                      </div>
                      <div className="activity-timeline-body">
                        <div className="activity-timeline-meta">
                          <span className="activity-timeline-title">{entry.actor}</span>
                          <span className="activity-timeline-time">{entry.time}</span>
                        </div>
                        <p className="activity-timeline-desc">{entry.action}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              {/* Add note */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
                <textarea rows={2} placeholder="Add a field note or observation…"
                  className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] resize-none focus:outline-none focus:border-amber-500/40" />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="self-end h-8 px-4 rounded-lg border text-xs font-medium transition-all"
                  style={{ borderColor: "var(--sda-border-amber)", background: "color-mix(in srgb, var(--sda-amber) 10%, transparent)", color: "var(--sda-amber)" }}>
                  Add Note
                </motion.button>
              </div>
            </DashboardCard>
          </motion.div>
        </div>

        {/* ── Right (1/3) ── */}
        <div className="flex flex-col gap-3">

          {/* Sticky Actions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <StickyActions
              id={c.id}
              status={c.status}
              officerName={c.officer.name}
              onAssign={handleAssign}
              onMarkInProgress={handleMarkInProgress}
              onReject={handleReject}
              onEscalate={handleEscalate}
              complaint={c}
            />
          </motion.div>

          {/* Impact Card — shown when complaint is resolved */}
          {c.status === "Resolved" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
              <DashboardCard className="p-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setImpactCardOpen(true)}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border text-xs font-semibold"
                  style={{ borderColor: "rgba(59,130,246,0.35)", background: "rgba(59,130,246,0.08)", color: "#3b82f6" }}>
                  <Share2 size={14} /> Generate Impact Card
                </motion.button>
              </DashboardCard>
            </motion.div>
          )}

          {/* Citizen Transparency Timeline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <DashboardCard className="p-4">
              <CitizenTransparencyTimeline complaintId={complaintId} />
            </DashboardCard>
          </motion.div>

          {/* Complaint Progress & SLA */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DashboardCard className="p-4 flex flex-col gap-4">

              {/* Card header */}
              <div className="flex items-center gap-2">
                <TrendingUp size={14} style={{ color: "var(--sda-amber)" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Complaint Progress & SLA</h3>
              </div>

              {/* ── Workflow Timeline — driven by c.status ── */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2.5">
                  Complaint Progress
                </p>
                {(() => {
                  // status → index of the step that is "current" (steps before it are done)
                  const statusToStep: Record<string, number> = {
                    "Open":        0,
                    "Assigned":    1,
                    "In Progress": 3,
                    "Escalated":   2,
                    "Resolved":    5,
                    "Rejected":    5,
                  };
                  const currentIdx = statusToStep[c.status] ?? 0;
                  const allDone    = c.status === "Resolved" || c.status === "Rejected";
                  const workflowSteps = [
                    { label: "Complaint Created",        icon: FileText       },
                    { label: "Assigned to Officer",       icon: UserCheck      },
                    { label: "Site Inspection Scheduled", icon: ClipboardCheck },
                    { label: "Work In Progress",          icon: Wrench         },
                    { label: "Verification Pending",      icon: Search         },
                    { label: "Resolved",                  icon: CheckCircle2   },
                  ];
                  return (
                    <div className="flex flex-col gap-0 relative">
                      <div className="absolute left-[11px] top-3 bottom-3 w-px"
                        style={{ background: "linear-gradient(to bottom, var(--sda-border-amber), rgba(245,158,11,0.08))" }} />
                      {workflowSteps.map((step, i) => {
                        const done    = allDone || i < currentIdx;
                        const current = !allDone && i === currentIdx;
                        return (
                          <div key={step.label} className="flex items-center gap-3 py-1.5 relative z-10">
                            <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border"
                              style={{
                                borderColor: done ? "rgba(34,197,94,0.5)" : current ? "var(--sda-border-amber)" : "var(--color-border)",
                                background:  done ? "rgba(34,197,94,0.12)" : current ? "color-mix(in srgb, var(--sda-amber) 12%, transparent)" : "var(--color-surface)",
                                boxShadow:   current ? "0 0 8px color-mix(in srgb, var(--sda-amber) 25%, transparent)" : "none",
                              }}>
                              <step.icon size={11} style={{ color: done ? "var(--color-success)" : current ? "var(--sda-amber)" : "var(--color-text-muted)" }} />
                            </div>
                            <span className={`text-xs leading-tight ${
                              done    ? "text-[var(--color-text-secondary)] line-through decoration-[var(--color-text-muted)]"
                              : current ? "font-semibold text-amber-400"
                              : "text-[var(--color-text-muted)]"
                            }`}>{step.label}</span>
                            {current && (
                              <span className="ml-auto shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                                style={{ borderColor: "var(--sda-border-amber)", background: "color-mix(in srgb, var(--sda-amber) 10%, transparent)", color: "var(--sda-amber)" }}>
                                Current
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* ── SLA Monitoring — driven by c.slaHours / c.slaTargetHours ── */}
              <div className="border-t border-[var(--color-border)] pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2.5">
                  SLA Monitoring
                </p>
                {(() => {
                  const isResolved = c.status === "Resolved" || c.status === "Rejected";
                  const isBreached = c.slaStatus === "Breached";
                  // For resolved, elapsed = target (100% used). For breached, hours is negative.
                  const targetH  = c.slaTargetHours;
                  const remainH  = isResolved ? 0 : Math.max(0, c.slaHours);
                  const elapsedH = isResolved ? targetH : Math.max(0, targetH - remainH);
                  const elapsedPct = Math.min(100, Math.round((elapsedH / targetH) * 100));
                  const remainPct  = 100 - elapsedPct;
                  const slaStatusLabel = isResolved ? "Resolved" : isBreached ? "Breached" : c.slaStatus === "At Risk" ? "Warning" : "Healthy";
                  const slaColor = isBreached ? "#ef4444" : c.slaStatus === "At Risk" ? "var(--sda-amber)" : "var(--color-success)";
                  const slaStatusBg    = isBreached ? "rgba(239,68,68,0.07)"   : c.slaStatus === "At Risk" ? "rgba(245,158,11,0.07)"  : "rgba(34,197,94,0.07)";
                  const slaStatusBorder= isBreached ? "rgba(239,68,68,0.3)"   : c.slaStatus === "At Risk" ? "rgba(245,158,11,0.3)"   : "rgba(34,197,94,0.3)";
                  return (
                    <div className="flex flex-col gap-2">
                      {[
                        { label: "Target SLA",     value: `${targetH} Hours`,                    color: "var(--color-text-secondary)" },
                        { label: "Elapsed Time",   value: isBreached ? `${targetH}+ Hours` : `${elapsedH} Hours`, color: isBreached ? "#ef4444" : "var(--sda-amber)" },
                        { label: "Remaining Time", value: isResolved ? "—" : isBreached ? "BREACHED" : `${remainH.toFixed(1)} Hours`, color: isResolved ? "var(--color-text-muted)" : isBreached ? "#ef4444" : "var(--color-success)" },
                      ].map((r) => (
                        <div key={r.label} className="flex items-center justify-between">
                          <span className="text-[11px] text-[var(--color-text-muted)]">{r.label}</span>
                          <span className="text-[11px] font-semibold tabular-nums" style={{ color: r.color }}>{r.value}</span>
                        </div>
                      ))}
                      {/* Progress bar */}
                      <div className="mt-1">
                        <div className="flex h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--color-surface)" }}>
                          <div className="h-full rounded-l-full transition-all"
                            style={{ width: `${elapsedPct}%`, background: isBreached ? "#ef4444" : "var(--sda-amber)", boxShadow: `0 0 6px color-mix(in srgb, ${isBreached ? "#ef4444" : "var(--sda-amber)"} 40%, transparent)` }} />
                          {!isBreached && (
                            <div className="h-full rounded-r-full"
                              style={{ width: `${remainPct}%`, background: "rgba(34,197,94,0.35)" }} />
                          )}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[9px]" style={{ color: isBreached ? "#ef4444" : "var(--sda-amber)" }}>{elapsedH}h elapsed</span>
                          {!isResolved && <span className="text-[9px]" style={{ color: isBreached ? "#ef4444" : "var(--color-success)" }}>{isBreached ? "BREACHED" : `${remainH.toFixed(1)}h left`}</span>}
                        </div>
                      </div>
                      {/* Status badge */}
                      <div className="flex items-center justify-between rounded-lg border px-3 py-1.5 mt-1"
                        style={{ borderColor: slaStatusBorder, background: slaStatusBg }}>
                        <span className="text-[11px] text-[var(--color-text-muted)]">SLA Status</span>
                        <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: slaColor }}>
                          <CircleDot size={11} />
                          {slaStatusLabel}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ── Operational Metrics ── */}
              <div className="border-t border-[var(--color-border)] pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2.5">
                  Operational Metrics
                </p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: "Priority",          value: c.priority,          color: c.priority === "Critical" ? "var(--color-danger)" : c.priority === "High" ? "#f97316" : "var(--sda-amber)" },
                    { label: "Evidence Files",     value: `${c.evidence.citizen.length + c.evidence.inspection.length + c.evidence.resolution.length} files`, color: "var(--color-info)" },
                    { label: "Assigned Officer",   value: c.officer.name,      color: "var(--color-text-secondary)" },
                    { label: "Last Updated",       value: c.updatedDate.split(",")[0], color: "var(--color-text-muted)" },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--color-text-muted)]">{m.label}</span>
                      <span className="text-[11px] font-medium" style={{ color: m.color }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Actions ── */}
              <div className="flex gap-2 pt-1 border-t border-[var(--color-border)]">
                <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setUpdateStatusOpen(true)}
                  disabled={c.status === "Resolved" || c.status === "Rejected"}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border text-[11px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: "var(--sda-border-amber)", background: "color-mix(in srgb, var(--sda-amber) 10%, transparent)", color: "var(--sda-amber)" }}>
                  <CheckCircle2 size={12} /> Update Status
                </motion.button>
                <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setEscalateOpen2(true)}
                  disabled={c.status === "Resolved" || c.status === "Rejected" || c.status === "Escalated" || escalated}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border text-[11px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: "rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.08)", color: "#f97316" }}>
                  <ArrowUpRight size={12} /> {escalated ? "Escalated ✓" : "Escalate"}
                </motion.button>
              </div>

            </DashboardCard>
          </motion.div>

          {/* Assignment Card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <UserCheck size={14} style={{ color: "var(--sda-amber)" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Assignment</h3>
              </div>
              <div className="flex flex-col divide-y divide-[var(--color-border)]">
                {[
                  { label: "Officer",         value: c.officer.name,         highlight: true  },
                  { label: "Assigned Date",   value: c.officer.assignedDate, highlight: false },
                  { label: "Expected Visit",  value: c.officer.expectedVisit,highlight: false },
                  { label: "Supervisor",      value: c.officer.supervisor,   highlight: false },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                    <span className="text-[11px] text-[var(--color-text-muted)]">{r.label}</span>
                    <span className={`text-[11px] font-medium ${r.highlight ? "text-amber-400" : "text-[var(--color-text-primary)]"}`}>{r.value}</span>
                  </div>
                ))}
              </div>
              {/* SLA Risk indicator */}
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"
                style={{ borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)" }}>
                <span className="text-[11px] text-[var(--color-text-secondary)]">SLA Risk</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-red-400">
                  <AlertTriangle size={11} /> {c.officer.slaRisk}
                </span>
              </div>
            </DashboardCard>
          </motion.div>

          {/* Case Timeline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <DashboardCard className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} style={{ color: "var(--sda-amber)" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Case Timeline</h3>
              </div>
              {c.timeline.map((step, i) => (
                <div key={i} className="flex gap-3 pb-2 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
                      style={{ borderColor: step.done ? "rgba(34,197,94,0.4)" : "var(--color-border)", background: step.done ? "rgba(34,197,94,0.1)" : "var(--color-surface)" }}>
                      {step.done
                        ? <CheckCircle2 size={12} className="text-green-400" />
                        : <Clock size={12} className="text-[var(--color-text-muted)]" />}
                    </div>
                    {i < c.timeline.length - 1 && (
                      <div className="w-px flex-1 mt-1 min-h-[12px]" style={{ background: step.done ? "rgba(34,197,94,0.3)" : "var(--color-border)" }} />
                    )}
                  </div>
                  <div className="pb-1 min-w-0">
                    <p className={`text-xs font-semibold ${step.done ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>{step.label}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{step.date}</p>
                    {step.note && <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 italic">{step.note}</p>}
                  </div>
                </div>
              ))}
            </DashboardCard>
          </motion.div>

          {/* Related Records — full traceability */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <DashboardCard className="p-4">
              <RelatedRecordsPanel
                records={getRelatedRecordsForComplaint(complaintId, "sub-district")}
                title="Related Records"
              />
            </DashboardCard>
          </motion.div>

          {/* Clarification Thread — visible when clarification exists */}
          {linkedEsc && (parseNotesToThread(linkedEsc.notes, linkedEsc.activityLog).length > 0 || record.resolutionStatus === "Clarification Requested") && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
              <DashboardCard className="p-4 flex flex-col gap-3">
                <ClarificationRequiredBadge show={
                  record.resolutionStatus === "Clarification Requested" ||
                  (linkedEsc.activityLog ?? []).some((a) => a.action.toLowerCase().includes("clarification requested") && a.actor.includes("District"))
                } />
                <ClarificationThread
                  messages={parseNotesToThread(linkedEsc.notes, linkedEsc.activityLog)}
                  viewerRole="sub-district"
                  complaintId={complaintId}
                  escalationId={linkedEsc.id}
                  onReply={(msg) => {
                    useEscalationStore.getState().appendActivity(linkedEsc.id, "Sub-District Officer", `Clarification reply — ${msg}`);
                    useEscalationStore.getState().updateEscalation(linkedEsc.id, {
                      notes: (linkedEsc.notes ?? "") + `\n[Sub-District] ${msg}`,
                    });
                    useAdminNotificationStore.getState().push({
                      portal: "district",
                      type: "clarification_request",
                      title: "Clarification response received",
                      message: `${complaintId} — ${msg.substring(0, 80)}`,
                      entityId: linkedEsc.id,
                      href: `/district-admin/dashboard/escalation/${linkedEsc.id}`,
                    });
                  }}
                />
              </DashboardCard>
            </motion.div>
          )}

          {/* Case Journey — complete lifecycle */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <DashboardCard className="p-4">
              <CaseJourneyTimeline
                steps={buildCaseJourney(complaintId)}
                title="Case Journey"
                accentColor="#f59e0b"
              />
            </DashboardCard>
          </motion.div>
        </div>
      </div>

      {/* UpdateStatus Dialog — right panel button */}
      <AnimatePresence>
        {updateStatusOpen && (
          <UpdateStatusDialog
            complaint={c}
            currentStatus={status}
            onClose={() => setUpdateStatusOpen(false)}
            onSubmit={handleUpdateStatus}
          />
        )}
      </AnimatePresence>

      {/* Escalate Dialog — right panel button */}
      <AnimatePresence>
        {escalateOpen2 && (
          <EscalateDialog
            complaint={c}
            onClose={() => setEscalateOpen2(false)}
            onSubmit={(newEscId, priority, reason) => {
              setEscalateOpen2(false);
              handleEscalate(newEscId, priority, reason);
            }}
          />
        )}
      </AnimatePresence>

      {/* Impact Card Modal */}
      <AnimatePresence>
        {impactCardOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setImpactCardOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border p-5"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <ImpactCard complaintId={complaintId} onClose={() => setImpactCardOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

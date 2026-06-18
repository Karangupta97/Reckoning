"use client";

import { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, ShieldAlert, MapPin,
  Clock, CheckCircle2, AlertTriangle, Timer, UserCheck,
  FileText, Activity, MessageSquare, Camera, XCircle,
  ArrowUpRight, Download, Calendar, X, Check, ChevronDown,
  ClipboardCheck, Wrench, CircleDot,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import IndiaMap from "@/components/map/IndiaMap";
import { useEscalationStore } from "@/store/escalationStore";
import { useEvidenceStore, type EvidenceFile } from "@/store/evidenceStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";
import { EvidenceFilePicker } from "@/components/evidence/EvidenceFilePicker";
import { currentDistrictFields } from "@/lib/district-scope";
import { buildEscalationDetail, fallbackEscalationDetail } from "@/lib/escalation-detail";

/* ─── Types ──────────────────────────────────────────────────── */
type Priority  = "Critical" | "High" | "Medium" | "Low";
type Status    = "Pending Review" | "Assigned" | "Investigating" | "Resolved" | "Closed";
type SLAStatus = "Breached" | "At Risk" | "On Track";

/* ─── Badge helpers ──────────────────────────────────────────── */
const PRIORITY_CLS: Record<Priority, string> = {
  Critical: "bg-red-500/15 text-red-400 border border-red-500/30",
  High:     "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  Medium:   "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Low:      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
};
const STATUS_CLS: Record<Status, string> = {
  "Pending Review": "bg-amber-500/12 text-amber-400 border border-amber-500/25",
  "Assigned":       "bg-blue-500/12 text-blue-400 border border-blue-500/25",
  "Investigating":  "bg-purple-500/12 text-purple-400 border border-purple-500/25",
  "Resolved":       "bg-teal-500/12 text-teal-400 border border-teal-500/25",
  "Closed":         "bg-slate-500/12 text-slate-400 border border-slate-500/25",
};

/* ─── Helpers ────────────────────────────────────────────────── */
function now(): string {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/* ─── SLA Block ──────────────────────────────────────────────── */
function SlaBlock({ status, label, hours }: { status: SLAStatus; label: string; hours: number }) {
  const cfg = {
    Breached:   { bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.35)",  color: "#ef4444", pulse: true  },
    "At Risk":  { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.35)", color: "#f59e0b", pulse: false },
    "On Track": { bg: "rgba(20,184,166,0.08)", border: "rgba(20,184,166,0.30)", color: "#14b8a6", pulse: false },
  }[status];
  const pct = status === "Breached" ? 100 : Math.max(0, Math.min(100, (1 - hours / 48) * 100));
  return (
    <div className="rounded-xl border p-3.5" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Timer size={14} style={{ color: cfg.color }} />
          <span className="text-xs font-bold text-[var(--color-text-primary)]">SLA Status</span>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-bold ${cfg.pulse ? "animate-pulse" : ""}`} style={{ color: cfg.color }}>
          {status === "Breached" ? "🔴" : status === "At Risk" ? "🟠" : "🟢"} {label}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.15)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cfg.color }} />
      </div>
      <p className="mt-1.5 text-[10px]" style={{ color: cfg.color }}>
        {status === "Breached" ? "SLA breached — immediate escalation required" : `${status} — ${label} remaining`}
      </p>
    </div>
  );
}

/* ─── Modal shell ────────────────────────────────────────────── */
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="admin-modal-overlay fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 320 }}
        className="w-full max-w-md rounded-2xl border shadow-xl flex flex-col"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)", maxHeight: "92vh" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function ModalHeader({ icon, iconBg, iconBorder, iconColor, title, subtitle, onClose }: {
  icon: React.ReactNode; iconBg: string; iconBorder: string; iconColor?: string;
  title: string; subtitle: string; onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border"
          style={{ background: iconBg, borderColor: iconBorder, color: iconColor }}>
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{title}</h3>
          <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">{subtitle}</p>
        </div>
      </div>
      <button onClick={onClose}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors">
        <X size={15} />
      </button>
    </div>
  );
}

function ModalFooter({ onClose, onSubmit, submitting, done, doneLabel, submitLabel, submitColor }: {
  onClose: () => void; onSubmit: () => void;
  submitting: boolean; done: boolean; doneLabel: string; submitLabel: string;
  submitColor: { border: string; bg: string; color: string };
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3 shrink-0">
      <button onClick={onClose} disabled={submitting || done}
        className="h-9 px-4 rounded-lg border text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        Cancel
      </button>
      <motion.button whileHover={{ scale: done || submitting ? 1 : 1.02 }} whileTap={{ scale: done || submitting ? 1 : 0.97 }}
        onClick={onSubmit} disabled={submitting || done}
        className="flex items-center gap-2 h-9 px-5 rounded-lg border text-sm font-semibold transition-all disabled:opacity-60"
        style={done
          ? { borderColor: "rgba(20,184,166,0.4)", background: "rgba(20,184,166,0.1)", color: "#14b8a6" }
          : { borderColor: submitColor.border, background: submitColor.bg, color: submitColor.color }
        }>
        {done ? <><Check size={14} /> {doneLabel}</> : submitting
          ? <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" /> Saving…</>
          : submitLabel}
      </motion.button>
    </div>
  );
}

/* ─── Assign Officer Modal ───────────────────────────────────── */
const OFFICERS = ["R. Sharma", "A. Singh", "S. Gupta", "P. Iyer", "M. Khan", "T. Verma"];

function AssignModal({ escId, current, onClose, onAssign }: {
  escId: string; current: string; onClose: () => void; onAssign: (o: string) => void;
}) {
  const [selected, setSelected] = useState(current);
  const [done, setDone] = useState(false);
  const submit = () => { setDone(true); setTimeout(() => { onAssign(selected); onClose(); }, 900); };
  return (
    <Modal onClose={onClose}>
      <ModalHeader icon={<UserCheck size={15} />} iconBg="rgba(59,130,246,0.1)" iconBorder="rgba(59,130,246,0.3)"
        iconColor="#3b82f6" title="Assign Officer" subtitle={escId} onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        <p className="text-xs text-[var(--color-text-muted)]">Select the officer to handle this escalation.</p>
        {OFFICERS.map((o) => (
          <button key={o} type="button" onClick={() => setSelected(o)}
            className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm text-left transition-all"
            style={{
              borderColor: selected === o ? "rgba(20,184,166,0.5)" : "var(--color-border)",
              background:  selected === o ? "rgba(20,184,166,0.08)" : "var(--color-surface)",
              color:       selected === o ? "#14b8a6" : "var(--color-text-secondary)",
            }}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold"
                style={{
                  borderColor: selected === o ? "rgba(20,184,166,0.4)" : "var(--color-border)",
                  background:  selected === o ? "rgba(20,184,166,0.12)" : "var(--color-card)",
                  color:       selected === o ? "#14b8a6" : "var(--color-text-muted)",
                }}>
                {o.charAt(0)}
              </div>
              <span className="font-medium">{o}</span>
            </div>
            {selected === o && <Check size={14} className="text-teal-400 shrink-0" />}
          </button>
        ))}
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} submitting={false} done={done}
        doneLabel="Assigned!" submitLabel="Assign Officer"
        submitColor={{ border: "rgba(20,184,166,0.4)", bg: "rgba(20,184,166,0.1)", color: "#14b8a6" }} />
    </Modal>
  );
}

/* ─── Resolve Dialog ─────────────────────────────────────────── */
function ResolveDialog({ escId, onClose, onSubmit }: {
  escId: string; onClose: () => void; onSubmit: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const submit = () => {
    setSubmitting(true);
    setTimeout(() => { setDone(true); setSubmitting(false); setTimeout(() => onSubmit(note.trim()), 900); }, 500);
  };
  return (
    <Modal onClose={onClose}>
      <ModalHeader icon={<CheckCircle2 size={15} />} iconBg="rgba(20,184,166,0.1)" iconBorder="rgba(20,184,166,0.3)"
        iconColor="#14b8a6" title="Resolve Escalation" subtitle={escId} onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div className="rounded-lg border px-3 py-2.5 flex items-start gap-2"
          style={{ borderColor: "rgba(20,184,166,0.25)", background: "rgba(20,184,166,0.05)" }}>
          <CheckCircle2 size={12} className="text-teal-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            Marking this escalation as resolved will close the case and notify the originating sub-district.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">
            Resolution Summary <span className="font-normal text-[var(--color-text-muted)]">(required)</span>
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4}
            placeholder="Describe what action was taken to resolve this escalation…"
            className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none transition-colors"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
        </div>
        <div className="rounded-lg border px-3 py-2 flex items-center gap-2"
          style={{ borderColor: "rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.05)" }}>
          <Activity size={11} className="text-blue-400 shrink-0" />
          <p className="text-[10px] text-[var(--color-text-muted)]">
            Resolution note will be logged to the <span className="font-semibold text-blue-400">Activity Log</span> and the status will update to <span className="font-semibold text-teal-400">Resolved</span>.
          </p>
        </div>
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} submitting={submitting} done={done}
        doneLabel="Resolved!" submitLabel="Resolve Escalation"
        submitColor={{ border: "rgba(20,184,166,0.4)", bg: "rgba(20,184,166,0.1)", color: "#14b8a6" }} />
    </Modal>
  );
}

/* ─── Reject Dialog ──────────────────────────────────────────── */
const REJECT_REASONS = [
  "Insufficient evidence provided",
  "Duplicate escalation",
  "Outside district jurisdiction",
  "Already resolved at sub-district level",
  "Invalid complaint category",
  "Other",
];

function ClarifyDialog({ escId, onClose, onSubmit }: {
  escId: string; onClose: () => void; onSubmit: (message: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const submit = () => {
    if (!message.trim()) return;
    setSubmitting(true);
    setTimeout(() => { setDone(true); setSubmitting(false); setTimeout(() => onSubmit(message.trim()), 900); }, 500);
  };
  return (
    <Modal onClose={onClose}>
      <ModalHeader icon={<MessageSquare size={15} />} iconBg="rgba(6,182,212,0.1)" iconBorder="rgba(6,182,212,0.3)"
        iconColor="#06b6d4" title="Request Clarification" subtitle={escId} onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
          placeholder="What additional information does the sub-district need to provide?"
          className="w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} submitting={submitting} done={done}
        doneLabel="Sent!" submitLabel="Send Request"
        submitColor={{ border: "rgba(6,182,212,0.4)", bg: "rgba(6,182,212,0.1)", color: "#06b6d4" }} />
    </Modal>
  );
}

function RejectDialog({ escId, onClose, onSubmit }: {
  escId: string; onClose: () => void; onSubmit: (reason: string, note: string) => void;
}) {
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const submit = () => {
    setSubmitting(true);
    setTimeout(() => { setDone(true); setSubmitting(false); setTimeout(() => onSubmit(reason, note.trim()), 900); }, 500);
  };
  return (
    <Modal onClose={onClose}>
      <ModalHeader icon={<XCircle size={15} />} iconBg="rgba(239,68,68,0.1)" iconBorder="rgba(239,68,68,0.3)"
        iconColor="#ef4444" title="Reject Escalation" subtitle={escId} onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div className="rounded-lg border px-3 py-2.5 flex items-start gap-2"
          style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
          <AlertTriangle size={12} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            Rejecting this escalation will return it to the sub-district for reassessment. Please provide a clear reason.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Rejection Reason</label>
          <div className="relative">
            <select value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full h-9 appearance-none rounded-lg border pl-3 pr-8 text-xs outline-none transition-colors"
              style={{ borderColor: "rgba(239,68,68,0.3)", background: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
              {REJECT_REASONS.map((r) => <option key={r} value={r} style={{ background: "var(--color-card)" }}>{r}</option>)}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">
            Additional Notes <span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder="Provide additional context for the rejection…"
            className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none transition-colors"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
        </div>
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} submitting={submitting} done={done}
        doneLabel="Rejected" submitLabel="Reject Escalation"
        submitColor={{ border: "rgba(239,68,68,0.4)", bg: "rgba(239,68,68,0.1)", color: "#ef4444" }} />
    </Modal>
  );
}

/* ─── Escalate Further to Super Admin ───────────────────────── */
const ESCALATE_REASONS = [
  "SLA breach — beyond district authority",
  "Requires state-level intervention",
  "Political / media sensitivity",
  "Repeated escalations with no resolution",
  "Resource constraint at district level",
  "Critical safety or public health threat",
  "Other",
];

function EscalateFurtherDialog({ escId, title, priority: initPriority, onClose, onSubmit }: {
  escId: string; title: string; priority: Priority;
  onClose: () => void;
  onSubmit: (priority: Priority, reason: string, description: string) => void;
}) {
  const [priority, setPriority]     = useState<Priority>(initPriority);
  const [reason, setReason]         = useState(ESCALATE_REASONS[0]);
  const [description, setDesc]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);
  const [escNewId, setEscNewId]     = useState("");

  const submit = () => {
    setSubmitting(true);
    setTimeout(() => {
      const newId = `SESC-${Math.floor(1000 + Math.random() * 9000)}`;
      setEscNewId(newId);
      setDone(true);
      setSubmitting(false);
      setTimeout(() => onSubmit(priority, reason, description.trim()), 1100);
    }, 600);
  };

  const priorityColors: Record<Priority, { border: string; bg: string; text: string }> = {
    Critical: { border: "rgba(239,68,68,0.4)",  bg: "rgba(239,68,68,0.1)",  text: "#ef4444" },
    High:     { border: "rgba(249,115,22,0.4)", bg: "rgba(249,115,22,0.1)", text: "#f97316" },
    Medium:   { border: "rgba(245,158,11,0.4)", bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
    Low:      { border: "rgba(34,197,94,0.4)",  bg: "rgba(34,197,94,0.1)",  text: "#22c55e" },
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader
        icon={<ArrowUpRight size={15} />}
        iconBg="rgba(249,115,22,0.1)" iconBorder="rgba(249,115,22,0.3)" iconColor="#f97316"
        title="Escalate Further — Super Admin" subtitle={escId} onClose={onClose}
      />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

        {/* Complaint summary */}
        <div className="rounded-lg border px-3 py-2.5 flex items-start gap-2"
          style={{ borderColor: "rgba(249,115,22,0.25)", background: "rgba(249,115,22,0.05)" }}>
          <ShieldAlert size={12} className="text-orange-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{title}</p>
        </div>

        {/* Priority */}
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-2">Escalation Priority</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(["Critical", "High", "Medium", "Low"] as Priority[]).map((p) => {
              const c = priorityColors[p];
              const active = priority === p;
              return (
                <button key={p} type="button" onClick={() => setPriority(p)}
                  className="h-8 rounded-lg border text-[11px] font-semibold transition-all"
                  style={{
                    borderColor: active ? c.border : "var(--color-border)",
                    background:  active ? c.bg     : "var(--color-surface)",
                    color:       active ? c.text   : "var(--color-text-muted)",
                  }}>
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Reason for Escalation</label>
          <div className="relative">
            <select value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full h-9 appearance-none rounded-lg border pl-3 pr-8 text-xs outline-none transition-colors"
              style={{ borderColor: "rgba(249,115,22,0.3)", background: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
              {ESCALATE_REASONS.map((r) => <option key={r} value={r} style={{ background: "var(--color-card)" }}>{r}</option>)}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">
            Detailed Description <span className="font-normal text-[var(--color-text-muted)]">(required)</span>
          </label>
          <textarea value={description} onChange={(e) => setDesc(e.target.value)} rows={5}
            placeholder="Describe why this issue cannot be resolved at district level, what resources or authority are needed, and any immediate safety/health concerns…"
            className="w-full rounded-lg border px-3 py-2.5 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none transition-colors leading-relaxed"
            style={{ background: "var(--color-surface)", borderColor: description ? "rgba(249,115,22,0.35)" : "var(--color-border)" }} />
          <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
            {description.length}/500 characters
          </p>
        </div>

        {/* Target info */}
        <div className="rounded-lg border px-3 py-2.5 flex items-start gap-2"
          style={{ borderColor: "rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.05)" }}>
          <ShieldAlert size={11} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
            This escalation will be sent to{" "}
            <span className="font-semibold text-blue-400">Super Admin → National Escalation Dashboard</span>
            {" "}as{" "}
            <span className="font-mono font-semibold text-orange-300">Pending Review</span>.
            {" "}Super admin will be notified immediately.
          </p>
        </div>

        {/* Success state */}
        {done && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border px-3 py-2.5 flex items-center gap-2"
            style={{ borderColor: "rgba(249,115,22,0.4)", background: "rgba(249,115,22,0.08)" }}>
            <Check size={13} className="text-orange-400 shrink-0" />
            <p className="text-[11px] font-medium text-orange-400">
              Escalated to Super Admin as <span className="font-mono font-bold">{escNewId}</span>
            </p>
          </motion.div>
        )}
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} submitting={submitting} done={done}
        doneLabel={`Escalated as ${escNewId}`} submitLabel="Escalate to Super Admin"
        submitColor={{ border: "rgba(249,115,22,0.4)", bg: "rgba(249,115,22,0.1)", color: "#f97316" }} />
    </Modal>
  );
}

/* ─── Mark In Progress (Investigating) Dialog ────────────────── */
function MarkInProgressDialog({ escId, onClose, onSubmit }: {
  escId: string; onClose: () => void; onSubmit: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const submit = () => {
    setSubmitting(true);
    setTimeout(() => { setDone(true); setSubmitting(false); setTimeout(() => onSubmit(note.trim()), 800); }, 500);
  };
  return (
    <Modal onClose={onClose}>
      <ModalHeader icon={<Wrench size={15} />} iconBg="rgba(245,158,11,0.1)" iconBorder="rgba(245,158,11,0.3)"
        iconColor="#f59e0b" title="Mark as Investigating" subtitle={escId} onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div className="rounded-lg border px-3 py-2.5 flex items-start gap-2"
          style={{ borderColor: "rgba(167,139,250,0.2)", background: "rgba(167,139,250,0.05)" }}>
          <CircleDot size={12} className="text-purple-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            Status will change to <span className="font-semibold text-purple-400">Investigating</span>. This signals the sub-district and citizen that active work has begun.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">
            Update Note <span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder="Describe initial steps being taken…"
            className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none transition-colors"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
        </div>
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} submitting={submitting} done={done}
        doneLabel="Updated!" submitLabel="Mark as Investigating"
        submitColor={{ border: "rgba(245,158,11,0.4)", bg: "rgba(245,158,11,0.1)", color: "#f59e0b" }} />
    </Modal>
  );
}

/* ─── Upload Evidence Dialog ─────────────────────────────────── */
function UploadEvidenceDialog({ escId, onClose, onSubmit }: {
  escId: string; onClose: () => void; onSubmit: (note: string, files: EvidenceFile[]) => void;
}) {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const submit = () => {
    setSubmitting(true);
    setTimeout(() => { setDone(true); setSubmitting(false); setTimeout(() => onSubmit(note.trim() || "Evidence uploaded", files), 900); }, 500);
  };
  return (
    <Modal onClose={onClose}>
      <ModalHeader icon={<Camera size={15} />} iconBg="rgba(167,139,250,0.1)" iconBorder="rgba(167,139,250,0.3)"
        iconColor="#a78bfa" title="Upload Evidence" subtitle={escId} onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <EvidenceFilePicker files={files} onChange={setFiles} maxFiles={6} />
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">
            Evidence Note <span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder="Describe what this evidence shows…"
            className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none transition-colors"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
        </div>
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} submitting={submitting} done={done}
        doneLabel="Uploaded!" submitLabel="Upload Evidence"
        submitColor={{ border: "rgba(167,139,250,0.4)", bg: "rgba(167,139,250,0.1)", color: "#a78bfa" }} />
    </Modal>
  );
}

/* ─── Sticky Actions Panel ───────────────────────────────────── */
function StickyActions({
  id, status, priority, title,
  onAssign, onMarkInProgress, onUploadEvidence,
  onResolve, onEscalateFurther, onReject, onRequestClarification,
}: {
  id: string; status: Status; priority: Priority; title: string;
  onAssign: (o: string) => void;
  onMarkInProgress: (note: string) => void;
  onUploadEvidence: (note: string, files: EvidenceFile[]) => void;
  onResolve: (note: string) => void;
  onEscalateFurther: (p: Priority, r: string, d: string) => void;
  onReject: (reason: string, note: string) => void;
  onRequestClarification: (message: string) => void;
}) {
  const [assignOpen,    setAssignOpen]    = useState(false);
  const [progressOpen,  setProgressOpen]  = useState(false);
  const [evidenceOpen,  setEvidenceOpen]  = useState(false);
  const [resolveOpen,   setResolveOpen]   = useState(false);
  const [escalateOpen,  setEscalateOpen]  = useState(false);
  const [rejectOpen,    setRejectOpen]    = useState(false);
  const [clarifyOpen,   setClarifyOpen]   = useState(false);

  const isResolved   = status === "Resolved" || status === "Closed";
  const isEscalated  = status === "Closed";
  const isInProgress = status === "Investigating";

  return (
    <div className="lg:sticky lg:top-4">
      <DashboardCard className="p-4 flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
          Case Actions
        </p>

        <motion.button type="button" whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: isResolved ? 1 : 0.97 }}
          disabled={isResolved} onClick={() => setAssignOpen(true)}
          className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)", color: "var(--color-info)" }}>
          <UserCheck size={14} /> Assign Officer
        </motion.button>

        <motion.button type="button" whileHover={{ x: isResolved || isInProgress ? 0 : 2 }} whileTap={{ scale: isResolved || isInProgress ? 1 : 0.97 }}
          disabled={isResolved || isInProgress} onClick={() => setProgressOpen(true)}
          className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>
          <Wrench size={14} /> {isInProgress ? "Investigating…" : "Mark In Progress"}
        </motion.button>

        <motion.button type="button" whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: isResolved ? 1 : 0.97 }}
          disabled={isResolved} onClick={() => setEvidenceOpen(true)}
          className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#a78bfa" }}>
          <Camera size={14} /> Upload Evidence
        </motion.button>

        <motion.button type="button" whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: isResolved ? 1 : 0.97 }}
          disabled={isResolved} onClick={() => setClarifyOpen(true)}
          className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "rgba(6,182,212,0.3)", background: "rgba(6,182,212,0.08)", color: "#06b6d4" }}>
          <MessageSquare size={14} /> Request Clarification
        </motion.button>

        <div className="my-1 border-t border-[var(--color-border)]" />

        <motion.button type="button" whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: isResolved ? 1 : 0.97 }}
          disabled={isResolved} onClick={() => setResolveOpen(true)}
          className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-semibold text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "rgba(20,184,166,0.35)", background: "rgba(20,184,166,0.08)", color: "#14b8a6" }}>
          <CheckCircle2 size={14} /> Resolve Escalation
        </motion.button>

        <motion.button type="button" whileHover={{ x: isResolved || isEscalated ? 0 : 2 }} whileTap={{ scale: isResolved || isEscalated ? 1 : 0.97 }}
          disabled={isResolved} onClick={() => setEscalateOpen(true)}
          className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.08)", color: "#f97316" }}>
          <ArrowUpRight size={14} /> Escalate Further
        </motion.button>

        <motion.button type="button" whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: isResolved ? 1 : 0.97 }}
          disabled={isResolved} onClick={() => setRejectOpen(true)}
          className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
          <XCircle size={14} /> Reject
        </motion.button>
      </DashboardCard>

      {/* Modals */}
      <AnimatePresence>
        {assignOpen   && <AssignModal          escId={id} current="" onClose={() => setAssignOpen(false)}   onAssign={(o) => { onAssign(o); setAssignOpen(false); }} />}
        {progressOpen && <MarkInProgressDialog escId={id} onClose={() => setProgressOpen(false)}  onSubmit={(n) => { onMarkInProgress(n); setProgressOpen(false); }} />}
        {evidenceOpen && <UploadEvidenceDialog escId={id} onClose={() => setEvidenceOpen(false)}  onSubmit={(n, f) => { onUploadEvidence(n, f); setEvidenceOpen(false); }} />}
        {resolveOpen  && <ResolveDialog        escId={id} onClose={() => setResolveOpen(false)}   onSubmit={(n) => { onResolve(n); setResolveOpen(false); }} />}
        {escalateOpen && <EscalateFurtherDialog escId={id} title={title} priority={priority}
          onClose={() => setEscalateOpen(false)}
          onSubmit={(p, r, d) => { onEscalateFurther(p, r, d); setEscalateOpen(false); }} />}
        {rejectOpen   && <RejectDialog         escId={id} onClose={() => setRejectOpen(false)}    onSubmit={(r, n) => { onReject(r, n); setRejectOpen(false); }} />}
        {clarifyOpen  && <ClarifyDialog        escId={id} onClose={() => setClarifyOpen(false)}  onSubmit={(m) => { onRequestClarification(m); setClarifyOpen(false); }} />}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function EscalationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const storeEsc = useEscalationStore((s) => s.escalations.find((e) => e.id === id));
  const sourceComplaintId = storeEsc?.sourceComplaintId;
  const districtFields = currentDistrictFields();
  const assignOfficer = useEscalationStore((s) => s.assignOfficer);
  const setEscStatus = useEscalationStore((s) => s.setStatus);
  const escalateToSuper = useEscalationStore((s) => s.escalateToSuperAdmin);
  const resolveEscalation = useEscalationStore((s) => s.resolveEscalation);
  const rejectEscalation = useEscalationStore((s) => s.rejectEscalation);
  const appendActivity = useEscalationStore((s) => s.appendActivity);
  const requestClarification = useEscalationStore((s) => s.requestClarification);
  const submitEvidence = useEvidenceStore((s) => s.submitEvidence);
  const pendingResolution = useComplaintWorkflowStore((s) =>
    s.resolutions.find((r) => r.escalationId === id || (sourceComplaintId ? r.complaintId === sourceComplaintId : false))
  );
  const approveResolution = useComplaintWorkflowStore((s) => s.approveResolution);
  const rejectResolution = useComplaintWorkflowStore((s) => s.rejectResolution);
  const requestResolutionClarification = useComplaintWorkflowStore((s) => s.requestResolutionClarification);

  const base = storeEsc ? buildEscalationDetail(storeEsc) : fallbackEscalationDetail(id);

  const [superEscId, setSuperEscId] = useState<string | null>(
    storeEsc?.parentEscalationId ? null : null
  );
  const [escalatedUp, setEscalatedUp] = useState(storeEsc?.status === "Closed" && !!storeEsc?.tier);
  const [noteText, setNoteText] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  const handleAssign = (officer: string) => {
    assignOfficer(id, officer, "District Admin");
    showToast(`Assigned to ${officer}`);
  };

  const handleMarkInProgress = (note: string) => {
    setEscStatus(id, "Investigating", "District Officer", `Marked as Investigating${note ? ` — ${note}` : ""}`);
    showToast("Status updated to Investigating");
  };

  const handleUploadEvidence = (note: string, files: EvidenceFile[]) => {
    const evId = submitEvidence({
      relatedEntityId: id,
      relatedEntityType: "Escalation",
      title: `Evidence for ${base.title}`,
      district: districtFields.district,
      state: districtFields.state,
      uploadedBy: "District Officer",
      notes: note,
      files: files.length > 0 ? files : [{ id: "f-up", label: "District upload", type: "image", size: "1.8 MB" }],
    });
    appendActivity(id, "District Officer", `Evidence submitted as ${evId}`);
    showToast(`Evidence ${evId} sent to Super Admin review`);
  };

  const handleResolve = (note: string) => {
    resolveEscalation(id, note, "District Officer");
    showToast("Escalation marked as Resolved");
  };

  const handleEscalateFurther = (p: Priority, reason: string, description: string) => {
    const newId = escalateToSuper(id, {
      priority: p,
      reason,
      description,
      district: districtFields.district,
      state: districtFields.state,
      submittedBy: "District Admin",
    });
    setSuperEscId(newId);
    setEscalatedUp(true);
    showToast(`Escalated to Super Admin as ${newId}`);
  };

  const handleReject = (reason: string, note: string) => {
    rejectEscalation(id, reason, note, "District Officer");
    showToast("Escalation rejected and returned to sub-district");
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    appendActivity(id, "District Officer", noteText.trim());
    setNoteText("");
    showToast("Note added to activity log");
  };

  const handleRequestClarification = (message: string) => {
    requestClarification(id, message, "District Officer");
    if (pendingResolution) requestResolutionClarification(pendingResolution.id, message);
    showToast("Clarification request sent to sub-district");
  };

  const e = {
    ...base,
    status: (storeEsc?.status ?? base.status) as Status,
    assignedTo: storeEsc?.assignedTo ?? base.assignedTo,
    activityLog: storeEsc?.activityLog ?? base.activityLog,
  };

  return (
    <div className="flex flex-col gap-3 pb-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]" aria-label="Breadcrumb">
        <Link href="/district-admin/dashboard" className="hover:text-[var(--color-text-secondary)] transition-colors">Dashboard</Link>
        <span className="opacity-40">›</span>
        <Link href="/district-admin/dashboard/escalation" className="hover:text-[var(--color-text-secondary)] transition-colors">Escalations</Link>
        <span className="opacity-40">›</span>
        <span className="text-[var(--color-text-secondary)] font-medium font-mono">{e.id}</span>
      </nav>

      {/* Super-admin escalation banner */}
      <AnimatePresence>
        {escalatedUp && superEscId && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
            style={{ borderColor: "rgba(249,115,22,0.35)", background: "rgba(249,115,22,0.08)" }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <ArrowUpRight size={14} className="text-orange-400 shrink-0" />
              <span className="text-xs text-[var(--color-text-secondary)]">
                Escalated to Super Admin as{" "}
                <span className="font-mono font-bold text-orange-400">{superEscId}</span>
                {" "}— <span className="font-semibold text-orange-400">Pending Review</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium"
            style={{ background: "var(--color-card)", borderColor: "rgba(20,184,166,0.35)", color: "#14b8a6" }}>
            <Check size={15} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/district-admin/dashboard/escalation">
            <motion.button whileHover={{ x: -2 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mt-0.5">
              <ArrowLeft size={15} /> Back
            </motion.button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <ShieldAlert size={15} className="text-teal-400" />
                <span className="font-mono text-sm font-bold" style={{ color: "var(--da-teal)" }}>{e.id}</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${PRIORITY_CLS[e.priority]}`}>{e.priority}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_CLS[e.status]}`}>{e.status}</span>
              <span className="text-[11px] text-[var(--color-text-muted)]">{e.daysOpen} days open · {e.subDistrict}</span>
            </div>
            <h1 className="text-base font-bold text-[var(--color-text-primary)] leading-snug max-w-2xl">{e.title}</h1>
          </div>
        </div>
        <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="da-btn-secondary flex items-center gap-1.5 !h-9 !px-3 !text-xs shrink-0">
          <Download size={13} /> Export
        </motion.button>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

        {/* ── Left (2/3) ── */}
        <div className="flex flex-col gap-3 lg:col-span-2">

          {/* Case Summary */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-teal-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Case Summary</h3>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{e.description}</p>
              <SlaBlock status={e.slaStatus} label={e.slaLabel} hours={e.slaHours} />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Escalated On", value: e.escalatedOn   },
                  { label: "Days Open",    value: `${e.daysOpen}d` },
                  { label: "Category",     value: e.category      },
                  { label: "Sub-District", value: e.subDistrict   },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                    <div className="text-xs font-bold text-[var(--color-text-primary)]">{m.value}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2"
                style={{ borderColor: "rgba(20,184,166,0.25)", background: "rgba(20,184,166,0.06)" }}>
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-teal-400" />
                  <span className="text-xs text-[var(--color-text-secondary)]">Expected Resolution</span>
                </div>
                <span className="text-xs font-bold text-teal-400">{e.expectedResolution}</span>
              </div>
            </DashboardCard>
          </motion.div>

          {storeEsc?.sourceComplaintId && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
              <DashboardCard className="p-4 flex items-center justify-between gap-3">
                <div className="text-xs text-[var(--color-text-secondary)]">
                  Source complaint{" "}
                  <Link
                    href={`/sub-district-admin/dashboard/complaints/${storeEsc.sourceComplaintId}`}
                    className="font-mono font-bold text-teal-400 hover:underline"
                  >
                    {storeEsc.sourceComplaintId}
                  </Link>
                  {" "}from {storeEsc.subDistrict}
                </div>
              </DashboardCard>
            </motion.div>
          )}

          {pendingResolution && pendingResolution.status === "Pending District Review" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <DashboardCard className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={14} className="text-cyan-400" />
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Closure Request — {pendingResolution.id}</h3>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">{pendingResolution.resolutionNotes}</p>
                {pendingResolution.workPerformed && (
                  <p className="text-[11px] text-[var(--color-text-muted)]">Work: {pendingResolution.workPerformed}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { approveResolution(pendingResolution.id); showToast("Closure approved — sub-district notified"); }}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "#10b981" }}>
                    Approve Closure
                  </button>
                  <button type="button" onClick={() => { rejectResolution(pendingResolution.id, "Insufficient evidence"); showToast("Closure rejected"); }}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold border text-red-400" style={{ borderColor: "rgba(239,68,68,0.4)" }}>
                    Reject
                  </button>
                </div>
              </DashboardCard>
            </motion.div>
          )}

          {/* Location */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-teal-400" />
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Location</h3>
                </div>
                <Link href="/district-admin/map"
                  className="flex items-center gap-1 text-[11px] font-medium hover:underline transition-colors"
                  style={{ color: "#14b8a6" }}>
                  Full Map →
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-x-6 divide-y divide-[var(--color-border)] sm:divide-y-0">
                {[
                  { label: "Address",      value: e.location     },
                  { label: "Coordinates",  value: e.coordinates  },
                  { label: "Sub-District", value: e.subDistrict  },
                  { label: "Zone",         value: e.zone         },
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
                  adminRole="district_admin"
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

          {/* Activity Log + Add Note */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-teal-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Activity Log</h3>
              </div>
              <div className="activity-timeline">
                <div className="da-activity-timeline-line activity-timeline-line" />
                <div className="activity-timeline-list">
                  {e.activityLog.map((entry, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.04 }} className="activity-timeline-item">
                      <div className={`activity-timeline-icon ${entry.actor === "System" ? "activity-timeline-icon-info" : "da-activity-timeline-icon-teal"}`}>
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
              {/* Add note — wired */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
                <textarea rows={2} value={noteText} onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add an officer note or update…"
                  className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] resize-none focus:outline-none focus:border-teal-500/40 transition-colors" />
                <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleAddNote} disabled={!noteText.trim()}
                  className="self-end h-8 px-4 rounded-lg border text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: "rgba(20,184,166,0.35)", background: noteText.trim() ? "rgba(20,184,166,0.1)" : "var(--color-surface)", color: "#14b8a6" }}>
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
              id={e.id} status={e.status} priority={e.priority} title={e.title}
              onAssign={handleAssign}
              onMarkInProgress={handleMarkInProgress}
              onUploadEvidence={handleUploadEvidence}
              onResolve={handleResolve}
              onEscalateFurther={handleEscalateFurther}
              onReject={handleReject}
              onRequestClarification={handleRequestClarification}
            />
          </motion.div>

          {/* Assignment */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <UserCheck size={14} className="text-teal-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Assignment</h3>
              </div>
              <div className="flex flex-col divide-y divide-[var(--color-border)]">
                {[
                  { label: "Officer",    value: e.assignedTo,          highlight: true  },
                  { label: "Assigned",   value: e.assignedDate,      highlight: false },
                  { label: "Resolution", value: e.expectedResolution, highlight: false },
                  { label: "Supervisor", value: e.supervisor,        highlight: false },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                    <span className="text-[11px] text-[var(--color-text-muted)]">{r.label}</span>
                    <span className={`text-[11px] font-medium ${r.highlight ? "text-teal-400" : "text-[var(--color-text-primary)]"}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </motion.div>

          {/* Case Timeline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <DashboardCard className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-teal-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Case Timeline</h3>
              </div>
              {e.timeline.map((step, i) => (
                <div key={i} className="flex gap-3 pb-2 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
                      style={{ borderColor: step.done ? "rgba(20,184,166,0.4)" : "var(--color-border)", background: step.done ? "rgba(20,184,166,0.1)" : "var(--color-surface)" }}>
                      {step.done ? <CheckCircle2 size={12} className="text-teal-400" /> : <Clock size={12} className="text-[var(--color-text-muted)]" />}
                    </div>
                    {i < e.timeline.length - 1 && (
                      <div className="w-px flex-1 mt-1 min-h-[12px]" style={{ background: step.done ? "rgba(20,184,166,0.3)" : "var(--color-border)" }} />
                    )}
                  </div>
                  <div className="pb-1 min-w-0">
                    <p className={`text-xs font-semibold ${step.done ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>{step.label}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{step.date}</p>
                    {step.note && <p className="text-[10px] text-[var(--color-text-secondary)] italic mt-0.5">{step.note}</p>}
                  </div>
                </div>
              ))}
            </DashboardCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, ShieldAlert, MapPin, FileText, Activity,
  MessageSquare, CheckCircle2, Clock, Timer, UserCheck,
  X, Check, ChevronDown, ArrowUpRight, XCircle,
  ClipboardCheck, Wrench, CircleDot,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import IndiaMap from "@/components/map/IndiaMap";
import { useEscalationStore } from "@/store/escalationStore";
import type { EscalationStatus, EscalationPriority } from "@/store/escalationStore";

/* ─── Helpers ────────────────────────────────────────────────── */
function nowStr() {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

/* ─── Badge helpers ──────────────────────────────────────────── */
const PRIORITY_CLS: Record<EscalationPriority, string> = {
  Critical: "bg-red-500/15 text-red-400 border border-red-500/30",
  High:     "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  Medium:   "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Low:      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
};
const STATUS_CLS: Record<EscalationStatus, string> = {
  "Pending Review": "bg-amber-500/12 text-amber-400 border border-amber-500/25",
  "Assigned":       "bg-blue-500/12 text-blue-400 border border-blue-500/25",
  "Investigating":  "bg-purple-500/12 text-purple-400 border border-purple-500/25",
  "Resolved":       "bg-teal-500/12 text-teal-400 border border-teal-500/25",
  "Closed":         "bg-slate-500/12 text-slate-400 border border-slate-500/25",
};
const SLA_COLOR: Record<string, string> = {
  Breached:   "#ef4444",
  "At Risk":  "#f59e0b",
  "On Track": "#14b8a6",
};

/* ─── Modal shell ────────────────────────────────────────────── */
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.94, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }} transition={{ type: "spring", damping: 24, stiffness: 320 }}
        className="w-full max-w-md rounded-2xl border shadow-xl flex flex-col"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)", maxHeight: "92vh" }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

function MHead({ icon, title, sub, color, onClose }: { icon: React.ReactNode; title: string; sub: string; color: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border"
          style={{ background: `${color}15`, borderColor: `${color}30`, color }}>{icon}</div>
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{title}</h3>
          <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">{sub}</p>
        </div>
      </div>
      <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"><X size={15} /></button>
    </div>
  );
}

function MFoot({ onClose, onSubmit, done, label, color }: { onClose: () => void; onSubmit: () => void; done: boolean; label: string; color: string }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3 shrink-0">
      <button onClick={onClose} disabled={done}
        className="h-9 px-4 rounded-lg border text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>Cancel</button>
      <motion.button whileHover={{ scale: done ? 1 : 1.02 }} whileTap={{ scale: done ? 1 : 0.97 }}
        onClick={onSubmit} disabled={done}
        className="flex items-center gap-2 h-9 px-5 rounded-lg border text-sm font-semibold transition-all"
        style={done
          ? { borderColor: "rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.1)", color: "#10b981" }
          : { borderColor: `${color}40`, background: `${color}15`, color }}>
        {done ? <><Check size={14} /> Done!</> : label}
      </motion.button>
    </div>
  );
}

/* ─── Approve Dialog ─────────────────────────────────────────── */
function ApproveDialog({ id, onClose, onSubmit }: { id: string; onClose: () => void; onSubmit: (n: string) => void }) {
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const submit = () => { setDone(true); setTimeout(() => onSubmit(note.trim()), 800); };
  return (
    <Modal onClose={onClose}>
      <MHead icon={<CheckCircle2 size={15} />} title="Approve Escalation" sub={id} color="#14b8a6" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div className="rounded-lg border px-3 py-2.5 flex items-start gap-2" style={{ borderColor: "rgba(20,184,166,0.25)", background: "rgba(20,184,166,0.05)" }}>
          <CheckCircle2 size={12} className="text-teal-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">Approving this escalation will move it to <strong>Investigating</strong> status and assign it for resolution.</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Approval Note <span className="font-normal text-[var(--color-text-muted)]">(required)</span></label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
            placeholder="Describe the action plan for resolving this escalation…"
            className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none transition-colors"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
        </div>
      </div>
      <MFoot onClose={onClose} onSubmit={submit} done={done} label="Approve Escalation" color="#14b8a6" />
    </Modal>
  );
}

/* ─── Reject Dialog ──────────────────────────────────────────── */
const REJECT_REASONS = [
  "Insufficient evidence", "Duplicate escalation", "Outside jurisdiction",
  "Already resolved at district level", "Invalid category", "Other",
];
function RejectDialog({ id, onClose, onSubmit }: { id: string; onClose: () => void; onSubmit: (r: string, n: string) => void }) {
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const submit = () => { setDone(true); setTimeout(() => onSubmit(reason, note.trim()), 800); };
  return (
    <Modal onClose={onClose}>
      <MHead icon={<XCircle size={15} />} title="Reject Escalation" sub={id} color="#ef4444" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Rejection Reason</label>
          <div className="relative">
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full h-9 appearance-none rounded-lg border pl-3 pr-8 text-xs outline-none"
              style={{ borderColor: "rgba(239,68,68,0.3)", background: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
              {REJECT_REASONS.map(r => <option key={r} value={r} style={{ background: "var(--color-card)" }}>{r}</option>)}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Additional Notes <span className="font-normal text-[var(--color-text-muted)]">(optional)</span></label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder="Provide context for the rejection…"
            className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none transition-colors"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
        </div>
      </div>
      <MFoot onClose={onClose} onSubmit={submit} done={done} label="Reject Escalation" color="#ef4444" />
    </Modal>
  );
}

/* ─── Mark Under Review Dialog ───────────────────────────────── */
function UnderReviewDialog({ id, onClose, onSubmit }: { id: string; onClose: () => void; onSubmit: (n: string) => void }) {
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const submit = () => { setDone(true); setTimeout(() => onSubmit(note.trim()), 800); };
  return (
    <Modal onClose={onClose}>
      <MHead icon={<Wrench size={15} />} title="Mark Under Review" sub={id} color="#f59e0b" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div className="rounded-lg border px-3 py-2.5 flex items-start gap-2" style={{ borderColor: "rgba(167,139,250,0.2)", background: "rgba(167,139,250,0.05)" }}>
          <CircleDot size={12} className="text-purple-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">Status will change to <strong>Investigating</strong>. This signals active work has begun.</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Update Note <span className="font-normal text-[var(--color-text-muted)]">(optional)</span></label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder="Describe initial steps being taken…"
            className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none transition-colors"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
        </div>
      </div>
      <MFoot onClose={onClose} onSubmit={submit} done={done} label="Mark as Investigating" color="#f59e0b" />
    </Modal>
  );
}

/* ─── Request Clarification Dialog ──────────────────────────── */
function ClarifyDialog({ id, onClose, onSubmit }: { id: string; onClose: () => void; onSubmit: (m: string) => void }) {
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const submit = () => { setDone(true); setTimeout(() => onSubmit(msg.trim()), 800); };
  return (
    <Modal onClose={onClose}>
      <MHead icon={<MessageSquare size={15} />} title="Request Clarification" sub={id} color="#a78bfa" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Clarification Message <span className="font-normal text-[var(--color-text-muted)]">(required)</span></label>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5}
            placeholder="Describe what additional information or action is needed from the district…"
            className="w-full rounded-lg border px-3 py-2.5 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none leading-relaxed transition-colors"
            style={{ background: "var(--color-surface)", borderColor: msg ? "rgba(167,139,250,0.4)" : "var(--color-border)" }} />
          <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{msg.length}/500 characters</p>
        </div>
        <div className="rounded-lg border px-3 py-2 flex items-center gap-2" style={{ borderColor: "rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.05)" }}>
          <Activity size={11} className="text-blue-400 shrink-0" />
          <p className="text-[10px] text-[var(--color-text-muted)]">Message will be logged and the originating district admin notified.</p>
        </div>
      </div>
      <MFoot onClose={onClose} onSubmit={submit} done={done} label="Send Request" color="#a78bfa" />
    </Modal>
  );
}

/* ─── Reassign Dialog ────────────────────────────────────────── */
const REASSIGN_OPTIONS = ["National Highway Authority", "State Infrastructure Dept", "Audit & Compliance Cell", "Infrastructure Safety Board", "Special Investigation Unit"];
function ReassignDialog({ id, onClose, onSubmit }: { id: string; onClose: () => void; onSubmit: (o: string) => void }) {
  const [sel, setSel] = useState("");
  const [done, setDone] = useState(false);
  const submit = () => { setDone(true); setTimeout(() => onSubmit(sel), 800); };
  return (
    <Modal onClose={onClose}>
      <MHead icon={<UserCheck size={15} />} title="Reassign Case" sub={id} color="#3b82f6" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
        <p className="text-xs text-[var(--color-text-muted)] mb-1">Select the authority to reassign this escalation.</p>
        {REASSIGN_OPTIONS.map(o => (
          <button key={o} type="button" onClick={() => setSel(o)}
            className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm text-left transition-all"
            style={{
              borderColor: sel === o ? "rgba(20,184,166,0.4)" : "var(--color-border)",
              background:  sel === o ? "rgba(20,184,166,0.08)" : "var(--color-surface)",
              color:       sel === o ? "#14b8a6" : "var(--color-text-secondary)",
            }}>
            {o}{sel === o && <Check size={13} className="text-teal-400 shrink-0" />}
          </button>
        ))}
      </div>
      <MFoot onClose={onClose} onSubmit={submit} done={done} label="Reassign" color="#3b82f6" />
    </Modal>
  );
}

/* ─── Approve Closure Dialog ─────────────────────────────────── */
function ClosureDialog({ id, onClose, onSubmit }: { id: string; onClose: () => void; onSubmit: (n: string) => void }) {
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const submit = () => { setDone(true); setTimeout(() => onSubmit(note.trim()), 800); };
  return (
    <Modal onClose={onClose}>
      <MHead icon={<ClipboardCheck size={15} />} title="Approve Closure" sub={id} color="#10b981" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div className="rounded-lg border px-3 py-2.5 flex items-start gap-2" style={{ borderColor: "rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.05)" }}>
          <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">Approving closure will mark this escalation as <strong>Resolved</strong>. The originating district will be notified.</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Closure Summary <span className="font-normal text-[var(--color-text-muted)]">(required)</span></label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
            placeholder="Summarise what was done to resolve this escalation…"
            className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none transition-colors"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
        </div>
      </div>
      <MFoot onClose={onClose} onSubmit={submit} done={done} label="Approve Closure" color="#10b981" />
    </Modal>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function EscalationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const escalations = useEscalationStore(s => s.escalations);
  const base = escalations.find(e => e.id === id) ?? {
    id, title: `Escalation ${id}`, subDistrict: "Unknown", category: "General",
    priority: "High" as EscalationPriority, status: "Pending Review" as EscalationStatus,
    slaStatus: "At Risk" as const, slaLabel: "Unknown", slaHours: 0,
    assignedTo: "Unassigned", escalatedOn: "—", daysOpen: 0,
    reason: undefined, notes: undefined,
  };

  const [status,      setStatus]      = useState<EscalationStatus>(base.status);
  const [assignedTo,  setAssignedTo]  = useState(base.assignedTo);
  const [activityLog, setActivityLog] = useState<{ time: string; actor: string; action: string }[]>([
    { time: base.escalatedOn, actor: "System",       action: `Escalation received from ${base.subDistrict}` },
  ]);
  const [noteText,    setNoteText]    = useState("");
  const [toast,       setToast]       = useState<string | null>(null);

  // Dialogs
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen,  setRejectOpen]  = useState(false);
  const [reviewOpen,  setReviewOpen]  = useState(false);
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [reassignOpen,setReassignOpen]= useState(false);
  const [closureOpen, setClosureOpen] = useState(false);

  function log(actor: string, action: string) {
    setActivityLog(prev => [{ time: nowStr(), actor, action }, ...prev]);
  }
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const handleApprove = (note: string) => {
    setStatus("Investigating");
    setApproveOpen(false);
    log("Super Admin", `Escalation approved${note ? ` — ${note}` : ""}`);
    showToast("Escalation approved");
  };
  const handleReject = (reason: string, note: string) => {
    setStatus("Closed");
    setRejectOpen(false);
    log("Super Admin", `Escalation rejected — ${reason}${note ? ` | ${note}` : ""}`);
    showToast("Escalation rejected");
  };
  const handleReview = (note: string) => {
    setStatus("Investigating");
    setReviewOpen(false);
    log("Super Admin", `Marked as Investigating${note ? ` — ${note}` : ""}`);
    showToast("Status updated to Investigating");
  };
  const handleClarify = (msg: string) => {
    setClarifyOpen(false);
    log("Super Admin", `Clarification requested: ${msg.substring(0,80)}…`);
    showToast("Clarification request sent");
  };
  const handleReassign = (officer: string) => {
    setAssignedTo(officer);
    setReassignOpen(false);
    log("Super Admin", `Reassigned to ${officer}`);
    showToast(`Reassigned to ${officer}`);
  };
  const handleClosure = (note: string) => {
    setStatus("Resolved");
    setClosureOpen(false);
    log("Super Admin", `Closure approved — ${note.substring(0,80)}${note.length > 80 ? "…" : ""}`);
    showToast("Escalation closed");
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    log("Super Admin", noteText.trim());
    setNoteText("");
    showToast("Note added");
  };

  const isResolved = status === "Resolved" || status === "Closed";
  const slaColor   = SLA_COLOR[base.slaStatus] ?? "#94a3b8";

  return (
    <div className="flex flex-col gap-3 pb-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
        <Link href="/super-admin/complaints/escalated-cases" className="hover:text-[var(--color-text-secondary)] transition-colors">Escalated Cases</Link>
        <span className="opacity-40">›</span>
        <span className="text-[var(--color-text-secondary)] font-medium font-mono">{id}</span>
      </nav>

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

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
        <Link href="/super-admin/complaints/escalated-cases">
          <motion.button whileHover={{ x: -2 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mt-0.5">
            <ArrowLeft size={15} /> Back
          </motion.button>
        </Link>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5"><ShieldAlert size={15} className="text-orange-400" /><span className="font-mono text-sm font-bold text-orange-400">{id}</span></div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${PRIORITY_CLS[base.priority]}`}>{base.priority}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_CLS[status]}`}>{status}</span>
            <span className="text-[11px] text-[var(--color-text-muted)]">{base.daysOpen} days open · {base.subDistrict}</span>
          </div>
          <h1 className="text-base font-bold text-[var(--color-text-primary)] leading-snug max-w-2xl">{base.title}</h1>
        </div>
      </motion.div>

      {/* Two-column */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

        {/* ── Left 2/3 ── */}
        <div className="flex flex-col gap-3 lg:col-span-2">

          {/* Case Summary */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2"><FileText size={14} className="text-orange-400" /><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Case Summary</h3></div>

              {/* SLA */}
              <div className="rounded-xl border p-3.5" style={{ background: `${slaColor}10`, borderColor: `${slaColor}35` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><Timer size={14} style={{ color: slaColor }} /><span className="text-xs font-bold text-[var(--color-text-primary)]">SLA Status</span></div>
                  <span className={`text-xs font-bold ${base.slaStatus === "Breached" ? "animate-pulse" : ""}`} style={{ color: slaColor }}>{base.slaLabel}</span>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.12)" }}>
                  <div className="h-full rounded-full" style={{ width: base.slaStatus === "Breached" ? "100%" : base.slaStatus === "At Risk" ? "75%" : "35%", background: slaColor }} />
                </div>
                <p className="mt-1.5 text-[10px]" style={{ color: slaColor }}>
                  {base.slaStatus === "Breached" ? "SLA breached — immediate action required" : `${base.slaStatus} — ${base.slaLabel} remaining`}
                </p>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Escalated On",  value: base.escalatedOn   },
                  { label: "Days Open",     value: `${base.daysOpen}d` },
                  { label: "Category",      value: base.category      },
                  { label: "Sub-District",  value: base.subDistrict   },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                    <div className="text-xs font-bold text-[var(--color-text-primary)]">{m.value}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Reason / Notes from escalation store */}
              {base.reason && (
                <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(249,115,22,0.2)", background: "rgba(249,115,22,0.05)" }}>
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Escalation Reason</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{base.reason}</p>
                </div>
              )}
              {base.notes && (
                <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Additional Notes</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{base.notes}</p>
                </div>
              )}
            </DashboardCard>
          </motion.div>

          {/* Location */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><MapPin size={14} className="text-orange-400" /><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Location</h3></div>
                <Link href="/super-admin/gis/infrastructure-map" className="text-[11px] font-medium hover:underline transition-colors" style={{ color: "#22d3ee" }}>Full Map →</Link>
              </div>
              <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-x-6 divide-y divide-[var(--color-border)] sm:divide-y-0">
                {[
                  { label: "Sub-District",  value: base.subDistrict   },
                  { label: "Category",      value: base.category      },
                  { label: "Assigned To",   value: assignedTo         },
                  { label: "Escalated On",  value: base.escalatedOn   },
                ].map((r) => (
                  <div key={r.label} className="flex items-start justify-between gap-3 py-2 border-b border-[var(--color-border)] last:border-0 sm:border-b-0 sm:py-1.5">
                    <span className="text-[11px] text-[var(--color-text-muted)] shrink-0 w-24 pt-px">{r.label}</span>
                    <span className="text-[11px] text-[var(--color-text-primary)] font-medium text-right min-w-0 break-words">{r.value}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl overflow-hidden">
                <IndiaMap adminRole="super_admin" height="200px" showBreadcrumb={false} showControls={false} showLegend={false} showSidebar={false} isDark />
              </div>
            </DashboardCard>
          </motion.div>

          {/* Activity Log */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2"><Activity size={14} className="text-orange-400" /><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Activity Log</h3></div>
              <div className="activity-timeline">
                <div className="activity-timeline-line" />
                <div className="activity-timeline-list">
                  {activityLog.map((entry, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="activity-timeline-item">
                      <div className={`activity-timeline-icon ${entry.actor === "System" ? "activity-timeline-icon-info" : "activity-timeline-icon-amber"}`}>
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
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
                <textarea rows={2} value={noteText} onChange={e => setNoteText(e.target.value)}
                  placeholder="Add an officer note or update…"
                  className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] resize-none focus:outline-none focus:border-orange-500/40 transition-colors" />
                <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleAddNote} disabled={!noteText.trim()}
                  className="self-end h-8 px-4 rounded-lg border text-xs font-medium transition-all disabled:opacity-40"
                  style={{ borderColor: "rgba(249,115,22,0.35)", background: noteText.trim() ? "rgba(249,115,22,0.1)" : "var(--color-surface)", color: "#f97316" }}>
                  Add Note
                </motion.button>
              </div>
            </DashboardCard>
          </motion.div>
        </div>

        {/* ── Right 1/3 ── */}
        <div className="flex flex-col gap-3">

          {/* Case Actions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <DashboardCard className="p-4 flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">Case Actions</p>

              {/* Approve */}
              <motion.button type="button" whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: isResolved ? 1 : 0.97 }}
                disabled={isResolved} onClick={() => setApproveOpen(true)}
                className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-semibold text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: "rgba(20,184,166,0.35)", background: "rgba(20,184,166,0.08)", color: "#14b8a6" }}>
                <CheckCircle2 size={14} /> Approve Escalation
              </motion.button>

              {/* Mark Under Review */}
              <motion.button type="button" whileHover={{ x: isResolved || status === "Investigating" ? 0 : 2 }} whileTap={{ scale: 0.97 }}
                disabled={isResolved || status === "Investigating"} onClick={() => setReviewOpen(true)}
                className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>
                <Wrench size={14} /> {status === "Investigating" ? "Investigating…" : "Mark Under Review"}
              </motion.button>

              {/* Request Clarification */}
              <motion.button type="button" whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: 0.97 }}
                disabled={isResolved} onClick={() => setClarifyOpen(true)}
                className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: "rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#a78bfa" }}>
                <MessageSquare size={14} /> Request Clarification
              </motion.button>

              {/* Reassign */}
              <motion.button type="button" whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: 0.97 }}
                disabled={isResolved} onClick={() => setReassignOpen(true)}
                className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)", color: "#3b82f6" }}>
                <UserCheck size={14} /> Reassign Case
              </motion.button>

              <div className="my-1 border-t border-[var(--color-border)]" />

              {/* Approve Closure */}
              <motion.button type="button" whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: 0.97 }}
                disabled={isResolved} onClick={() => setClosureOpen(true)}
                className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: "rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.08)", color: "#10b981" }}>
                <ClipboardCheck size={14} /> Approve Closure
              </motion.button>

              {/* Reject */}
              <motion.button type="button" whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: 0.97 }}
                disabled={isResolved} onClick={() => setRejectOpen(true)}
                className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                <XCircle size={14} /> Reject
              </motion.button>
            </DashboardCard>
          </motion.div>

          {/* Assignment Card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2"><UserCheck size={14} className="text-orange-400" /><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Assignment</h3></div>
              <div className="flex flex-col divide-y divide-[var(--color-border)]">
                {[
                  { label: "Assigned To",  value: assignedTo,       highlight: true  },
                  { label: "Escalated On", value: base.escalatedOn, highlight: false },
                  { label: "Days Open",    value: `${base.daysOpen}d`, highlight: false },
                  { label: "Category",     value: base.category,    highlight: false },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                    <span className="text-[11px] text-[var(--color-text-muted)]">{r.label}</span>
                    <span className={`text-[11px] font-medium text-right max-w-[140px] truncate ${r.highlight ? "text-orange-400" : "text-[var(--color-text-primary)]"}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </motion.div>

          {/* Status History */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <DashboardCard className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-orange-400" /><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Status History</h3></div>
              {[
                { label: "Complaint Raised",       done: true  },
                { label: "Escalated to District",  done: true  },
                { label: "Escalated to Super",     done: true  },
                { label: "Investigating",          done: status === "Investigating" || status === "Resolved" || status === "Closed" },
                { label: "Resolved / Closed",      done: status === "Resolved" || status === "Closed" },
              ].map((step, i) => (
                <div key={i} className="flex gap-3 pb-2 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
                      style={{ borderColor: step.done ? "rgba(20,184,166,0.4)" : "var(--color-border)", background: step.done ? "rgba(20,184,166,0.1)" : "var(--color-surface)" }}>
                      {step.done ? <CheckCircle2 size={12} className="text-teal-400" /> : <Clock size={12} className="text-[var(--color-text-muted)]" />}
                    </div>
                    {i < 4 && <div className="w-px flex-1 mt-1 min-h-[12px]" style={{ background: step.done ? "rgba(20,184,166,0.3)" : "var(--color-border)" }} />}
                  </div>
                  <div className="pb-1">
                    <p className={`text-xs font-semibold ${step.done ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>{step.label}</p>
                  </div>
                </div>
              ))}
            </DashboardCard>
          </motion.div>
        </div>
      </div>

      {/* All Dialogs */}
      <AnimatePresence>
        {approveOpen  && <ApproveDialog   id={id} onClose={() => setApproveOpen(false)}  onSubmit={handleApprove}  />}
        {rejectOpen   && <RejectDialog    id={id} onClose={() => setRejectOpen(false)}   onSubmit={handleReject}   />}
        {reviewOpen   && <UnderReviewDialog id={id} onClose={() => setReviewOpen(false)} onSubmit={handleReview}   />}
        {clarifyOpen  && <ClarifyDialog   id={id} onClose={() => setClarifyOpen(false)}  onSubmit={handleClarify}  />}
        {reassignOpen && <ReassignDialog  id={id} onClose={() => setReassignOpen(false)} onSubmit={handleReassign} />}
        {closureOpen  && <ClosureDialog   id={id} onClose={() => setClosureOpen(false)}  onSubmit={handleClosure}  />}
      </AnimatePresence>
    </div>
  );
}

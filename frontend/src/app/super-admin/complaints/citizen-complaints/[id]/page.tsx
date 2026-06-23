"use client";

import { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, AlertTriangle, MapPin, FileText, Activity,
  MessageSquare, Camera, CheckCircle2, Clock, Timer,
  X, Check, ChevronDown, Download, UserCheck, Search,
  ClipboardCheck, Eye, ArrowUpRight, XCircle,
  ShieldAlert, IndianRupee, Shield, ChevronLeft, ChevronRight,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import IndiaMap from "@/components/map/IndiaMap";
import { useAuthStore } from "@/stores/authStore";
import { shouldUseMock } from "@/lib/useMock";
import {
  SA_COMPLAINT_MAP, priorityBadge, statusBadge, slaBadgeColor,
  type SAStatus, type SAPriority,
} from "@/lib/super-admin-mock";
import { AdminAIAnnotatedPanel } from "@/components/admin/AdminAIAnnotatedPanel";

function getEvidenceImageUrl(img: { label: string; url?: string }, category: string): string {
  if (img.url) return img.url;
  const labelLower = img.label.toLowerCase();
  const catLower = category.toLowerCase();
  if (catLower.includes("road") || catLower.includes("pothole") || labelLower.includes("pothole") || labelLower.includes("road")) {
    return "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600&auto=format&fit=cover";
  }
  if (catLower.includes("water") || catLower.includes("flood") || catLower.includes("sewage") || labelLower.includes("water") || labelLower.includes("sewage")) {
    return "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=cover";
  }
  if (catLower.includes("light") || labelLower.includes("light") || labelLower.includes("dark")) {
    return "https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=600&auto=format&fit=cover";
  }
  if (catLower.includes("garbage") || catLower.includes("sanitation") || labelLower.includes("garbage") || labelLower.includes("trash")) {
    return "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600&auto=format&fit=cover";
  }
  return "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=600&auto=format&fit=cover";
}

/* ─── Helpers ────────────────────────────────────────────────── */
function now() {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

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

function ModalHeader({ icon, title, subtitle, iconColor, onClose }: {
  icon: React.ReactNode; title: string; subtitle: string; iconColor: string; onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border"
          style={{ background: `${iconColor}15`, borderColor: `${iconColor}30`, color: iconColor }}>{icon}</div>
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{title}</h3>
          <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">{subtitle}</p>
        </div>
      </div>
      <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"><X size={15} /></button>
    </div>
  );
}

function ModalFooter({ onClose, onSubmit, submitting, done, doneLabel, label, color }: {
  onClose: () => void; onSubmit: () => void; submitting: boolean; done: boolean;
  doneLabel: string; label: string; color: string;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3 shrink-0">
      <button onClick={onClose} disabled={submitting || done}
        className="h-9 px-4 rounded-lg border text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>Cancel</button>
      <motion.button whileHover={{ scale: done || submitting ? 1 : 1.02 }} whileTap={{ scale: done || submitting ? 1 : 0.97 }}
        onClick={onSubmit} disabled={submitting || done}
        className="flex items-center gap-2 h-9 px-5 rounded-lg border text-sm font-semibold transition-all disabled:opacity-60"
        style={done
          ? { borderColor: "rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.1)", color: "#10b981" }
          : { borderColor: `${color}40`, background: `${color}15`, color }}>
        {done ? <><Check size={14} /> {doneLabel}</> : submitting
          ? <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" /> Saving…</>
          : label}
      </motion.button>
    </div>
  );
}

/* ─── Status Update Dialog ───────────────────────────────────── */
const STATUS_OPTIONS: { value: SAStatus; label: string; color: string }[] = [
  { value: "Open",         label: "Open",         color: "#ef4444" },
  { value: "Under Review", label: "Under Review", color: "#a78bfa" },
  { value: "Escalated",    label: "Escalated",    color: "#f97316" },
  { value: "Resolved",     label: "Resolved",     color: "#10b981" },
  { value: "Closed",       label: "Closed",       color: "#64748b" },
];

function StatusUpdateDialog({ id, current, onClose, onSubmit }: {
  id: string; current: SAStatus; onClose: () => void; onSubmit: (s: SAStatus, note: string) => void;
}) {
  const [selected, setSelected] = useState<SAStatus>(current);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const submit = () => {
    setSubmitting(true);
    setTimeout(() => { setDone(true); setSubmitting(false); setTimeout(() => onSubmit(selected, note.trim()), 800); }, 500);
  };
  return (
    <Modal onClose={onClose}>
      <ModalHeader icon={<ClipboardCheck size={15} />} title="Update Status" subtitle={id} iconColor="#22d3ee" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Current:</span>
          <span className={`dashboard-table-badge ${statusBadge[current]}`}>{current}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => setSelected(opt.value)}
              className="flex items-center gap-2 h-10 px-3 rounded-xl border text-xs font-medium transition-all text-left"
              style={{
                borderColor: selected === opt.value ? `${opt.color}50` : "var(--color-border)",
                background:  selected === opt.value ? `${opt.color}12` : "var(--color-surface)",
                color:       selected === opt.value ? opt.color : "var(--color-text-muted)",
              }}>
              {opt.label}
              {selected === opt.value && opt.value !== current && <Check size={11} className="ml-auto shrink-0" />}
              {opt.value === current && <span className="ml-auto text-[9px] opacity-50">current</span>}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Note <span className="font-normal text-[var(--color-text-muted)]">(optional)</span></label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder="Reason for status change…"
            className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none transition-colors"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
        </div>
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} submitting={submitting} done={done}
        doneLabel="Updated!" label="Update Status" color="#22d3ee" />
    </Modal>
  );
}

/* ─── Reassign Dialog ────────────────────────────────────────── */
const OFFICERS = ["National Highway Authority", "State PWD Officer", "District QA Team", "Audit & Compliance Cell", "Infrastructure Safety Board"];

function ReassignDialog({ id, onClose, onSubmit }: { id: string; onClose: () => void; onSubmit: (o: string, n: string) => void }) {
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const submit = () => { setDone(true); setTimeout(() => onSubmit(selected, note.trim()), 800); };
  return (
    <Modal onClose={onClose}>
      <ModalHeader icon={<UserCheck size={15} />} title="Reassign Case" subtitle={id} iconColor="#3b82f6" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        <p className="text-xs text-[var(--color-text-muted)]">Select the team or officer to reassign this complaint to.</p>
        {OFFICERS.map((o) => (
          <button key={o} type="button" onClick={() => setSelected(o)}
            className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm text-left transition-all"
            style={{
              borderColor: selected === o ? "rgba(34,211,238,0.4)" : "var(--color-border)",
              background:  selected === o ? "rgba(34,211,238,0.08)" : "var(--color-surface)",
              color:       selected === o ? "#22d3ee" : "var(--color-text-secondary)",
            }}>
            {o}{selected === o && <Check size={13} className="text-cyan-400 shrink-0" />}
          </button>
        ))}
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5 mt-2">Note <span className="font-normal text-[var(--color-text-muted)]">(optional)</span></label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Reason for reassignment…"
            className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none transition-colors"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
        </div>
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} submitting={false} done={done}
        doneLabel="Reassigned!" label="Reassign" color="#3b82f6" />
    </Modal>
  );
}

/* ─── Request Clarification Dialog ──────────────────────────── */
function ClarificationDialog({ id, onClose, onSubmit }: { id: string; onClose: () => void; onSubmit: (msg: string) => void }) {
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const submit = () => { setDone(true); setTimeout(() => onSubmit(msg.trim()), 800); };
  return (
    <Modal onClose={onClose}>
      <ModalHeader icon={<MessageSquare size={15} />} title="Request Clarification" subtitle={id} iconColor="#a78bfa" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Clarification Message <span className="font-normal text-[var(--color-text-muted)]">(required)</span></label>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5}
            placeholder="Describe what additional information is needed from the district admin or reporting party…"
            className="w-full rounded-lg border px-3 py-2.5 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none leading-relaxed transition-colors"
            style={{ background: "var(--color-surface)", borderColor: msg ? "rgba(167,139,250,0.4)" : "var(--color-border)" }} />
          <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{msg.length}/500 characters</p>
        </div>
        <div className="rounded-lg border px-3 py-2 flex items-center gap-2"
          style={{ borderColor: "rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.05)" }}>
          <Activity size={11} className="text-blue-400 shrink-0" />
          <p className="text-[10px] text-[var(--color-text-muted)]">Message will be logged and district admin notified.</p>
        </div>
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} submitting={false} done={done}
        doneLabel="Sent!" label="Send Request" color="#a78bfa" />
    </Modal>
  );
}

/* ─── Approve Closure Dialog ─────────────────────────────────── */
function ApproveClosureDialog({ id, onClose, onSubmit }: { id: string; onClose: () => void; onSubmit: (n: string) => void }) {
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const submit = () => { setDone(true); setTimeout(() => onSubmit(note.trim()), 800); };
  return (
    <Modal onClose={onClose}>
      <ModalHeader icon={<CheckCircle2 size={15} />} title="Approve Closure" subtitle={id} iconColor="#10b981" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div className="rounded-lg border px-3 py-2.5 flex items-start gap-2"
          style={{ borderColor: "rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.05)" }}>
          <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            Approving closure will mark this complaint as <strong>Resolved</strong> and archive it. This action confirms that the reported issue has been satisfactorily addressed.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Closure Note <span className="font-normal text-[var(--color-text-muted)]">(required)</span></label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
            placeholder="Summarise what action was taken to resolve the complaint…"
            className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none transition-colors"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
        </div>
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} submitting={false} done={done}
        doneLabel="Closed!" label="Approve Closure" color="#10b981" />
    </Modal>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const email = useAuthStore((state) => state.user?.email);
  const canUseMock = shouldUseMock(email);
  const base = canUseMock ? SA_COMPLAINT_MAP[id] : undefined;

  const complaint = (base ?? {
    id: "", title: "", description: "", status: "Open" as SAStatus, priority: "Medium" as SAPriority,
    assignedTo: "", reportedBy: "", reportedOn: "", updatedOn: "", state: "", district: "",
    project: "", category: "", coordinates: "", slaStatus: "On Track", slaLabel: "",
    evidence: [], activityLog: [],
  }) as NonNullable<typeof base>;

  const [status,      setStatus]      = useState<SAStatus>(complaint.status);
  const [assignedTo,  setAssignedTo]  = useState(complaint.assignedTo);
  const [activityLog, setActivityLog] = useState(complaint.activityLog);
  const [noteText,    setNoteText]    = useState("");
  const [toast,       setToast]       = useState<string | null>(null);
  const [lightbox,    setLightbox]    = useState<number | null>(null);

  // Dialogs
  const [statusOpen,      setStatusOpen]      = useState(false);
  const [reassignOpen,    setReassignOpen]     = useState(false);
  const [clarifyOpen,     setClarifyOpen]      = useState(false);
  const [closureOpen,     setClosureOpen]      = useState(false);

  function log(actor: string, action: string) {
    setActivityLog(prev => [{ time: now(), actor, action }, ...prev]);
  }
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const handleStatusUpdate = (s: SAStatus, note: string) => {
    setStatus(s);
    setStatusOpen(false);
    log("Super Admin", `Status updated to ${s}${note ? ` — ${note}` : ""}`);
    showToast(`Status updated to ${s}`);
  };

  const handleReassign = (officer: string, note: string) => {
    setAssignedTo(officer);
    setReassignOpen(false);
    log("Super Admin", `Case reassigned to ${officer}${note ? ` — ${note}` : ""}`);
    showToast(`Reassigned to ${officer}`);
  };

  const handleClarify = (msg: string) => {
    setClarifyOpen(false);
    log("Super Admin", `Clarification requested: ${msg.substring(0, 80)}…`);
    showToast("Clarification request sent");
  };

  const handleClosure = (note: string) => {
    setStatus("Resolved");
    setClosureOpen(false);
    log("Super Admin", `Closure approved — ${note.substring(0, 80)}${note.length > 80 ? "…" : ""}`);
    showToast("Complaint closed");
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    log("Super Admin", noteText.trim());
    setNoteText("");
    showToast("Note added");
  };

  const isResolved = status === "Resolved" || status === "Closed";
  const slaColor = slaBadgeColor[complaint.slaStatus] ?? "#94a3b8";

  // Early return for missing data — placed AFTER all hooks to respect Rules of Hooks
  if (!base) {
    return (
      <div className="flex flex-col gap-3 pb-6">
        <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
          <Link href="/super-admin/complaints/citizen-complaints" className="hover:text-[var(--color-text-secondary)] transition-colors">Complaints</Link>
          <span className="opacity-40">›</span>
          <span className="text-[var(--color-text-secondary)] font-medium font-mono">{id}</span>
        </nav>
        <DashboardCard className="p-5">
          <p className="text-sm text-[var(--color-text-secondary)]">Live complaint details are not available yet for this record.</p>
        </DashboardCard>
      </div>
    );
  }

  // After the guard, base is guaranteed to exist
  return (
    <div className="flex flex-col gap-3 pb-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
        <Link href="/super-admin/complaints/citizen-complaints" className="hover:text-[var(--color-text-secondary)] transition-colors">Complaints</Link>
        <span className="opacity-40">›</span>
        <span className="text-[var(--color-text-secondary)] font-medium font-mono">{complaint.id}</span>
      </nav>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium"
            style={{ background: "var(--color-card)", borderColor: "rgba(34,211,238,0.35)", color: "#22d3ee" }}>
            <Check size={15} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/super-admin/complaints/citizen-complaints">
            <motion.button whileHover={{ x: -2 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mt-0.5">
              <ArrowLeft size={15} /> Back
            </motion.button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-cyan-400">{complaint.id}</span>
              <span className={`dashboard-table-badge ${priorityBadge[complaint.priority]}`}>{complaint.priority}</span>
              <span className={`dashboard-table-badge ${statusBadge[status]}`}>{status}</span>
            </div>
            <h1 className="text-base font-bold text-[var(--color-text-primary)] leading-snug max-w-2xl">{complaint.title}</h1>
          </div>
        </div>
      </motion.div>

      {/* Two-column */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

        {/* ── Left 2/3 ── */}
        <div className="flex flex-col gap-3 lg:col-span-2">

          {/* Case Summary */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2"><FileText size={14} className="text-cyan-400" /><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Case Summary</h3></div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{complaint.description}</p>

              {/* SLA block */}
              <div className="rounded-xl border p-3.5" style={{ background: `${slaColor}10`, borderColor: `${slaColor}35` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><Timer size={14} style={{ color: slaColor }} /><span className="text-xs font-bold text-[var(--color-text-primary)]">SLA Status</span></div>
                  <span className="text-xs font-bold" style={{ color: slaColor }}>{complaint.slaLabel}</span>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.12)" }}>
                  <div className="h-full rounded-full" style={{ width: complaint.slaStatus === "Breached" ? "100%" : complaint.slaStatus === "At Risk" ? "80%" : "40%", background: slaColor }} />
                </div>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Reported On",  value: complaint.reportedOn  },
                  { label: "Updated",      value: complaint.updatedOn   },
                  { label: "State",        value: complaint.state       },
                  { label: "District",     value: complaint.district    },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                    <div className="text-xs font-bold text-[var(--color-text-primary)] truncate">{m.value}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </motion.div>

          {/* AI Object Detection Panel */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <AdminAIAnnotatedPanel
              complaintId={complaint.id}
              category={complaint.category}
              evidenceImageUrl={complaint.evidence[0] ? getEvidenceImageUrl(complaint.evidence[0], complaint.category) : null}
            />
          </motion.div>

          {/* Location */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2"><MapPin size={14} className="text-cyan-400" /><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Location</h3></div>
              <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-x-6 divide-y divide-[var(--color-border)] sm:divide-y-0">
                {[
                  { label: "Project",      value: complaint.project     },
                  { label: "Coordinates",  value: complaint.coordinates },
                  { label: "State",        value: complaint.state       },
                  { label: "District",     value: complaint.district    },
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

          {/* Evidence */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Camera size={14} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Evidence</h3>
                <span className="text-[10px] text-[var(--color-text-muted)]">({complaint.evidence.length} files)</span>
              </div>
              {complaint.evidence.length === 0 ? (
                <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-text-muted)]">No evidence uploaded</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {complaint.evidence.map((e, i) => (
                    <div key={i} onClick={() => setLightbox(i)} className="relative aspect-video rounded-xl border overflow-hidden group cursor-pointer"
                      style={{ borderColor: "rgba(34,211,238,0.2)", background: "rgba(34,211,238,0.05)" }}>
                      {/* Actual Image */}
                      <img
                        src={getEvidenceImageUrl(e, complaint.category)}
                        alt={e.label}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye size={14} className="text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 px-2 py-1.5 z-10">
                        <p className="text-[10px] font-medium text-white truncate">{e.label}</p>
                        <p className="text-[9px] text-white/60 truncate">{e.by} · {e.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardCard>
          </motion.div>

          {/* Activity Log */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2"><Activity size={14} className="text-cyan-400" /><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Activity Log</h3></div>
              <div className="activity-timeline">
                <div className="activity-timeline-line" />
                <div className="activity-timeline-list">
                  {activityLog.map((entry, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="activity-timeline-item">
                      <div className={`activity-timeline-icon ${entry.actor === "System" ? "activity-timeline-icon-info" : "activity-timeline-icon-cyan"}`}>
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
                  placeholder="Add a note…"
                  className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] resize-none focus:outline-none focus:border-cyan-500/40 transition-colors" />
                <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleAddNote} disabled={!noteText.trim()}
                  className="self-end h-8 px-4 rounded-lg border text-xs font-medium transition-all disabled:opacity-40"
                  style={{ borderColor: "rgba(34,211,238,0.35)", background: noteText.trim() ? "rgba(34,211,238,0.1)" : "var(--color-surface)", color: "#22d3ee" }}>
                  Add Note
                </motion.button>
              </div>
            </DashboardCard>
          </motion.div>
        </div>

        {/* ── Right 1/3 ── */}
        <div className="flex flex-col gap-3">

          {/* Case Actions / Governance Ownership */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <DashboardCard className="p-4 flex flex-col gap-2">
              {status === "Escalated" ? (
                <>
                  {/* Governance Ownership Card — case owned by District */}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">Governance Ownership</p>
                  <div className="rounded-lg border p-3 flex flex-col gap-2" style={{ borderColor: "rgba(249,115,22,0.25)", background: "rgba(249,115,22,0.04)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--color-text-muted)]">Current Owner</span>
                      <span className="text-xs font-bold text-orange-400">District Admin</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--color-text-muted)]">Complaint</span>
                      <span className="text-[10px] font-mono font-bold text-[var(--color-text-primary)]">{complaint.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--color-text-muted)]">Workflow Stage</span>
                      <span className="text-[10px] font-medium text-amber-400">Under District Review</span>
                    </div>
                  </div>

                  <div className="my-1 border-t border-[var(--color-border)]" />
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-1">Navigate to linked records:</p>

                  {/* Navigation Actions */}
                  <Link href="/super-admin/complaints/escalated-cases">
                    <motion.button type="button" whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full"
                      style={{ borderColor: "rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.08)", color: "#f97316" }}>
                      <ShieldAlert size={14} /> Open Escalation
                    </motion.button>
                  </Link>
                  <Link href="/super-admin/governance/approvals">
                    <motion.button type="button" whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full"
                      style={{ borderColor: "rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.08)", color: "#22d3ee" }}>
                      <IndianRupee size={14} /> Open Budget Requests
                    </motion.button>
                  </Link>
                  <Link href="/super-admin/complaints/resolution-tracker">
                    <motion.button type="button" whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full"
                      style={{ borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)", color: "#10b981" }}>
                      <CheckCircle2 size={14} /> Open Resolution Tracker
                    </motion.button>
                  </Link>
                  <Link href="/super-admin/audit">
                    <motion.button type="button" whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full"
                      style={{ borderColor: "rgba(100,116,139,0.3)", background: "rgba(100,116,139,0.08)", color: "#94a3b8" }}>
                      <Shield size={14} /> Open Audit Trail
                    </motion.button>
                  </Link>
                </>
              ) : (
                <>
                  {/* Non-escalated complaints — limited oversight actions */}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">Oversight Actions</p>

                  <motion.button type="button" whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: isResolved ? 1 : 0.97 }}
                    disabled={isResolved} onClick={() => setClarifyOpen(true)}
                    className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: "rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#a78bfa" }}>
                    <MessageSquare size={14} /> Request Clarification
                  </motion.button>

                  <div className="my-1 border-t border-[var(--color-border)]" />

                  <motion.button type="button" whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: isResolved ? 1 : 0.97 }}
                    disabled={isResolved} onClick={() => setClosureOpen(true)}
                    className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-semibold text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: "rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.08)", color: "#10b981" }}>
                    <CheckCircle2 size={14} /> Approve Closure
                  </motion.button>
                </>
              )}
            </DashboardCard>
          </motion.div>

          {/* Assignment */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2"><UserCheck size={14} className="text-cyan-400" /><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Assignment</h3></div>
              <div className="flex flex-col divide-y divide-[var(--color-border)]">
                {[
                  { label: "Assigned To", value: assignedTo,    highlight: true  },
                  { label: "Reported By", value: complaint.reportedBy, highlight: false },
                  { label: "Category",    value: complaint.category, highlight: false },
                  { label: "Project",     value: complaint.project,  highlight: false },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                    <span className="text-[11px] text-[var(--color-text-muted)]">{r.label}</span>
                    <span className={`text-[11px] font-medium text-right max-w-[140px] truncate ${r.highlight ? "text-cyan-400" : "text-[var(--color-text-primary)]"}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </motion.div>

          {/* Timeline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <DashboardCard className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-cyan-400" /><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Timeline</h3></div>
              {complaint.timeline.map((step, i) => (
                <div key={i} className="flex gap-3 pb-2 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
                      style={{ borderColor: step.done ? "rgba(16,185,129,0.4)" : "var(--color-border)", background: step.done ? "rgba(16,185,129,0.1)" : "var(--color-surface)" }}>
                      {step.done ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Clock size={12} className="text-[var(--color-text-muted)]" />}
                    </div>
                    {i < complaint.timeline.length - 1 && <div className="w-px flex-1 mt-1 min-h-[12px]" style={{ background: step.done ? "rgba(16,185,129,0.3)" : "var(--color-border)" }} />}
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

      {/* Dialogs */}
      <AnimatePresence>
        {statusOpen   && <StatusUpdateDialog   id={complaint.id} current={status}   onClose={() => setStatusOpen(false)}   onSubmit={handleStatusUpdate} />}
        {reassignOpen && <ReassignDialog        id={complaint.id}                     onClose={() => setReassignOpen(false)}  onSubmit={handleReassign}     />}
        {clarifyOpen  && <ClarificationDialog   id={complaint.id}                     onClose={() => setClarifyOpen(false)}   onSubmit={handleClarify}      />}
        {closureOpen  && <ApproveClosureDialog  id={complaint.id}                     onClose={() => setClosureOpen(false)}   onSubmit={handleClosure}      />}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightbox(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative w-full max-w-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
              <img
                src={getEvidenceImageUrl(complaint.evidence[lightbox], complaint.category)}
                alt={complaint.evidence[lightbox]?.label}
                className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-white/10"
              />
              <div className="mt-3 flex items-center justify-between px-1">
                <div>
                  <p className="text-sm font-semibold text-white">{complaint.evidence[lightbox]?.label}</p>
                  <p className="text-xs text-white/50">{complaint.evidence[lightbox]?.by} · {complaint.evidence[lightbox]?.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"><Download size={14} /></button>
                  <button onClick={() => setLightbox(null)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"><X size={14} /></button>
                </div>
              </div>
              {complaint.evidence.length > 1 && (
                <>
                  <button onClick={() => setLightbox((lightbox - 1 + complaint.evidence.length) % complaint.evidence.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setLightbox((lightbox + 1) % complaint.evidence.length)}
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

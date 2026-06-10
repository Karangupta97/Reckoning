"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  X,
  Flag,
  FilePlus,
  Camera,
  FileText,
  Video,
  Clock,
  MessageSquare,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { EVIDENCE_STATUS_CLS } from "@/components/super-admin-dashboard/evidence-ui";
import { useEvidenceStore } from "@/store/evidenceStore";

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="admin-modal-overlay fixed inset-0 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="admin-modal-panel relative w-full max-w-md rounded-xl border p-5 shadow-2xl"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{title}</h3>
          <button type="button" onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <X size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function MFoot({
  onClose,
  onSubmit,
  label,
  color,
  disabled,
}: {
  onClose: () => void;
  onSubmit: () => void;
  label: string;
  color: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        style={{ background: color }}
      >
        {label}
      </button>
    </div>
  );
}

const FILE_ICON = { image: Camera, pdf: FileText, video: Video };

export default function EvidenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const record = useEvidenceStore((s) => s.records.find((r) => r.id === id));
  const approveEvidence = useEvidenceStore((s) => s.approveEvidence);
  const rejectEvidence = useEvidenceStore((s) => s.rejectEvidence);
  const flagForInvestigation = useEvidenceStore((s) => s.flagForInvestigation);
  const requestAdditionalEvidence = useEvidenceStore((s) => s.requestAdditionalEvidence);
  const appendNote = useEvidenceStore((s) => s.appendNote);

  const [toast, setToast] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [approveNote, setApproveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [flagNote, setFlagNote] = useState("");
  const [additionalMsg, setAdditionalMsg] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-sm text-[var(--color-text-muted)]">Evidence {id} not found.</p>
        <Link href="/super-admin/evidence" className="text-xs text-cyan-400 hover:underline">
          ← Back to Evidence Center
        </Link>
      </div>
    );
  }

  const relatedHref =
    record.relatedEntityType === "Escalation"
      ? `/super-admin/complaints/escalated-cases/${record.relatedEntityId}`
      : `/super-admin/complaints/citizen-complaints/${record.relatedEntityId}`;

  const isTerminal = record.status === "Approved" || record.status === "Rejected";

  return (
    <div className="flex flex-col gap-3 pb-6">
      <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
        <Link href="/super-admin/evidence" className="hover:text-[var(--color-text-secondary)]">
          Evidence Center
        </Link>
        <span className="opacity-40">›</span>
        <span className="text-[var(--color-text-secondary)] font-medium font-mono">{id}</span>
      </nav>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium"
            style={{ background: "var(--color-card)", borderColor: "rgba(20,184,166,0.35)", color: "#14b8a6" }}
          >
            <Check size={15} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
        <Link href="/super-admin/evidence">
          <motion.button whileHover={{ x: -2 }} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mt-0.5">
            <ArrowLeft size={15} /> Back
          </motion.button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-sm font-bold text-cyan-400">{record.id}</span>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${EVIDENCE_STATUS_CLS[record.status]}`}>
              {record.status}
            </span>
            <Link href={relatedHref} className="text-[11px] font-mono text-[var(--color-text-muted)] hover:text-cyan-400">
              {record.relatedEntityType}: {record.relatedEntityId} →
            </Link>
          </div>
          <h1 className="text-base font-bold text-[var(--color-text-primary)]">{record.title}</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {record.district}, {record.state} · Uploaded {record.uploadedAt}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Evidence Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Complaint / Escalation", value: record.relatedEntityId },
                  { label: "District", value: record.district },
                  { label: "Uploaded By", value: record.uploadedBy },
                  { label: "Upload Time", value: record.uploadedAt },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                    <div className="text-xs font-bold text-[var(--color-text-primary)] truncate" title={m.value}>
                      {m.value}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
              {record.notes && (
                <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.05)" }}>
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Notes</p>
                  <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap">{record.notes}</p>
                </div>
              )}
            </DashboardCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Camera size={14} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Evidence Gallery</h3>
                <span className="text-[10px] text-[var(--color-text-muted)]">({record.files.length} files)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {record.files.map((f) => {
                  const Icon = FILE_ICON[f.type];
                  return (
                    <div
                      key={f.id}
                      className="relative aspect-video rounded-xl border overflow-hidden group cursor-pointer"
                      style={{ borderColor: "rgba(34,211,238,0.2)", background: "rgba(34,211,238,0.05)" }}
                    >
                      {f.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.previewUrl} alt={f.label} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon size={22} className="text-cyan-400 opacity-50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye size={14} className="text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 px-2 py-1.5">
                        <p className="text-[10px] font-medium text-white truncate">{f.label}</p>
                        <p className="text-[9px] text-white/60">{f.type.toUpperCase()} · {f.size}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DashboardCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Related Activity Timeline</h3>
              </div>
              <div className="flex flex-col gap-0">
                {record.timeline.map((step, i) => (
                  <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full shrink-0 mt-1 ${step.done ? "bg-cyan-400" : "border-2 border-[var(--color-border)]"}`} />
                      {i < record.timeline.length - 1 && (
                        <div className="w-px flex-1 my-1" style={{ background: step.done ? "#22d3ee" : "var(--color-border)", minHeight: 24 }} />
                      )}
                    </div>
                    <div className="pb-4 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-primary)]">{step.label}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">{step.date}</span>
                      </div>
                      {step.note && <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{step.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </motion.div>
        </div>

        <div className="flex flex-col gap-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <DashboardCard className="p-4 flex flex-col gap-2">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">Actions</h3>
              <ActionBtn icon={CheckCircle2} label="Approve Evidence" color="#10b981" onClick={() => setApproveOpen(true)} disabled={isTerminal} />
              <ActionBtn icon={X} label="Reject Evidence" color="#ef4444" onClick={() => setRejectOpen(true)} disabled={isTerminal} />
              <ActionBtn icon={Flag} label="Flag for Investigation" color="#f97316" onClick={() => setFlagOpen(true)} disabled={record.status === "Flagged"} />
              <ActionBtn icon={FilePlus} label="Request Additional Evidence" color="#06b6d4" onClick={() => setAdditionalOpen(true)} disabled={record.status === "Rejected"} />
            </DashboardCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Add Note</h3>
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder="Internal review note…"
                className="w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!noteText.trim()) return;
                  appendNote(record.id, noteText.trim());
                  setNoteText("");
                  showToast("Note added");
                }}
                className="self-end rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                style={{ background: "#06b6d4" }}
              >
                Add Note
              </button>
            </DashboardCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Activity Log</h3>
              </div>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {record.activityLog.map((a, i) => (
                  <div key={`${a.time}-${i}`} className="border-l-2 pl-2.5" style={{ borderColor: "rgba(6,182,212,0.4)" }}>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{a.time} · {a.actor}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{a.action}</p>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
            <Link
              href={`/super-admin/audit?category=Evidence%20Decisions&entity=${record.id}`}
              className="block text-center text-xs text-cyan-400 hover:underline py-2"
            >
              View in Audit Log Center →
            </Link>
          </motion.div>
        </div>
      </div>

      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="Approve Evidence">
        <textarea
          value={approveNote}
          onChange={(e) => setApproveNote(e.target.value)}
          rows={3}
          placeholder="Approval note (optional)…"
          className="w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        />
        <MFoot
          onClose={() => setApproveOpen(false)}
          onSubmit={() => {
            approveEvidence(record.id, approveNote);
            setApproveOpen(false);
            setApproveNote("");
            showToast("Evidence approved");
          }}
          label="Approve"
          color="#10b981"
        />
      </Modal>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Evidence">
        <div className="flex flex-col gap-3">
          <input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason (required)"
            className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          />
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={2}
            placeholder="Additional note (optional)"
            className="w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          />
        </div>
        <MFoot
          onClose={() => setRejectOpen(false)}
          onSubmit={() => {
            if (!rejectReason.trim()) return;
            rejectEvidence(record.id, rejectReason, rejectNote);
            setRejectOpen(false);
            setRejectReason("");
            setRejectNote("");
            showToast("Evidence rejected");
          }}
          label="Reject"
          color="#ef4444"
          disabled={!rejectReason.trim()}
        />
      </Modal>

      <Modal open={flagOpen} onClose={() => setFlagOpen(false)} title="Flag for Investigation">
        <textarea
          value={flagNote}
          onChange={(e) => setFlagNote(e.target.value)}
          rows={4}
          placeholder="Why is this evidence flagged?"
          className="w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        />
        <MFoot
          onClose={() => setFlagOpen(false)}
          onSubmit={() => {
            flagForInvestigation(record.id, flagNote);
            setFlagOpen(false);
            setFlagNote("");
            showToast("Flagged for investigation");
          }}
          label="Flag"
          color="#f97316"
        />
      </Modal>

      <Modal open={additionalOpen} onClose={() => setAdditionalOpen(false)} title="Request Additional Evidence">
        <textarea
          value={additionalMsg}
          onChange={(e) => setAdditionalMsg(e.target.value)}
          rows={4}
          placeholder="What additional evidence is needed?"
          className="w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        />
        <MFoot
          onClose={() => setAdditionalOpen(false)}
          onSubmit={() => {
            if (!additionalMsg.trim()) return;
            requestAdditionalEvidence(record.id, additionalMsg);
            setAdditionalOpen(false);
            setAdditionalMsg("");
            showToast("Additional evidence requested");
          }}
          label="Send Request"
          color="#06b6d4"
          disabled={!additionalMsg.trim()}
        />
      </Modal>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  color,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ borderColor: `${color}40`, color, background: `${color}10` }}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  X,
  MessageSquare,
  IndianRupee,
  RotateCcw,
  Search,
  FileText,
  Clock,
  History,
  Shield,
  Paperclip,
  CheckCircle2,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  BUDGET_PRIORITY_CLS,
  BUDGET_STATUS_CLS,
  BUDGET_TYPE_CLS,
} from "@/components/super-admin-dashboard/budget-approval-ui";
import {
  formatBudgetAmount,
  useBudgetApprovalStore,
  type BudgetRequest,
} from "@/store/budgetApprovalStore";

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
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-xl border p-5 shadow-2xl"
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
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      >
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

export default function BudgetApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const request = useBudgetApprovalStore((s) => s.requests.find((r) => r.id === id));
  const approveBudget = useBudgetApprovalStore((s) => s.approveBudget);
  const rejectBudget = useBudgetApprovalStore((s) => s.rejectBudget);
  const requestClarification = useBudgetApprovalStore((s) => s.requestClarification);
  const modifyApprovedAmount = useBudgetApprovalStore((s) => s.modifyApprovedAmount);
  const sendBackForReview = useBudgetApprovalStore((s) => s.sendBackForReview);
  const markUnderAudit = useBudgetApprovalStore((s) => s.markUnderAudit);
  const appendActivity = useBudgetApprovalStore((s) => s.appendActivity);
  const appendNote = useBudgetApprovalStore((s) => s.appendNote);

  const [toast, setToast] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const [approveNote, setApproveNote] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [clarifyMsg, setClarifyMsg] = useState("");
  const [modifyAmount, setModifyAmount] = useState("");
  const [modifyNote, setModifyNote] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [auditNote, setAuditNote] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-sm text-[var(--color-text-muted)]">Request {id} not found.</p>
        <Link href="/super-admin/governance/approvals" className="text-xs text-cyan-400 hover:underline">
          ← Back to Approval Queue
        </Link>
      </div>
    );
  }

  const r: BudgetRequest = request;
  const isTerminal = r.status === "Approved" || r.status === "Rejected";
  const displayAmount = r.approvedAmount ?? r.requestedAmount;

  const handleApprove = () => {
    const amt = approveAmount ? parseFloat(approveAmount) : undefined;
    approveBudget(r.id, approveNote, amt);
    setApproveOpen(false);
    setApproveNote("");
    setApproveAmount("");
    showToast("Budget approved");
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectBudget(r.id, rejectReason, rejectNote);
    setRejectOpen(false);
    setRejectReason("");
    setRejectNote("");
    showToast("Budget rejected");
  };

  const handleClarify = () => {
    if (!clarifyMsg.trim()) return;
    requestClarification(r.id, clarifyMsg);
    setClarifyOpen(false);
    setClarifyMsg("");
    showToast("Clarification request sent");
  };

  const handleModify = () => {
    const amt = parseFloat(modifyAmount);
    if (Number.isNaN(amt) || amt <= 0) return;
    modifyApprovedAmount(r.id, amt, modifyNote);
    setModifyOpen(false);
    setModifyAmount("");
    setModifyNote("");
    showToast("Approved amount updated");
  };

  const handleSendBack = () => {
    sendBackForReview(r.id, reviewNote);
    setReviewOpen(false);
    setReviewNote("");
    showToast("Sent back for review");
  };

  const handleAudit = () => {
    markUnderAudit(r.id, auditNote);
    setAuditOpen(false);
    setAuditNote("");
    showToast("Marked under audit");
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    appendNote(r.id, noteText.trim());
    appendActivity(r.id, "Super Admin", `Note added: ${noteText.trim()}`);
    setNoteText("");
    showToast("Note added");
  };

  return (
    <div className="flex flex-col gap-3 pb-6">
      <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
        <Link href="/super-admin/governance/approvals" className="hover:text-[var(--color-text-secondary)] transition-colors">
          Approval Queue
        </Link>
        <span className="opacity-40">›</span>
        <span className="text-[var(--color-text-secondary)] font-medium font-mono">{id}</span>
      </nav>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium"
            style={{ background: "var(--color-card)", borderColor: "rgba(20,184,166,0.35)", color: "#14b8a6" }}
          >
            <Check size={15} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
        <Link href="/super-admin/governance/approvals">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mt-0.5"
          >
            <ArrowLeft size={15} /> Back
          </motion.button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <IndianRupee size={15} className="text-cyan-400" />
              <span className="font-mono text-sm font-bold text-cyan-400">{r.id}</span>
            </div>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${BUDGET_PRIORITY_CLS[r.priority]}`}>
              {r.priority}
            </span>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${BUDGET_STATUS_CLS[r.status]}`}>
              {r.status}
            </span>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${BUDGET_TYPE_CLS[r.requestType]}`}>
              {r.requestType}
            </span>
          </div>
          <h1 className="text-base font-bold text-[var(--color-text-primary)] leading-snug">{r.project}</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {r.district}, {r.state} · {r.fiscalYear} · Submitted {r.submittedOn}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Request Summary</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "District", value: r.district },
                  { label: "Requested", value: formatBudgetAmount(r.requestedAmount) },
                  { label: "Approved", value: r.approvedAmount ? formatBudgetAmount(r.approvedAmount) : "—" },
                  { label: "Submitted By", value: r.submittedBy },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                  >
                    <div className="text-xs font-bold text-[var(--color-text-primary)] truncate" title={m.value}>
                      {m.value}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Justification</p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{r.justification}</p>
              </div>
              {r.notes && (
                <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.05)" }}>
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Notes</p>
                  <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap">{r.notes}</p>
                </div>
              )}
            </DashboardCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Paperclip size={14} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Supporting Documents</h3>
              </div>
              <div className="flex flex-col gap-2">
                {r.documents.map((doc) => (
                  <div
                    key={doc.name}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-cyan-400 shrink-0" />
                      <span className="text-xs font-medium text-[var(--color-text-primary)] truncate">{doc.name}</span>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)] shrink-0 ml-2">
                      {doc.type} · {doc.size}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Status Timeline</h3>
              </div>
              <div className="flex flex-col gap-0">
                {r.timeline.map((step, i) => (
                  <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full shrink-0 mt-1 ${step.done ? "bg-cyan-400" : "border-2 border-[var(--color-border)]"}`}
                      />
                      {i < r.timeline.length - 1 && (
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

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <History size={14} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Approval History</h3>
              </div>
              {r.approvalHistory.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)]">No approval decisions recorded yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {r.approvalHistory.map((h, i) => (
                    <div
                      key={`${h.time}-${i}`}
                      className="rounded-lg border px-3 py-2"
                      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-primary)]">{h.action}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">{h.time}</span>
                      </div>
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{h.actor}</p>
                      {h.amount !== undefined && (
                        <p className="text-xs text-cyan-400 mt-0.5">{formatBudgetAmount(h.amount)}</p>
                      )}
                      {h.note && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{h.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </DashboardCard>
          </motion.div>
        </div>

        <div className="flex flex-col gap-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <DashboardCard className="p-4 flex flex-col gap-2">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">Actions</h3>
              <p className="text-[10px] text-[var(--color-text-muted)] mb-2">
                Current amount: <span className="font-semibold text-cyan-400">{formatBudgetAmount(displayAmount)}</span>
              </p>
              <div className="flex flex-col gap-1.5">
                <ActionBtn icon={CheckCircle2} label="Approve Budget" color="#10b981" onClick={() => { setApproveAmount(String(r.requestedAmount)); setApproveOpen(true); }} disabled={isTerminal} />
                <ActionBtn icon={X} label="Reject Budget" color="#ef4444" onClick={() => setRejectOpen(true)} disabled={isTerminal} />
                <ActionBtn icon={MessageSquare} label="Request Clarification" color="#06b6d4" onClick={() => setClarifyOpen(true)} disabled={r.status === "Rejected"} />
                <ActionBtn icon={IndianRupee} label="Modify Approved Amount" color="#8b5cf6" onClick={() => { setModifyAmount(String(r.approvedAmount ?? r.requestedAmount)); setModifyOpen(true); }} disabled={r.status === "Rejected"} />
                <ActionBtn icon={RotateCcw} label="Send Back For Review" color="#f97316" onClick={() => setReviewOpen(true)} disabled={r.status === "Rejected"} />
                <ActionBtn icon={Search} label="Mark Under Audit" color="#a855f7" onClick={() => setAuditOpen(true)} disabled={r.status === "Under Audit"} />
              </div>
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
                placeholder="Add an internal note…"
                className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              />
              <button
                type="button"
                onClick={handleAddNote}
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
                {r.activityLog.map((a, i) => (
                  <div key={`${a.time}-${i}`} className="border-l-2 pl-2.5" style={{ borderColor: "rgba(6,182,212,0.4)" }}>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{a.time} · {a.actor}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{a.action}</p>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Audit Trail</h3>
              </div>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {r.auditTrail.map((a, i) => (
                  <div
                    key={`${a.time}-${i}`}
                    className="rounded-lg border px-2.5 py-2"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">{a.event}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">{a.time}</span>
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{a.actor}</p>
                    {a.detail && <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">{a.detail}</p>}
                  </div>
                ))}
              </div>
            </DashboardCard>
          </motion.div>
        </div>
      </div>

      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="Approve Budget">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">Approved Amount (Cr)</label>
            <input
              type="number"
              value={approveAmount}
              onChange={(e) => setApproveAmount(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">Note (optional)</label>
            <textarea
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            />
          </div>
        </div>
        <MFoot onClose={() => setApproveOpen(false)} onSubmit={handleApprove} label="Approve" color="#10b981" />
      </Modal>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Budget">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">Reason (required)</label>
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">Note (optional)</label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            />
          </div>
        </div>
        <MFoot onClose={() => setRejectOpen(false)} onSubmit={handleReject} label="Reject" color="#ef4444" disabled={!rejectReason.trim()} />
      </Modal>

      <Modal open={clarifyOpen} onClose={() => setClarifyOpen(false)} title="Request Clarification">
        <textarea
          value={clarifyMsg}
          onChange={(e) => setClarifyMsg(e.target.value)}
          rows={4}
          placeholder="What information is needed from the district?"
          className="w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        />
        <MFoot onClose={() => setClarifyOpen(false)} onSubmit={handleClarify} label="Send Request" color="#06b6d4" disabled={!clarifyMsg.trim()} />
      </Modal>

      <Modal open={modifyOpen} onClose={() => setModifyOpen(false)} title="Modify Approved Amount">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">New Amount (Cr)</label>
            <input
              type="number"
              value={modifyAmount}
              onChange={(e) => setModifyAmount(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">Reason</label>
            <textarea
              value={modifyNote}
              onChange={(e) => setModifyNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            />
          </div>
        </div>
        <MFoot onClose={() => setModifyOpen(false)} onSubmit={handleModify} label="Update Amount" color="#8b5cf6" />
      </Modal>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Send Back For Review">
        <textarea
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          rows={4}
          placeholder="What should the district revise?"
          className="w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        />
        <MFoot onClose={() => setReviewOpen(false)} onSubmit={handleSendBack} label="Send Back" color="#f97316" />
      </Modal>

      <Modal open={auditOpen} onClose={() => setAuditOpen(false)} title="Mark Under Audit">
        <textarea
          value={auditNote}
          onChange={(e) => setAuditNote(e.target.value)}
          rows={4}
          placeholder="Audit scope or reason…"
          className="w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        />
        <MFoot onClose={() => setAuditOpen(false)} onSubmit={handleAudit} label="Mark Under Audit" color="#a855f7" />
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
      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
      style={{ borderColor: `${color}40`, color, background: `${color}10` }}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

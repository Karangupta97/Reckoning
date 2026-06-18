"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, X, MessageSquare, RotateCcw, Search, Shield, Clock } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useGovernanceRequestStore } from "@/store/governanceRequestStore";

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="admin-modal-overlay fixed inset-0 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-md rounded-xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default function GovernanceRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const req = useGovernanceRequestStore((s) => s.requests.find((r) => r.id === id));
  const approve = useGovernanceRequestStore((s) => s.approveRequest);
  const reject = useGovernanceRequestStore((s) => s.rejectRequest);
  const clarify = useGovernanceRequestStore((s) => s.requestClarification);
  const sendBack = useGovernanceRequestStore((s) => s.sendBackForReview);
  const audit = useGovernanceRequestStore((s) => s.markUnderAudit);

  const [toast, setToast] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState<"approve" | "reject" | "clarify" | "review" | "audit" | null>(null);

  if (!req) {
    return (
      <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">
        Request not found. <Link href="/super-admin/governance/district-requests" className="text-cyan-400">Back</Link>
      </div>
    );
  }

  const terminal = req.status === "Approved" || req.status === "Rejected";

  return (
    <div className="flex flex-col gap-3 pb-6">
      <Link href="/super-admin/governance/district-requests" className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-cyan-400 w-fit">
        <ArrowLeft size={14} /> District Governance Requests
      </Link>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-6 right-6 z-50 rounded-xl border px-4 py-3 text-sm text-emerald-400" style={{ background: "var(--color-card)", borderColor: "rgba(16,185,129,0.3)" }}>
            <Check size={14} className="inline mr-1" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="text-base font-bold">{req.title}</h1>
      <p className="text-xs text-[var(--color-text-muted)]">{req.id} · {req.district}, {req.state} · {req.submittedBy}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 flex flex-col gap-3">
          <DashboardCard className="p-4 gap-3">
            <h3 className="text-sm font-bold">Request Summary</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">{req.justification}</p>
            {req.notes && <p className="text-xs text-[var(--color-text-muted)] whitespace-pre-wrap border-t border-[var(--color-border)] pt-2">{req.notes}</p>}
          </DashboardCard>
          <DashboardCard className="p-4 gap-2">
            <div className="flex items-center gap-2"><Clock size={14} className="text-cyan-400" /><h3 className="text-sm font-bold">Approval History</h3></div>
            {req.approvalHistory.length === 0 ? <p className="text-xs text-[var(--color-text-muted)]">No decisions yet</p> : req.approvalHistory.map((h, i) => (
              <div key={i} className="text-xs border rounded-lg px-2 py-1.5" style={{ borderColor: "var(--color-border)" }}>
                <span className="font-semibold">{h.action}</span> — {h.actor} · {h.time}
                {h.note && <p className="text-[var(--color-text-muted)] mt-0.5">{h.note}</p>}
              </div>
            ))}
          </DashboardCard>
          <DashboardCard className="p-4 gap-2">
            <h3 className="text-sm font-bold">Audit Trail</h3>
            {req.auditTrail.map((a, i) => (
              <div key={i} className="text-[10px] text-[var(--color-text-muted)]">{a.time} · {a.event} — {a.actor}</div>
            ))}
          </DashboardCard>
        </div>
        <DashboardCard className="p-4 flex flex-col gap-2">
          <h3 className="text-sm font-bold mb-1">Actions</h3>
          <p className="text-[10px] text-[var(--color-text-muted)] mb-2">Status: <span className="font-semibold text-cyan-400">{req.status}</span></p>
          {[
            { label: "Approve", action: () => setOpen("approve"), color: "#10b981", disabled: terminal },
            { label: "Reject", action: () => setOpen("reject"), color: "#ef4444", disabled: terminal },
            { label: "Request Clarification", action: () => setOpen("clarify"), color: "#06b6d4", disabled: terminal },
            { label: "Send Back For Review", action: () => setOpen("review"), color: "#f97316", disabled: terminal },
            { label: "Mark Under Audit", action: () => setOpen("audit"), color: "#a855f7", disabled: req.status === "Under Audit" },
          ].map((b) => (
            <button key={b.label} type="button" disabled={b.disabled} onClick={b.action} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40" style={{ borderColor: `${b.color}40`, color: b.color, background: `${b.color}10` }}>{b.label}</button>
          ))}
          <div className="mt-3 border-t border-[var(--color-border)] pt-3">
            <h4 className="text-xs font-bold mb-2">Activity Log</h4>
            {req.activityLog.map((a, i) => (
              <div key={i} className="text-[10px] mb-1.5 border-l-2 pl-2" style={{ borderColor: "rgba(6,182,212,0.4)" }}>
                {a.time} · {a.actor}<br />{a.action}
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <Modal open={open === "approve"} onClose={() => setOpen(null)} title="Approve Request">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded border px-2 py-1 text-xs mb-3" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
        <button type="button" onClick={() => { approve(id, note); setOpen(null); setNote(""); setToast("Approved — district notified"); }} className="rounded px-3 py-1.5 text-xs text-white" style={{ background: "#10b981" }}>Approve</button>
      </Modal>
      <Modal open={open === "reject"} onClose={() => setOpen(null)} title="Reject Request">
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="w-full rounded border px-2 py-1 text-xs mb-2" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded border px-2 py-1 text-xs mb-3" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
        <button type="button" onClick={() => { if (!reason.trim()) return; reject(id, reason, note); setOpen(null); setToast("Rejected — district notified"); }} className="rounded px-3 py-1.5 text-xs text-white" style={{ background: "#ef4444" }}>Reject</button>
      </Modal>
      <Modal open={open === "clarify"} onClose={() => setOpen(null)} title="Request Clarification">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded border px-2 py-1 text-xs mb-3" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
        <button type="button" onClick={() => { clarify(id, note); setOpen(null); setToast("Clarification sent"); }} className="rounded px-3 py-1.5 text-xs text-white" style={{ background: "#06b6d4" }}>Send</button>
      </Modal>
      <Modal open={open === "review"} onClose={() => setOpen(null)} title="Send Back For Review">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded border px-2 py-1 text-xs mb-3" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
        <button type="button" onClick={() => { sendBack(id, note); setOpen(null); setToast("Sent back for review"); }} className="rounded px-3 py-1.5 text-xs text-white" style={{ background: "#f97316" }}>Send Back</button>
      </Modal>
      <Modal open={open === "audit"} onClose={() => setOpen(null)} title="Mark Under Audit">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded border px-2 py-1 text-xs mb-3" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
        <button type="button" onClick={() => { audit(id, note); setOpen(null); setToast("Marked under audit"); }} className="rounded px-3 py-1.5 text-xs text-white" style={{ background: "#a855f7" }}>Mark Under Audit</button>
      </Modal>
    </div>
  );
}

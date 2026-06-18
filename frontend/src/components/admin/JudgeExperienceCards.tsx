"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HelpCircle, FileText, ShieldAlert, IndianRupee, CheckCircle2, AlertTriangle, Camera } from "lucide-react";
import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";

interface QA {
  question: string;
  answer: string;
  color: string;
}

/**
 * JudgeQuickAnswers — Answers common judge questions instantly from store data.
 * Place on budget detail or escalation detail pages.
 */
export function JudgeQuickAnswers({ complaintId, escalationId, budgetId }: {
  complaintId?: string;
  escalationId?: string;
  budgetId?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const complaints = useComplaintStore.getState().complaints;
  const escalations = useEscalationStore.getState().escalations;
  const evidence = useEvidenceStore.getState().records;
  const budgets = useBudgetApprovalStore.getState().requests;
  const resolutions = useComplaintWorkflowStore.getState().resolutions;

  const answers: QA[] = [];

  // Find linked entities
  const cmp = complaintId ? complaints.find((c) => c.id === complaintId) : undefined;
  const esc = escalationId
    ? escalations.find((e) => e.id === escalationId)
    : cmp ? escalations.find((e) => e.sourceComplaintId === cmp.id) : undefined;
  const bud = budgetId
    ? budgets.find((b) => b.id === budgetId)
    : esc ? budgets.find((b) => b.linkedEscalationIds?.includes(esc.id)) : undefined;
  const res = cmp ? resolutions.find((r) => r.complaintId === cmp.id) : undefined;
  const evs = evidence.filter((e) => e.relatedEntityId === (esc?.id ?? cmp?.id ?? ""));

  // Generate answers
  if (bud) {
    answers.push({ question: "Who approved funding?", answer: bud.approvedBy ?? "Pending approval", color: "#22d3ee" });
    answers.push({ question: "How much was approved?", answer: bud.approvedAmount ? `₹${bud.approvedAmount} Cr` : "Not yet approved", color: "#10b981" });
    answers.push({ question: "How much was released?", answer: bud.releasedAmount ? `₹${bud.releasedAmount} Cr (${bud.releaseStatus})` : "Not yet released", color: "#f59e0b" });
  }

  if (evs.length > 0) {
    answers.push({ question: "What evidence exists?", answer: `${evs.length} record${evs.length > 1 ? "s" : ""} — ${evs[0].status}`, color: "#a78bfa" });
  }

  if (res) {
    answers.push({ question: "Was work completed?", answer: res.status === "Approved" ? "Yes — closure approved" : `${res.status} by ${res.submittedBy}`, color: "#10b981" });
  }

  if (cmp) {
    answers.push({ question: "Case status?", answer: cmp.status, color: cmp.status === "Resolved" ? "#10b981" : "#f59e0b" });
  }

  if (answers.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 mb-1">
        <HelpCircle size={11} className="text-cyan-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Quick Answers</span>
      </div>
      {answers.map((qa, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
          className="flex items-center justify-between rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
          <span className="text-[10px] text-[var(--color-text-muted)]">{qa.question}</span>
          <span className="text-[10px] font-bold shrink-0 ml-2" style={{ color: qa.color }}>{qa.answer}</span>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * WhyBudgetExists — Shows the chain that caused a budget to be created.
 */
export function WhyBudgetExists({ budgetId }: { budgetId: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const budgets = useBudgetApprovalStore.getState().requests;
  const escalations = useEscalationStore.getState().escalations;
  const complaints = useComplaintStore.getState().complaints;

  const budget = budgets.find((b) => b.id === budgetId);
  if (!budget) return null;

  const linkedEsc = budget.linkedEscalationIds?.[0]
    ? escalations.find((e) => e.id === budget.linkedEscalationIds![0])
    : undefined;
  const linkedCmp = linkedEsc?.sourceComplaintId
    ? complaints.find((c) => c.id === linkedEsc.sourceComplaintId)
    : undefined;

  const chain = [
    linkedCmp ? { icon: FileText, label: linkedCmp.id, detail: linkedCmp.title, color: "#f59e0b" } : null,
    linkedEsc ? { icon: ShieldAlert, label: linkedEsc.id, detail: linkedEsc.fundingRequired ? `Funding: ₹${linkedEsc.estimatedCost ?? "TBD"} Lakhs` : linkedEsc.title, color: "#f97316" } : null,
    { icon: IndianRupee, label: budget.id, detail: `₹${budget.requestedAmount} Cr — ${budget.status}`, color: "#22d3ee" },
  ].filter(Boolean) as { icon: typeof FileText; label: string; detail: string; color: string }[];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 mb-1">
        <AlertTriangle size={11} className="text-amber-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Why This Budget Exists</span>
      </div>
      {chain.map((node, i) => {
        const Icon = node.icon;
        return (
          <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2.5 rounded-lg border px-3 py-2"
            style={{ borderColor: `${node.color}25`, background: `${node.color}05` }}>
            <Icon size={12} style={{ color: node.color }} className="shrink-0" />
            <span className="text-[10px] font-mono font-bold" style={{ color: node.color }}>{node.label}</span>
            <span className="text-[10px] text-[var(--color-text-secondary)] truncate">{node.detail}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

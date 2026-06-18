"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FileText, ShieldAlert, Camera, IndianRupee, CheckCircle2, ArrowDown, HelpCircle } from "lucide-react";
import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";

interface TraceNode {
  type: "complaint" | "escalation" | "evidence" | "budget" | "resolution";
  id: string;
  label: string;
  status: string;
  detail?: string;
  href?: string;
}

const NODE_COLORS: Record<string, { color: string; icon: typeof FileText }> = {
  complaint: { color: "#f59e0b", icon: FileText },
  escalation: { color: "#f97316", icon: ShieldAlert },
  evidence: { color: "#a78bfa", icon: Camera },
  budget: { color: "#22d3ee", icon: IndianRupee },
  resolution: { color: "#10b981", icon: CheckCircle2 },
};

/**
 * CaseTraceabilityCard — Shows complete accountability chain for any complaint.
 * Designed for hackathon judges to instantly understand the governance flow.
 */
export function CaseTraceabilityCard({ complaintId, portal = "district" }: { complaintId: string; portal?: "district" | "super" | "sub-district" }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const complaint = useComplaintStore.getState().getById(complaintId);
  const escalations = useEscalationStore.getState().escalations;
  const evidence = useEvidenceStore.getState().records;
  const budgets = useBudgetApprovalStore.getState().requests;
  const resolutions = useComplaintWorkflowStore.getState().resolutions;

  const nodes: TraceNode[] = [];

  // CMP
  nodes.push({ type: "complaint", id: complaint.id, label: complaint.title, status: complaint.status, detail: complaint.category });

  // ESC
  const esc = escalations.find((e) => e.sourceComplaintId === complaintId || e.id === complaint.escalationId);
  if (esc) {
    nodes.push({
      type: "escalation", id: esc.id, label: esc.title, status: esc.status,
      detail: esc.fundingRequired ? `Funding: ₹${esc.estimatedCost ?? "TBD"} Lakhs` : esc.priority,
    });

    // EV
    const evs = evidence.filter((e) => e.relatedEntityId === esc.id || e.relatedEntityId === complaintId);
    if (evs.length > 0) {
      nodes.push({ type: "evidence", id: evs[0].id, label: `${evs.length} evidence record${evs.length > 1 ? "s" : ""}`, status: evs[0].status, detail: evs[0].uploadedBy });
    }

    // BUD
    const buds = budgets.filter((b) => b.linkedEscalationIds?.includes(esc.id));
    if (buds.length > 0) {
      const b = buds[0];
      nodes.push({
        type: "budget", id: b.id, label: b.project, status: b.status,
        detail: `Req: ₹${b.requestedAmount} Cr${b.approvedAmount ? ` → Approved: ₹${b.approvedAmount} Cr` : ""}${b.releasedAmount ? ` → Released: ₹${b.releasedAmount} Cr` : ""}`,
      });
    }
  }

  // RES
  const res = resolutions.find((r) => r.complaintId === complaintId);
  if (res) {
    nodes.push({
      type: "resolution", id: res.id, label: `Resolution — ${res.status}`, status: res.status,
      detail: res.submittedBy,
    });
  }

  if (nodes.length <= 1) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 mb-1">
        <HelpCircle size={11} className="text-cyan-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Case Traceability</span>
      </div>
      {nodes.map((node, i) => {
        const cfg = NODE_COLORS[node.type];
        const Icon = cfg.icon;
        return (
          <div key={node.id}>
            <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2.5 rounded-lg border px-3 py-2"
              style={{ borderColor: `${cfg.color}25`, background: `${cfg.color}05` }}>
              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${cfg.color}15`, color: cfg.color }}>
                <Icon size={12} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold" style={{ color: cfg.color }}>{node.id}</span>
                  <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${cfg.color}12`, color: cfg.color }}>
                    {node.status}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--color-text-primary)] font-medium mt-0.5 line-clamp-1">{node.label}</p>
                {node.detail && <p className="text-[9px] text-[var(--color-text-muted)]">{node.detail}</p>}
              </div>
            </motion.div>
            {i < nodes.length - 1 && (
              <div className="flex justify-center py-0.5">
                <ArrowDown size={10} className="text-[var(--color-text-muted)] opacity-40" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

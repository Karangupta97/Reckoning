"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldAlert, IndianRupee, Camera, Shield } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import { useEscalationStore, pendingSuperEscalations } from "@/store/escalationStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useGovernanceRequestStore } from "@/store/governanceRequestStore";
import { filterEvidenceByTab } from "@/components/super-admin-dashboard/evidence-ui";

export default function IncomingWorkflowsPanel() {
  const escalations = useEscalationStore((s) => s.escalations);
  const budgetRequests = useBudgetApprovalStore((s) => s.requests);
  const evidence = useEvidenceStore((s) => s.records);
  const governance = useGovernanceRequestStore((s) => s.requests);

  const pendingEsc = pendingSuperEscalations(escalations);
  const pendingBudget = budgetRequests.filter((r) =>
    ["Pending Approval", "Clarification Requested", "Sent Back For Review", "Under Audit"].includes(r.status)
  );
  const pendingEvidence = filterEvidenceByTab("pending", evidence);
  const pendingGov = governance.filter((g) => g.status === "Pending Review" || g.status === "Clarification Requested");
  const highPriority: { id: string; title: string }[] = [
    ...pendingEsc.filter((e) => e.priority === "Critical").map((e) => ({ id: e.id, title: e.title })),
    ...pendingBudget.filter((b) => b.priority === "Critical" || b.requestType === "Emergency").map((b) => ({ id: b.id, title: b.project })),
  ].slice(0, 5);

  const sections = [
    {
      label: "Incoming Escalations",
      count: pendingEsc.length,
      href: "/super-admin/complaints/escalated-cases",
      icon: ShieldAlert,
      color: "text-orange-400",
      items: pendingEsc.slice(0, 3).map((e) => ({ id: e.id, title: e.title, meta: e.district ?? e.subDistrict })),
    },
    {
      label: "Pending Budget Requests",
      count: pendingBudget.length,
      href: "/super-admin/governance/approvals",
      icon: IndianRupee,
      color: "text-cyan-400",
      items: pendingBudget.slice(0, 3).map((b) => ({ id: b.id, title: b.project, meta: b.district })),
    },
    {
      label: "Pending Evidence Reviews",
      count: pendingEvidence.length,
      href: "/super-admin/evidence",
      icon: Camera,
      color: "text-purple-400",
      items: pendingEvidence.slice(0, 3).map((e) => ({ id: e.id, title: e.title, meta: e.district })),
    },
    {
      label: "Governance Reviews",
      count: pendingGov.length,
      href: "/super-admin/governance/district-requests",
      icon: Shield,
      color: "text-amber-400",
      items: pendingGov.slice(0, 3).map((g) => ({ id: g.id, title: g.title, meta: g.district })),
    },
  ];

  return (
    <DashboardCard className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Incoming Workflows</h3>
        <span className="text-[10px] text-[var(--color-text-muted)]">Live from shared state</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {sections.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-lg border p-3 hover:bg-[var(--color-surface)] transition-colors"
            style={{ borderColor: "var(--color-border)" }}
          >
            <s.icon size={14} className={`mb-1 ${s.color}`} />
            <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">{s.label}</p>
          </Link>
        ))}
      </div>

      {highPriority.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-red-400 mb-2 uppercase tracking-wide">High Priority</p>
          <div className="flex flex-col gap-1.5">
            {highPriority.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs"
                style={{ borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.05)" }}
              >
                <span className="font-mono text-red-400 shrink-0">{item.id}</span>
                <span className="text-[var(--color-text-secondary)] truncate mx-2 flex-1">{item.title}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sections.map((s) => (
          <div key={`list-${s.label}`}>
            <Link href={s.href} className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:underline mb-1.5">
              {s.label} <ArrowRight size={10} />
            </Link>
            {s.items.length === 0 ? (
              <p className="text-[10px] text-[var(--color-text-muted)]">None pending</p>
            ) : (
              s.items.map((item) => (
                <div key={item.id} className="text-[10px] py-1 border-b border-[var(--color-border)] last:border-0">
                  <span className="font-mono text-cyan-400">{item.id}</span>
                  <span className="text-[var(--color-text-muted)]"> · {item.meta}</span>
                  <p className="text-[var(--color-text-secondary)] truncate">{item.title}</p>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

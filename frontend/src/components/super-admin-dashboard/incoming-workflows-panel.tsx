"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldAlert, IndianRupee, Camera, Shield, AlertTriangle, ExternalLink } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import { useEscalationStore, pendingSuperEscalations } from "@/store/escalationStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useGovernanceRequestStore } from "@/store/governanceRequestStore";
import { filterEvidenceByTab } from "@/components/super-admin-dashboard/evidence-ui";

/* ─── Helpers ──────────────────────────────────────────────────── */

function resolveHref(id: string, fallback: string): string {
  if (id.startsWith("BUD-")) return `/super-admin/governance/approvals/${id}`;
  if (id.startsWith("ESC-") || id.startsWith("CMP-")) return `/super-admin/complaints/escalated-cases/${id}`;
  if (id.startsWith("EV-")) return `/super-admin/evidence/${id}`;
  if (id.startsWith("GOV-")) return `/super-admin/governance/district-requests/${id}`;
  return fallback;
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s.includes("pending") || s.includes("approval")) return { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Pending" };
  if (s.includes("clarification")) return { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", label: "Clarification" };
  if (s.includes("audit")) return { bg: "rgba(239,68,68,0.12)", color: "#ef4444", label: "Under Audit" };
  if (s.includes("investigat")) return { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", label: "Investigation" };
  if (s.includes("review") || s.includes("sent back")) return { bg: "rgba(34,211,238,0.12)", color: "#22d3ee", label: "Review" };
  return { bg: "rgba(100,116,139,0.12)", color: "#64748b", label: status.split(" ")[0] };
}

/* ─── Component ────────────────────────────────────────────────── */

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

  const criticalEsc = pendingEsc.filter(e => e.priority === "Critical");
  const criticalBudget = pendingBudget.filter(b => b.priority === "Critical" || b.requestType === "Emergency");

  const highPriority = [
    ...criticalEsc.map((e) => ({ id: e.id, title: e.title, district: e.district ?? e.subDistrict, priority: e.priority })),
    ...criticalBudget.map((b) => ({ id: b.id, title: b.project, district: b.district, priority: b.priority })),
  ].slice(0, 4);

  const queues = [
    {
      label: "Escalations",
      count: pendingEsc.length,
      critical: criticalEsc.length,
      href: "/super-admin/complaints/escalated-cases",
      icon: ShieldAlert,
      color: "#f97316",
      items: pendingEsc.slice(0, 5).map((e) => ({ id: e.id, title: e.title, meta: e.district ?? e.subDistrict, status: e.status })),
    },
    {
      label: "Budget Requests",
      count: pendingBudget.length,
      critical: criticalBudget.length,
      href: "/super-admin/governance/approvals",
      icon: IndianRupee,
      color: "#22d3ee",
      items: pendingBudget.slice(0, 5).map((b) => ({ id: b.id, title: b.project, meta: `${b.district} · ${b.state}`, status: b.status })),
    },
    {
      label: "Evidence Reviews",
      count: pendingEvidence.length,
      critical: 0,
      href: "/super-admin/evidence",
      icon: Camera,
      color: "#a78bfa",
      items: pendingEvidence.slice(0, 5).map((e) => ({ id: e.id, title: e.title, meta: `${e.district} · ${e.state}`, status: e.status })),
    },
    {
      label: "Governance",
      count: pendingGov.length,
      critical: 0,
      href: "/super-admin/governance/district-requests",
      icon: Shield,
      color: "#f59e0b",
      items: pendingGov.slice(0, 5).map((g) => ({ id: g.id, title: g.title, meta: `${g.district} · ${g.state}`, status: g.status })),
    },
  ];

  return (
    <DashboardCard className="p-3 flex flex-col gap-2">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Incoming Workflows</h3>
        <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Live</span>
      </div>

      {/* ── High Priority Banner ───────────────────────────── */}
      {highPriority.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
            <AlertTriangle size={11} className="text-red-400" />
            <span className="text-[10px] font-bold text-red-400">CRITICAL QUEUE</span>
            <span className="ml-auto text-[9px] text-red-400/70">{highPriority.length} items</span>
          </div>
          <div className="flex flex-col">
            {highPriority.map((item, i) => (
              <motion.div key={item.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-red-500/[0.03] transition-colors"
                style={{ borderBottom: i < highPriority.length - 1 ? "1px solid rgba(239,68,68,0.08)" : "none" }}>
                <Link href={resolveHref(item.id, "#")}
                  className="font-mono text-[11px] font-bold text-red-400 hover:underline shrink-0 min-w-[76px]">
                  {item.id}
                </Link>
                <span className="text-[10px] text-[var(--color-text-secondary)] truncate flex-1">{item.title}</span>
                <span className="text-[9px] text-[var(--color-text-muted)] shrink-0">{item.district}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2×2 Queue Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        {queues.map((q) => (
          <div key={q.label} className="rounded-lg overflow-hidden flex flex-col"
            style={{ border: "1px solid var(--color-border)", height: "200px" }}>

            {/* Card header */}
            <div className="flex items-center justify-between px-2.5 py-2 shrink-0"
              style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
              <div className="flex items-center gap-1.5">
                <q.icon size={12} style={{ color: q.color }} />
                <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">{q.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Count badge */}
                <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md"
                  style={{ background: `${q.color}14`, color: q.color }}>
                  {q.count}
                </span>
                {/* Critical count */}
                {q.critical > 0 && (
                  <span className="text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                    {q.critical} ⚠
                  </span>
                )}
                {/* View All */}
                <Link href={q.href}
                  className="text-[9px] font-semibold flex items-center gap-0.5 hover:underline transition-colors"
                  style={{ color: q.color }}>
                  All <ArrowRight size={8} />
                </Link>
              </div>
            </div>

            {/* Items — fixed height, internal scroll */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {q.items.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-[10px] text-[var(--color-text-muted)]">None pending</span>
                </div>
              ) : (
                q.items.map((item, i) => {
                  const badge = statusBadge(item.status);
                  return (
                    <div key={item.id}
                      className="flex items-start gap-2 px-2.5 py-2 hover:bg-[var(--color-surface)] transition-colors"
                      style={{ borderBottom: i < q.items.length - 1 ? "1px solid color-mix(in srgb, var(--color-border) 50%, transparent)" : "none" }}>
                      {/* ID — prominent */}
                      <Link href={resolveHref(item.id, q.href)}
                        className="font-mono text-[10px] font-bold shrink-0 hover:underline transition-colors min-w-[72px]"
                        style={{ color: q.color }}>
                        {item.id}
                      </Link>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-[var(--color-text-primary)] truncate leading-tight font-medium">{item.title}</p>
                        <p className="text-[9px] text-[var(--color-text-muted)] leading-tight mt-0.5">{item.meta}</p>
                      </div>
                      {/* Status badge */}
                      <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap mt-0.5"
                        style={{ background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

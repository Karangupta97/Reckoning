"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldAlert,
  IndianRupee,
  Camera,
  Shield,
  AlertTriangle,
  Check,
} from "lucide-react";
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

function districtLabel(meta: string): string {
  return meta.split("·")[0]?.trim() ?? meta;
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s.includes("pending") || s.includes("approval"))
    return { bg: "#FEF3C7", color: "#92400E", label: "Pending" };
  if (s.includes("clarification"))
    return { bg: "#EDE9FE", color: "#5B21B6", label: "Clarification" };
  if (s.includes("audit"))
    return { bg: "#FEE2E2", color: "#991B1B", label: "Under Audit" };
  if (s.includes("additional"))
    return { bg: "#E0F2FE", color: "#075985", label: "Additional" };
  if (s.includes("investigat"))
    return { bg: "#DBEAFE", color: "#1E40AF", label: "Investigation" };
  if (s.includes("assigned"))
    return { bg: "#DBEAFE", color: "#1E40AF", label: "Assigned" };
  if (s.includes("approved"))
    return { bg: "#D1FAE5", color: "#065F46", label: "Approved" };
  if (s.includes("reject"))
    return { bg: "#FEE2E2", color: "#991B1B", label: "Rejected" };
  if (s.includes("review") || s.includes("sent back"))
    return { bg: "#CFFAFE", color: "#0E7490", label: "Review" };
  const label = status.split(" ")[0];
  return { bg: "#F1F5F9", color: "#334155", label };
}

function EmptyQueueState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 px-3 py-4 text-center">
      <Check size={14} className="text-[#475569]" strokeWidth={2.5} />
      <p className="text-[12px] font-semibold leading-snug text-[#0F172A]">{title}</p>
      <p className="text-[11px] font-medium leading-snug text-[#64748B]">{description}</p>
    </div>
  );
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
  const pendingGov = governance.filter(
    (g) => g.status === "Pending Review" || g.status === "Clarification Requested"
  );

  const criticalEsc = pendingEsc.filter((e) => e.priority === "Critical");
  const criticalBudget = pendingBudget.filter(
    (b) => b.priority === "Critical" || b.requestType === "Emergency"
  );

  const highPriority = [
    ...criticalEsc.map((e) => ({
      id: e.id,
      title: e.title,
      district: e.district ?? e.subDistrict,
      priority: e.priority,
    })),
    ...criticalBudget.map((b) => ({
      id: b.id,
      title: b.project,
      district: b.district,
      priority: b.priority,
    })),
  ].slice(0, 4);

  const queues = [
    {
      label: "Escalations",
      count: pendingEsc.length,
      critical: criticalEsc.length,
      href: "/super-admin/complaints/escalated-cases",
      icon: ShieldAlert,
      color: "#EA580C",
      hoverColor: "#C2410C",
      emptyTitle: "No escalations pending",
      emptyDescription: "All escalation reviews are up to date.",
      items: pendingEsc.slice(0, 5).map((e) => ({
        id: e.id,
        title: e.title,
        meta: e.district ?? e.subDistrict ?? "—",
        status: e.status,
      })),
    },
    {
      label: "Budget Requests",
      count: pendingBudget.length,
      critical: criticalBudget.length,
      href: "/super-admin/governance/approvals",
      icon: IndianRupee,
      color: "#0891B2",
      hoverColor: "#0E7490",
      emptyTitle: "No budget requests pending",
      emptyDescription: "All budget reviews are up to date.",
      items: pendingBudget.slice(0, 5).map((b) => ({
        id: b.id,
        title: b.project,
        meta: `${b.district} · ${b.state}`,
        status: b.status,
      })),
    },
    {
      label: "Evidence Reviews",
      count: pendingEvidence.length,
      critical: 0,
      href: "/super-admin/evidence",
      icon: Camera,
      color: "#7C3AED",
      hoverColor: "#6D28D9",
      emptyTitle: "No evidence awaiting review",
      emptyDescription: "All evidence submissions are processed.",
      items: pendingEvidence.slice(0, 5).map((e) => ({
        id: e.id,
        title: e.title,
        meta: `${e.district} · ${e.state}`,
        status: e.status,
      })),
    },
    {
      label: "Governance",
      count: pendingGov.length,
      critical: 0,
      href: "/super-admin/governance/district-requests",
      icon: Shield,
      color: "#D97706",
      hoverColor: "#B45309",
      emptyTitle: "No governance reviews pending",
      emptyDescription: "All governance reviews are up to date.",
      items: pendingGov.slice(0, 5).map((g) => ({
        id: g.id,
        title: g.title,
        meta: `${g.district} · ${g.state}`,
        status: g.status,
      })),
    },
  ];

  return (
    <DashboardCard className="p-3 flex flex-col gap-2">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-[#0F172A]">Incoming Workflows</h3>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-[#64748B]">
          Live
        </span>
      </div>

      {/* ── High Priority Banner ───────────────────────────── */}
      {highPriority.length > 0 && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
        >
          <div
            className="flex items-center gap-1.5 px-3 py-1.5"
            style={{ borderBottom: "1px solid #FECACA", background: "#F1F5F9" }}
          >
            <AlertTriangle size={11} className="text-[#DC2626]" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#991B1B]">
              Critical Queue
            </span>
            <span className="ml-auto text-[10px] font-semibold tabular-nums text-[#B91C1C]">
              {highPriority.length} items
            </span>
          </div>
          <div className="flex flex-col">
            {highPriority.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-2.5 px-3 py-2 hover:bg-red-50 transition-colors"
                style={{
                  borderBottom: i < highPriority.length - 1 ? "1px solid #FEE2E2" : "none",
                }}
              >
                <Link
                  href={resolveHref(item.id, "#")}
                  className="font-mono text-[14px] font-bold text-[#B91C1C] hover:text-[#991B1B] hover:underline shrink-0 min-w-[76px] cursor-pointer transition-colors"
                >
                  {item.id}
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold leading-tight text-[#0F172A] truncate">
                    {item.title}
                  </p>
                  {item.district && (
                    <p className="text-[13px] font-medium leading-tight text-[#64748B] truncate mt-0.5">
                      {item.district}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2×2 Queue Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        {queues.map((q) => (
          <div
            key={q.label}
            className="rounded-lg overflow-hidden flex flex-col"
            style={{
              border: "1px solid var(--color-border)",
              height: "200px",
              ["--wf-accent" as string]: q.color,
              ["--wf-accent-hover" as string]: q.hoverColor,
            }}
          >
            {/* Card header */}
            <div
              className="flex items-center justify-between px-2.5 py-2 shrink-0"
              style={{ borderBottom: "1px solid var(--color-border)", background: "#F1F5F9" }}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <q.icon size={12} style={{ color: q.color }} className="shrink-0" />
                <span className="text-[11px] font-semibold text-[#0F172A] truncate">
                  {q.label}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md"
                  style={{ background: `${q.color}1A`, color: q.color }}
                >
                  {q.count}
                </span>
                {q.critical > 0 && (
                  <span
                    className="text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-md"
                    style={{ background: "#FEE2E2", color: "#991B1B" }}
                  >
                    {q.critical} ⚠
                  </span>
                )}
                <Link
                  href={q.href}
                  className="text-[9px] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer transition-colors"
                  style={{ color: q.color }}
                >
                  All <ArrowRight size={8} />
                </Link>
              </div>
            </div>

            {/* Items — fixed height, internal scroll */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {q.items.length === 0 ? (
                <EmptyQueueState title={q.emptyTitle} description={q.emptyDescription} />
              ) : (
                q.items.map((item, i) => {
                  const badge = statusBadge(item.status);
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 px-2.5 py-2 hover:bg-[var(--color-surface)] transition-colors"
                      style={{
                        borderBottom:
                          i < q.items.length - 1
                            ? "1px solid color-mix(in srgb, var(--color-border) 50%, transparent)"
                            : "none",
                      }}
                    >
                      <Link
                        href={resolveHref(item.id, q.href)}
                        className="font-mono text-[14px] font-bold shrink-0 cursor-pointer hover:underline transition-colors min-w-[72px] leading-tight text-[color:var(--wf-accent)] hover:text-[color:var(--wf-accent-hover)]"
                      >
                        {item.id}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold leading-tight text-[#0F172A] truncate">
                          {item.title}
                        </p>
                        <p className="text-[13px] font-medium leading-tight text-[#64748B] truncate mt-0.5">
                          {districtLabel(item.meta)}
                        </p>
                      </div>
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap mt-0.5 border"
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          borderColor: `${badge.color}33`,
                        }}
                      >
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

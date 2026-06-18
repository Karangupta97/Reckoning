"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MessageSquare, ExternalLink, CheckCircle2 } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useEscalationStore } from "@/store/escalationStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";

interface ClarEntry {
  id: string;
  caseId: string;
  caseType: "escalation" | "budget";
  title: string;
  waitingOn: string;
  lastActivity: string;
  status: "Open" | "Responded";
  href: string;
}

export default function SuperAdminClarificationCenter() {
  const escalations = useEscalationStore((s) => s.escalations);
  const budgets = useBudgetApprovalStore((s) => s.requests);

  const entries = useMemo((): ClarEntry[] => {
    const result: ClarEntry[] = [];
    const seen = new Set<string>();

    for (const esc of escalations) {
      if (esc.tier !== "super" || !esc.activityLog) continue;
      const hasClar = esc.activityLog.some((a) => a.action.includes("larification"));
      if (!hasClar) continue;
      if (seen.has(esc.id)) continue;
      seen.add(esc.id);
      const lastClar = esc.activityLog.find((a) => a.action.includes("larification"));
      const hasResponse = esc.activityLog.some((a) => a.action.includes("larification") && a.actor.includes("Super"));
      result.push({
        id: esc.id, caseId: esc.id, caseType: "escalation", title: esc.title,
        waitingOn: hasResponse ? "District" : "Super Admin",
        lastActivity: lastClar?.time ?? "", status: hasResponse ? "Responded" : "Open",
        href: `/super-admin/complaints/escalated-cases/${esc.id}`,
      });
    }

    for (const bud of budgets) {
      if (bud.status === "Clarification Requested") {
        if (seen.has(bud.id)) continue;
        seen.add(bud.id);
        result.push({
          id: bud.id, caseId: bud.id, caseType: "budget", title: bud.project,
          waitingOn: "District", lastActivity: bud.activityLog[0]?.time ?? "",
          status: "Open", href: `/super-admin/governance/approvals/${bud.id}`,
        });
      }
      if (bud.notes?.includes("District response:")) {
        const key = `${bud.id}-resp`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({
          id: key, caseId: bud.id, caseType: "budget", title: bud.project,
          waitingOn: "Super Admin", lastActivity: bud.activityLog[0]?.time ?? "",
          status: "Responded", href: `/super-admin/governance/approvals/${bud.id}`,
        });
      }
    }
    return result;
  }, [escalations, budgets]);

  const openCount = entries.filter((e) => e.status === "Open").length;

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <MessageSquare size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Clarification Center</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">All governance conversations requiring attention</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3">
        <DashboardCard className="flex flex-col items-center justify-center py-4 text-center">
          <span className="text-xl font-bold tabular-nums text-purple-400">{entries.length}</span>
          <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">Total</span>
        </DashboardCard>
        <DashboardCard className="flex flex-col items-center justify-center py-4 text-center">
          <span className="text-xl font-bold tabular-nums text-amber-400">{openCount}</span>
          <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">Open</span>
        </DashboardCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="flex flex-col overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">All Clarifications</h3>
          </div>
          {entries.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <CheckCircle2 size={24} className="text-green-400 opacity-40 mb-2" />
              <p className="text-sm text-[var(--color-text-muted)]">No active clarifications</p>
            </div>
          ) : (
            <div className="dashboard-table-scroll">
              <table className="dashboard-table">
                <thead><tr>{["Case", "Type", "Subject", "Waiting On", "Status", ""].map((h) => (
                  <th key={h} className="dashboard-table-th">{h}</th>
                ))}</tr></thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="dashboard-table-row">
                      <td className="dashboard-table-td font-mono text-xs font-bold text-purple-400">{e.caseId}</td>
                      <td className="dashboard-table-td text-[10px] capitalize text-[var(--color-text-muted)]">{e.caseType}</td>
                      <td className="dashboard-table-td text-xs text-[var(--color-text-secondary)] max-w-[180px] truncate">{e.title}</td>
                      <td className="dashboard-table-td text-[10px] font-semibold" style={{ color: e.waitingOn === "Super Admin" ? "#f59e0b" : "#8b5cf6" }}>{e.waitingOn}</td>
                      <td className="dashboard-table-td">
                        <span className={`dashboard-table-badge ${e.status === "Open" ? "dashboard-table-badge-status-open" : "dashboard-table-badge-status-resolved"}`}>{e.status}</span>
                      </td>
                      <td className="dashboard-table-td">
                        <Link href={e.href}>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1 h-7 px-2.5 rounded-md border text-[10px] font-medium"
                            style={{ borderColor: "rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.08)", color: "#8b5cf6" }}>
                            <ExternalLink size={10} /> Open
                          </motion.button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>
      </motion.div>
    </div>
  );
}

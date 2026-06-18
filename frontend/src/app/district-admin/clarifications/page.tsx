"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  MessageSquare, Clock, ExternalLink, Shield, User, ShieldAlert, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useEscalationStore } from "@/store/escalationStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useComplaintStore } from "@/store/complaintStore";

interface ClarEntry {
  id: string;
  caseId: string;
  caseType: "escalation" | "budget" | "resolution";
  title: string;
  owner: string;
  waitingOn: string;
  lastActivity: string;
  message: string;
  status: "Open" | "Responded" | "Resolved";
  href: string;
}

export default function DistrictClarificationCenter() {
  const escalations = useEscalationStore((s) => s.escalations);
  const complaints = useComplaintStore((s) => s.complaints);
  const resolutions = useComplaintWorkflowStore((s) => s.resolutions);
  const budgets = useBudgetApprovalStore((s) => s.requests);

  const entries = useMemo((): ClarEntry[] => {
    const result: ClarEntry[] = [];
    const seen = new Set<string>();

    // Escalation clarifications (from sub-district or to super)
    for (const esc of escalations) {
      if (!esc.activityLog) continue;
      const hasClar = esc.activityLog.some((a) => a.action.includes("larification"));
      if (!hasClar) continue;
      const key = esc.id;
      if (seen.has(key)) continue;
      seen.add(key);
      const lastClar = esc.activityLog.find((a) => a.action.includes("larification"));
      const hasResponse = esc.activityLog.some((a) => a.action.includes("larification") && a.actor.includes("District"));
      result.push({
        id: key,
        caseId: esc.id,
        caseType: "escalation",
        title: esc.title,
        owner: "District Admin",
        waitingOn: hasResponse ? (esc.tier === "super" ? "Super Admin" : "Sub-District") : "District Admin",
        lastActivity: lastClar?.time ?? esc.escalatedOn,
        message: lastClar ? lastClar.action.replace(/^Clarification (requested|reply)[:\s—]*/i, "").substring(0, 100) : "",
        status: hasResponse ? "Responded" : "Open",
        href: `/district-admin/dashboard/escalation/${esc.id}`,
      });
    }

    // Budget clarifications from super admin
    for (const bud of budgets) {
      if (bud.status !== "Clarification Requested") continue;
      const key = bud.id;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        id: key,
        caseId: bud.id,
        caseType: "budget",
        title: bud.project,
        owner: "District Admin",
        waitingOn: "District Admin",
        lastActivity: bud.activityLog[0]?.time ?? bud.submittedOn,
        message: bud.activityLog.find((a) => a.action.includes("larification"))?.action.replace(/^Clarification requested:\s*/i, "").substring(0, 100) ?? "",
        status: "Open",
        href: `/district-admin/budget`,
      });
    }

    // Resolution clarifications
    for (const res of resolutions) {
      if (res.status !== "Clarification Requested") continue;
      const key = `res-${res.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const cmp = complaints.find((c) => c.id === res.complaintId);
      result.push({
        id: key,
        caseId: res.complaintId,
        caseType: "resolution",
        title: cmp?.title ?? res.complaintId,
        owner: "District Admin",
        waitingOn: "Sub-District",
        lastActivity: res.submittedAt,
        message: res.clarificationMessage?.substring(0, 100) ?? "",
        status: "Open",
        href: `/district-admin/dashboard/escalation/${res.escalationId ?? res.complaintId}`,
      });
    }

    return result.sort((a, b) => (a.status === "Open" ? -1 : 1) - (b.status === "Open" ? -1 : 1));
  }, [escalations, budgets, resolutions, complaints]);

  const openCount = entries.filter((e) => e.status === "Open").length;
  const respondedCount = entries.filter((e) => e.status === "Responded").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <MessageSquare size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Clarification Center</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">All governance conversations requiring action</p>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: String(entries.length), color: "#8b5cf6" },
          { label: "Open", value: String(openCount), color: "#f59e0b" },
          { label: "Responded", value: String(respondedCount), color: "#14b8a6" },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className="text-xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="flex flex-col overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">All Clarifications</h3>
          </div>
          {entries.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 size={24} className="text-green-400 opacity-40 mb-2" />
              <p className="text-sm text-[var(--color-text-muted)]">No active clarifications</p>
            </div>
          ) : (
            <div className="dashboard-table-scroll">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    {["Case", "Type", "Subject", "Waiting On", "Last Activity", "Status", ""].map((h) => (
                      <th key={h} className="dashboard-table-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={e.id} className="dashboard-table-row">
                      <td className="dashboard-table-td font-mono text-xs font-bold text-purple-400">{e.caseId}</td>
                      <td className="dashboard-table-td">
                        <span className="text-[10px] font-medium capitalize px-1.5 py-0.5 rounded border"
                          style={{
                            color: e.caseType === "escalation" ? "#f97316" : e.caseType === "budget" ? "#14b8a6" : "#3b82f6",
                            borderColor: e.caseType === "escalation" ? "rgba(249,115,22,0.2)" : e.caseType === "budget" ? "rgba(20,184,166,0.2)" : "rgba(59,130,246,0.2)",
                            background: e.caseType === "escalation" ? "rgba(249,115,22,0.06)" : e.caseType === "budget" ? "rgba(20,184,166,0.06)" : "rgba(59,130,246,0.06)",
                          }}>
                          {e.caseType}
                        </span>
                      </td>
                      <td className="dashboard-table-td text-xs text-[var(--color-text-secondary)] max-w-[200px] truncate">{e.title}</td>
                      <td className="dashboard-table-td">
                        <span className="text-[10px] font-semibold" style={{ color: e.waitingOn === "District Admin" ? "#f59e0b" : "#8b5cf6" }}>
                          {e.waitingOn}
                        </span>
                      </td>
                      <td className="dashboard-table-td text-[10px] text-[var(--color-text-muted)]">{e.lastActivity}</td>
                      <td className="dashboard-table-td">
                        <span className={`dashboard-table-badge ${e.status === "Open" ? "dashboard-table-badge-status-open" : "dashboard-table-badge-status-resolved"}`}>
                          {e.status}
                        </span>
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

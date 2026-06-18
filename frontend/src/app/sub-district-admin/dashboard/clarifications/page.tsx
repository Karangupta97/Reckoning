"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MessageSquare, AlertTriangle, ExternalLink, Clock, Shield } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";

interface ClarificationItem {
  complaintId: string;
  escalationId?: string;
  title: string;
  message: string;
  requestedBy: string;
  time: string;
  type: "escalation" | "resolution";
}

export default function SubDistrictClarificationsPage() {
  const complaints = useComplaintStore((s) => s.complaints);
  const escalations = useEscalationStore((s) => s.escalations);
  const resolutions = useComplaintWorkflowStore((s) => s.resolutions);

  const items = useMemo((): ClarificationItem[] => {
    const result: ClarificationItem[] = [];
    const seen = new Set<string>();

    // Find escalations with clarification in notes/activity
    for (const esc of escalations) {
      if (!esc.sourceComplaintId) continue;
      const cmp = complaints.find((c) => c.id === esc.sourceComplaintId);
      if (!cmp) continue;

      // Check activity log for clarification requests
      if (esc.activityLog) {
        for (const entry of esc.activityLog) {
          if (entry.action.toLowerCase().includes("clarification requested") || entry.action.toLowerCase().includes("clarification")) {
            const msg = entry.action.replace(/^Clarification requested[:\s—]*/i, "").trim();
            const key = `${cmp.id}-${msg}`;
            if (seen.has(key)) continue;
            seen.add(key);
            result.push({
              complaintId: cmp.id,
              escalationId: esc.id,
              title: cmp.title,
              message: msg.substring(0, 150) || "Clarification needed",
              requestedBy: entry.actor,
              time: entry.time,
              type: "escalation",
            });
          }
        }
      }
    }

    // Find resolutions with clarification status
    for (const res of resolutions) {
      if (res.status === "Clarification Requested" && res.clarificationMessage) {
        const cmp = complaints.find((c) => c.id === res.complaintId);
        const key = `${res.complaintId}-${res.clarificationMessage}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({
          complaintId: res.complaintId,
          escalationId: res.escalationId,
          title: cmp?.title ?? res.complaintId,
          message: res.clarificationMessage,
          requestedBy: "District Admin",
          time: res.submittedAt,
          type: "resolution",
        });
      }
    }

    return result;
  }, [complaints, escalations, resolutions]);

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <MessageSquare size={20} style={{ color: "var(--sda-amber)" }} />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Clarifications</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Pending clarification requests from District Admin</p>
        </div>
      </motion.div>

      {/* KPI */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Pending", value: String(items.length), color: "var(--sda-amber)" },
          { label: "Escalation Related", value: String(items.filter((i) => i.type === "escalation").length), color: "var(--color-danger)" },
          { label: "Resolution Related", value: String(items.filter((i) => i.type === "resolution").length), color: "var(--color-info)" },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className="text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      {/* Items */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="p-5 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Pending Clarifications</h3>
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <MessageSquare size={24} className="text-[var(--color-text-muted)] opacity-40 mb-2" />
              <p className="text-sm text-[var(--color-text-muted)]">No pending clarification requests</p>
              <p className="text-xs text-[var(--color-text-muted)] opacity-70">You're all caught up!</p>
            </div>
          ) : (
            items.map((item, i) => (
              <motion.div key={`${item.complaintId}-${i}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
                className="flex items-start gap-3 rounded-xl border p-3.5"
                style={{ borderColor: "var(--sda-border-amber)", background: "color-mix(in srgb, var(--sda-amber) 4%, transparent)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "color-mix(in srgb, var(--sda-amber) 12%, transparent)", color: "var(--sda-amber)" }}>
                  <AlertTriangle size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-mono font-bold" style={{ color: "var(--sda-amber)" }}>{item.complaintId}</span>
                    {item.escalationId && <span className="text-[9px] font-mono text-orange-400">via {item.escalationId}</span>}
                    <span className="text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1"
                      style={{ borderColor: "rgba(20,184,166,0.25)", background: "rgba(20,184,166,0.06)", color: "#14b8a6" }}>
                      <Shield size={8} /> {item.requestedBy}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[var(--color-text-primary)] line-clamp-1">{item.title}</p>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">"{item.message}"</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1"><Clock size={9} /> {item.time}</span>
                  </div>
                  <Link href={`/sub-district-admin/dashboard/complaints/${item.complaintId}`}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[11px] font-medium mt-2.5 transition-all"
                      style={{ borderColor: "var(--sda-border-amber)", background: "color-mix(in srgb, var(--sda-amber) 10%, transparent)", color: "var(--sda-amber)" }}>
                      <ExternalLink size={11} /> Open Complaint
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </DashboardCard>
      </motion.div>
    </div>
  );
}

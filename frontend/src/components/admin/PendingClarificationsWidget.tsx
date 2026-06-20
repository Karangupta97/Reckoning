"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MessageSquare, Clock, ExternalLink, User, Shield, ShieldAlert } from "lucide-react";
import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";

export interface ClarificationEntry {
  complaintId?: string;
  escalationId?: string;
  budgetId?: string;
  title: string;
  message: string;
  senderRole: "sub-district" | "district" | "super";
  recipientRole: "sub-district" | "district" | "super";
  time: string;
  href: string;
}

const ROLE_ICON = {
  "sub-district": User,
  district: Shield,
  super: ShieldAlert,
};

const ROLE_LABEL = {
  "sub-district": "Sub-District",
  district: "District",
  super: "Super Admin",
};

const ROLE_COLOR = {
  "sub-district": "#f59e0b",
  district: "#14b8a6",
  super: "#22d3ee",
};

/**
 * Derive all pending clarification entries for a given portal.
 * "pending" = the latest clarification message is awaiting response from this portal.
 */
function usePendingClarifications(portal: "sub-district" | "district" | "super"): ClarificationEntry[] {
  const complaints = useComplaintStore((s) => s.complaints);
  const escalations = useEscalationStore((s) => s.escalations);
  const resolutions = useComplaintWorkflowStore((s) => s.resolutions);
  const budgets = useBudgetApprovalStore((s) => s.requests);

  return useMemo(() => {
    const entries: ClarificationEntry[] = [];

    if (portal === "sub-district") {
      // Sub-district receives clarifications from district (via escalation) and resolution clarification requests
      for (const esc of escalations) {
        if (!esc.sourceComplaintId || !esc.activityLog) continue;
        for (const entry of esc.activityLog) {
          if (entry.action.toLowerCase().includes("clarification requested") && entry.actor.includes("District")) {
            const msg = entry.action.replace(/^Clarification requested[:\s—]*/i, "").trim();
            entries.push({
              complaintId: esc.sourceComplaintId,
              escalationId: esc.id,
              title: esc.title,
              message: msg.substring(0, 120) || "Clarification needed",
              senderRole: "district",
              recipientRole: "sub-district",
              time: entry.time,
              href: `/sub-district-admin/dashboard/complaints/${esc.sourceComplaintId}`,
            });
          }
        }
      }
      // Resolution clarification requests
      for (const res of resolutions) {
        if (res.status === "Clarification Requested" && res.clarificationMessage) {
          const cmp = complaints.find((c) => c.id === res.complaintId);
          entries.push({
            complaintId: res.complaintId,
            escalationId: res.escalationId,
            title: cmp?.title ?? res.complaintId,
            message: res.clarificationMessage.substring(0, 120),
            senderRole: "district",
            recipientRole: "sub-district",
            time: res.submittedAt,
            href: `/sub-district-admin/dashboard/complaints/${res.complaintId}`,
          });
        }
      }
    }

    if (portal === "district") {
      // District receives clarifications from super admin (budget clarifications, escalation returns)
      for (const bud of budgets) {
        if (bud.status === "Clarification Requested") {
          const clarMsg = bud.activityLog.find((a) => a.action.includes("Clarification requested"));
          entries.push({
            budgetId: bud.id,
            title: bud.project,
            message: clarMsg ? clarMsg.action.replace(/^Clarification requested:\s*/i, "").substring(0, 120) : "Clarification needed",
            senderRole: "super",
            recipientRole: "district",
            time: clarMsg?.time ?? bud.submittedOn,
            href: `/district-admin/budget`,
          });
        }
      }
      // District also receives replies from sub-district on escalation threads
      for (const esc of escalations) {
        if (!esc.activityLog || esc.tier !== "district") continue;
        const clarEntries = esc.activityLog.filter((a) =>
          a.action.toLowerCase().includes("clarification") && a.actor.includes("Sub-District")
        );
        for (const entry of clarEntries) {
          const msg = entry.action.replace(/^.*clarification[:\s—]*/i, "").trim();
          entries.push({
            complaintId: esc.sourceComplaintId,
            escalationId: esc.id,
            title: esc.title,
            message: msg.substring(0, 120) || "Reply received",
            senderRole: "sub-district",
            recipientRole: "district",
            time: entry.time,
            href: `/district-admin/dashboard/escalation/${esc.id}`,
          });
        }
      }
    }

    if (portal === "super") {
      // Super admin receives responses to budget clarifications
      for (const bud of budgets) {
        if (bud.status === "Pending Approval" && bud.notes?.includes("District response:")) {
          entries.push({
            budgetId: bud.id,
            title: bud.project,
            message: "District clarification response received",
            senderRole: "district",
            recipientRole: "super",
            time: bud.activityLog[0]?.time ?? "",
            href: `/super-admin/governance/approvals/${bud.id}`,
          });
        }
      }
      // Super-tier escalation clarification from district
      for (const esc of escalations) {
        if (esc.tier !== "super" || !esc.activityLog) continue;
        const clarEntries = esc.activityLog.filter((a) =>
          a.action.toLowerCase().includes("clarification") && a.actor.includes("District")
        );
        for (const entry of clarEntries) {
          const msg = entry.action.replace(/^.*clarification[:\s—]*/i, "").trim();
          entries.push({
            escalationId: esc.id,
            title: esc.title,
            message: msg.substring(0, 120) || "Clarification message",
            senderRole: "district",
            recipientRole: "super",
            time: entry.time,
            href: `/super-admin/complaints/escalated-cases/${esc.id}`,
          });
        }
      }
    }

    // Sort by time (most recent first), deduplicate by message content
    const seen = new Set<string>();
    return entries
      .sort((a, b) => (b.time || "").localeCompare(a.time || ""))
      .filter((e) => {
        const key = `${e.complaintId ?? e.escalationId ?? e.budgetId}-${e.message}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
  }, [complaints, escalations, resolutions, budgets, portal]);
}

interface PendingClarificationsWidgetProps {
  portal: "sub-district" | "district" | "super";
  /** Compact = inline card for dashboard, full = standalone page widget */
  compact?: boolean;
}

export function PendingClarificationsWidget({ portal, compact = false }: PendingClarificationsWidgetProps) {
  const entries = usePendingClarifications(portal);

  if (compact && entries.length === 0) return null;

  return (
    <div className={`rounded-xl border ${compact ? "p-3" : "p-4"}`}
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
            <MessageSquare size={12} />
          </div>
          <span className="text-xs font-bold text-[var(--color-text-primary)]">Pending Clarifications</span>
          {entries.length > 0 && (
            <span className="text-[9px] font-bold rounded-full px-1.5 py-0.5"
              style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>
              {entries.length}
            </span>
          )}
        </div>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center py-5 text-center">
          <MessageSquare size={18} className="text-[var(--color-text-muted)] opacity-30 mb-1.5" />
          <p className="text-[11px] text-[var(--color-text-muted)]">No pending clarifications</p>
        </div>
      ) : (
        <div className={`flex flex-col gap-2 ${compact ? "max-h-[200px]" : "max-h-[340px]"} overflow-y-auto`} style={{ scrollbarWidth: "thin" }}>
          {entries.map((entry, i) => {
            const SenderIcon = ROLE_ICON[entry.senderRole];
            const senderColor = ROLE_COLOR[entry.senderRole];
            return (
              <motion.div key={`${entry.escalationId ?? entry.complaintId ?? entry.budgetId}-${i}`}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-lg border p-2.5 flex items-start gap-2.5"
                style={{ borderColor: `${senderColor}20`, background: `${senderColor}04` }}>
                {/* Sender icon */}
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${senderColor}15`, color: senderColor }}>
                  <SenderIcon size={10} />
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {entry.complaintId && <span className="text-[9px] font-mono font-bold text-blue-400">{entry.complaintId}</span>}
                    {entry.escalationId && <span className="text-[9px] font-mono font-bold text-orange-400">{entry.escalationId}</span>}
                    {entry.budgetId && <span className="text-[9px] font-mono font-bold text-emerald-400">{entry.budgetId}</span>}
                  </div>
                  <p className="text-[10px] text-[var(--color-text-secondary)] line-clamp-1 mt-0.5 leading-snug">{entry.title}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] line-clamp-2 mt-1 italic">"{entry.message}"</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] text-[var(--color-text-muted)] flex items-center gap-0.5">
                        <Clock size={8} /> {entry.time}
                      </span>
                      <span className="text-[8px]" style={{ color: senderColor }}>
                        {ROLE_LABEL[entry.senderRole]} → {ROLE_LABEL[entry.recipientRole]}
                      </span>
                    </div>
                    <Link href={entry.href}>
                      <button className="flex items-center gap-1 text-[9px] font-medium transition-colors hover:opacity-80"
                        style={{ color: senderColor }}>
                        <ExternalLink size={9} /> Open
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

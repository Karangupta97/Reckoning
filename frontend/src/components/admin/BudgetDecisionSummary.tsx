"use client";

/**
 * BudgetDecisionSummary — Shows requested vs approved vs released with differences.
 * Use on budget detail pages and budget table expansions.
 */

import { formatBudgetAmount } from "@/store/budgetApprovalStore";
import type { BudgetRequest } from "@/store/budgetApprovalStore";

interface BudgetDecisionSummaryProps {
  request: BudgetRequest;
}

export function BudgetDecisionSummary({ request: r }: BudgetDecisionSummaryProps) {
  const approved = r.approvedAmount;
  const diff = approved ? approved - r.requestedAmount : null;

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Budget Decision Summary</h4>

      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
        {/* Rows */}
        {[
          { label: "Requested Amount", value: formatBudgetAmount(r.requestedAmount), color: "var(--color-text-primary)" },
          ...(approved ? [
            { label: "Approved Amount", value: formatBudgetAmount(approved), color: "#10b981" },
            { label: "Difference", value: `${diff! > 0 ? "+" : ""}${formatBudgetAmount(Math.abs(diff!))}`, color: diff! < 0 ? "#ef4444" : diff! > 0 ? "#10b981" : "var(--color-text-muted)" },
          ] : []),
          ...(r.releasedAmount ? [
            { label: "Released Amount", value: formatBudgetAmount(r.releasedAmount), color: "#06b6d4" },
          ] : []),
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between px-3 py-2 border-b last:border-0"
            style={{ borderColor: "var(--color-border)" }}>
            <span className="text-[11px] text-[var(--color-text-muted)]">{row.label}</span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: row.color }}>{row.value}</span>
          </div>
        ))}

        {/* Status row */}
        <div className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
          <span className="text-[11px] text-[var(--color-text-muted)]">Decision</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: r.status === "Approved" ? "rgba(16,185,129,0.12)" : r.status === "Rejected" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
              color: r.status === "Approved" ? "#10b981" : r.status === "Rejected" ? "#ef4444" : "#f59e0b",
            }}>
            {approved && approved !== r.requestedAmount ? "Modified & Approved" : r.status}
          </span>
        </div>

        {/* Approval metadata */}
        {r.approvedBy && (
          <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "var(--color-surface)" }}>
            <span className="text-[10px] text-[var(--color-text-muted)]">Approved by</span>
            <span className="text-[10px] text-[var(--color-text-secondary)]">{r.approvedBy} · {r.approvedDate}</span>
          </div>
        )}

        {/* Release status */}
        {r.releaseStatus && (
          <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "var(--color-surface)" }}>
            <span className="text-[10px] text-[var(--color-text-muted)]">Release Status</span>
            <span className="text-[10px] font-semibold"
              style={{ color: r.releaseStatus === "Fully Released" ? "#10b981" : r.releaseStatus === "Partially Released" ? "#f59e0b" : "var(--color-text-muted)" }}>
              {r.releaseStatus}{r.releasedDate ? ` · ${r.releasedDate}` : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

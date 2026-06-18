"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, IndianRupee, MapPin, Activity, Shield } from "lucide-react";
import { useComplaintStore } from "@/store/complaintStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";

/**
 * CommunityImpact — Shows live governance impact metrics for citizens.
 * Derived entirely from complaint + budget stores.
 */
export function CommunityImpact() {
  const complaints = useComplaintStore((s) => s.complaints);
  const budgets = useBudgetApprovalStore((s) => s.requests);

  const metrics = useMemo(() => {
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    const fundsReleased = budgets.reduce((s, b) => s + (b.releasedAmount ?? 0), 0);
    const activeProjects = budgets.filter((b) => b.status === "Approved" && b.releasedAmount).length;
    const total = complaints.length;
    const safetyScore = total > 0 ? Math.max(0, Math.min(100, 100 - (complaints.filter((c) => c.priority === "Critical" && c.status !== "Resolved").length * 10) - (complaints.filter((c) => c.priority === "High" && c.status !== "Resolved").length * 5))) : 100;

    return [
      { label: "Issues Resolved", value: String(resolved), icon: CheckCircle2, color: "#22c55e" },
      { label: "Funds Released", value: `₹${fundsReleased.toFixed(1)} Cr`, icon: IndianRupee, color: "#f59e0b" },
      { label: "Roads Improved", value: String(resolved), icon: MapPin, color: "#3b82f6" },
      { label: "Active Projects", value: String(activeProjects), icon: Activity, color: "#8b5cf6" },
      { label: "Safety Score", value: `${safetyScore}/100`, icon: Shield, color: safetyScore >= 70 ? "#22c55e" : "#f59e0b" },
    ];
  }, [complaints, budgets]);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Community Impact</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center justify-center rounded-xl border px-3 py-3 text-center"
              style={{ borderColor: `${m.color}25`, background: `${m.color}05` }}>
              <Icon size={18} style={{ color: m.color }} className="mb-1.5" />
              <span className="text-base font-black tabular-nums" style={{ color: m.color }}>{m.value}</span>
              <span className="text-[9px] text-[var(--color-text-muted)] mt-0.5 leading-tight">{m.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

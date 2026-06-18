"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Circle } from "lucide-react";
import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";

interface TimelineStep {
  label: string;
  status: "done" | "active" | "pending";
  detail?: string;
}

/**
 * CitizenTransparencyTimeline — Simplified view of governance action on a complaint.
 * Shows only citizen-safe information (no internal admin notes or audit details).
 */
export function CitizenTransparencyTimeline({ complaintId }: { complaintId: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const complaint = useComplaintStore((s) => s.complaints.find((c) => c.id === complaintId));
  const escalations = useEscalationStore((s) => s.escalations);
  const budgets = useBudgetApprovalStore((s) => s.requests);
  const resolutions = useComplaintWorkflowStore((s) => s.resolutions);

  const steps = useMemo((): TimelineStep[] => {
    if (!complaint) return [];
    const result: TimelineStep[] = [];

    // Step 1: Submitted
    result.push({ label: "Complaint Submitted", status: "done", detail: complaint.createdDate });

    // Step 2: Officer Assigned
    if (complaint.officer) {
      result.push({ label: "Officer Assigned", status: "done", detail: complaint.officerAssignedDate });
    }

    // Step 3: Evidence Collected
    if (complaint.evidenceCount > 0) {
      result.push({ label: "Evidence Collected", status: "done", detail: `${complaint.evidenceCount} files` });
    }

    // Step 4: Escalated
    const esc = escalations.find((e) => e.sourceComplaintId === complaintId);
    if (esc) {
      result.push({ label: "Escalated to District", status: "done", detail: esc.escalatedOn });

      // Step 5: Funding
      if (esc.fundingRequired) {
        result.push({ label: "Funding Requested", status: "done", detail: `₹${esc.estimatedCost ?? "TBD"} Lakhs` });
      }

      // Step 6: Budget
      const bud = budgets.find((b) => b.linkedEscalationIds?.includes(esc.id));
      if (bud) {
        result.push({ label: "Budget Approved", status: bud.status === "Approved" ? "done" : "active", detail: `₹${bud.approvedAmount ?? bud.requestedAmount} Cr` });

        if (bud.releasedAmount) {
          result.push({ label: "Funds Released", status: "done", detail: `₹${bud.releasedAmount} Cr` });
        }
      }
    }

    // Step 7: Resolution
    const res = resolutions.find((r) => r.complaintId === complaintId);
    if (res) {
      result.push({ label: "Work Completed", status: res.status === "Approved" ? "done" : "active", detail: res.completionDate });
    }

    // Step 8: Final status
    if (complaint.status === "Resolved") {
      result.push({ label: "Complaint Resolved", status: "done", detail: "Issue addressed" });
    } else if (!result.some((s) => s.status === "active")) {
      // Add pending step
      const next = complaint.status === "Open" ? "Awaiting Assignment" : complaint.status === "Assigned" ? "Investigation Pending" : "In Progress";
      result.push({ label: next, status: "active" });
    }

    return result;
  }, [complaint, escalations, budgets, resolutions, complaintId]);

  if (!mounted || !complaint || steps.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-bold text-[var(--color-text-primary)]">Progress Timeline</h4>
      <div className="relative pl-4">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 rounded-full bg-[var(--color-border)]" />

        <div className="flex flex-col gap-0">
          {steps.map((step, i) => {
            const isDone = step.status === "done";
            const isActive = step.status === "active";
            const color = isDone ? "#22c55e" : isActive ? "#3b82f6" : "var(--color-text-muted)";

            return (
              <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 py-1.5 relative">
                <div className="absolute left-[-9px] w-4 h-4 rounded-full flex items-center justify-center z-10"
                  style={{ background: "var(--color-card)", border: `2px solid ${color}` }}>
                  {isDone ? <CheckCircle2 size={8} style={{ color }} /> : isActive ? <Clock size={7} style={{ color }} /> : <Circle size={5} style={{ color }} />}
                </div>
                <div className="min-w-0 flex-1 ml-2">
                  <span className="text-[11px] font-medium" style={{ color: isDone || isActive ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                    {step.label}
                  </span>
                  {step.detail && <span className="text-[10px] text-[var(--color-text-muted)] ml-2">{step.detail}</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

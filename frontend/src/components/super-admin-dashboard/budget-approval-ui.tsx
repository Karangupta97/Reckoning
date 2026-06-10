import type { BudgetPriority, BudgetRequestStatus, BudgetRequestType } from "@/store/budgetApprovalStore";

export const BUDGET_STATUS_CLS: Record<BudgetRequestStatus, string> = {
  "Pending Approval": "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  Rejected: "bg-red-500/15 text-red-400 border border-red-500/30",
  "Clarification Requested": "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
  "Under Audit": "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  "Sent Back For Review": "bg-orange-500/15 text-orange-400 border border-orange-500/30",
};

export const BUDGET_PRIORITY_CLS: Record<BudgetPriority, string> = {
  Critical: "bg-red-500/15 text-red-400 border border-red-500/30",
  High: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  Medium: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Low: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
};

export const BUDGET_TYPE_CLS: Record<BudgetRequestType, string> = {
  Emergency: "bg-red-500/15 text-red-400 border border-red-500/30",
  Standard: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
  Supplementary: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
};

export type ApprovalQueueTab =
  | "pending"
  | "approved"
  | "rejected"
  | "high-priority"
  | "emergency";

export const APPROVAL_TABS: { id: ApprovalQueueTab; label: string }[] = [
  { id: "pending", label: "Pending Approvals" },
  { id: "approved", label: "Approved Requests" },
  { id: "rejected", label: "Rejected Requests" },
  { id: "high-priority", label: "High Priority" },
  { id: "emergency", label: "Emergency Requests" },
];

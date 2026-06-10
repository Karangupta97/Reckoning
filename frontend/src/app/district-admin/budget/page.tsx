"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IndianRupee, Plus } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { BUDGET_STATUS_CLS } from "@/components/super-admin-dashboard/budget-approval-ui";
import { formatBudgetAmount, useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { currentDistrictFields, filterByDistrictScope } from "@/lib/district-scope";

export default function DistrictBudgetPage() {
  const requests = useBudgetApprovalStore((s) => s.requests);
  const submitBudgetRequest = useBudgetApprovalStore((s) => s.submitBudgetRequest);
  const respondToClarification = useBudgetApprovalStore((s) => s.respondToClarification);

  const [showForm, setShowForm] = useState(false);
  const [project, setProject] = useState("");
  const [amount, setAmount] = useState("");
  const [justification, setJustification] = useState("");
  const [clarifyId, setClarifyId] = useState<string | null>(null);
  const [clarifyResponse, setClarifyResponse] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const districtFields = currentDistrictFields();
  const districtRequests = filterByDistrictScope(requests, (r) => r.district, (r) => r.state);

  const handleSubmit = () => {
    if (!project.trim() || !amount || !justification.trim()) return;
    const id = submitBudgetRequest({
      district: districtFields.district,
      state: districtFields.state,
      project: project.trim(),
      requestedAmount: parseFloat(amount),
      priority: "High",
      requestType: "Standard",
      submittedBy: "District Officer",
      fiscalYear: "FY 2026-27",
      justification: justification.trim(),
      notes: "",
      documents: [{ name: "District_Budget_Proposal.pdf", size: "1.2 MB", type: "PDF" }],
    });
    setToast(`Submitted ${id}`);
    setShowForm(false);
    setProject("");
    setAmount("");
    setJustification("");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IndianRupee size={20} className="text-cyan-400" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Budget Requests</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Submit and track budget requests to Super Admin</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
          style={{ background: "#06b6d4" }}
        >
          <Plus size={14} /> New Request
        </button>
      </motion.div>

      {toast && (
        <div className="rounded-lg border px-3 py-2 text-xs text-emerald-400" style={{ borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)" }}>
          {toast} — visible in Super Admin Approval Queue immediately
        </div>
      )}

      {showForm && (
        <DashboardCard className="p-4 flex flex-col gap-3">
          <h2 className="text-sm font-bold">Submit Budget Request</h2>
          <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project name" className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (Cr)" className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
          <textarea value={justification} onChange={(e) => setJustification(e.target.value)} rows={3} placeholder="Justification" className="rounded-lg border px-3 py-2 text-xs resize-none" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
          <button type="button" onClick={handleSubmit} className="self-end rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "#10b981" }}>Submit to Super Admin</button>
        </DashboardCard>
      )}

      {clarifyId && (
        <DashboardCard className="p-4 flex flex-col gap-2">
          <h2 className="text-sm font-bold">Respond to Clarification — {clarifyId}</h2>
          <textarea value={clarifyResponse} onChange={(e) => setClarifyResponse(e.target.value)} rows={3} className="rounded-lg border px-3 py-2 text-xs resize-none" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
          <button
            type="button"
            onClick={() => {
              respondToClarification(clarifyId, clarifyResponse);
              setClarifyId(null);
              setClarifyResponse("");
              setToast("Clarification sent to Super Admin");
            }}
            className="self-end text-xs text-cyan-400 font-semibold"
          >
            Send Response
          </button>
        </DashboardCard>
      )}

      <DashboardCard>
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>{["ID", "Project", "Amount", "Status", "Submitted", "Action"].map((h) => <th key={h} className="dashboard-table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {districtRequests.map((r) => (
                <tr key={r.id} className="dashboard-table-row">
                  <td className="dashboard-table-td dashboard-table-td-mono text-xs">{r.id}</td>
                  <td className="dashboard-table-td text-xs">{r.project}</td>
                  <td className="dashboard-table-td text-xs">{formatBudgetAmount(r.requestedAmount)}</td>
                  <td className="dashboard-table-td">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${BUDGET_STATUS_CLS[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="dashboard-table-td text-xs">{r.submittedOn}</td>
                  <td className="dashboard-table-td text-xs">
                    {r.status === "Clarification Requested" && (
                      <button type="button" onClick={() => setClarifyId(r.id)} className="text-cyan-400 hover:underline">Respond</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { IndianRupee, Plus, X, ShieldAlert } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { BUDGET_STATUS_CLS } from "@/components/super-admin-dashboard/budget-approval-ui";
import { formatBudgetAmount, useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useEscalationStore } from "@/store/escalationStore";
import { currentDistrictFields, filterByDistrictScope } from "@/lib/district-scope";

export default function DistrictBudgetPage() {
  const requests = useBudgetApprovalStore((s) => s.requests);
  const submitBudgetRequest = useBudgetApprovalStore((s) => s.submitBudgetRequest);
  const escalations = useEscalationStore((s) => s.escalations);

  const [showForm, setShowForm] = useState(false);
  const [project, setProject] = useState("");
  const [amount, setAmount] = useState("");
  const [justification, setJustification] = useState("");
  const [linkedEscIds, setLinkedEscIds] = useState<string[]>([]);
  const [escSearch, setEscSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const districtFields = currentDistrictFields();
  const districtRequests = filterByDistrictScope(requests, (r) => r.district, (r) => r.state);

  // Available escalations for linking (non-closed, district-scoped)
  const availableEscalations = escalations.filter(
    (e) => !["Resolved", "Closed"].includes(e.status) && !linkedEscIds.includes(e.id)
  );
  const filteredEscalations = escSearch
    ? availableEscalations.filter(
        (e) => e.id.toLowerCase().includes(escSearch.toLowerCase()) || e.title.toLowerCase().includes(escSearch.toLowerCase())
      )
    : availableEscalations.slice(0, 5);

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
      linkedEscalationIds: linkedEscIds.length > 0 ? linkedEscIds : undefined,
      notes: "",
      documents: [{ name: "District_Budget_Proposal.pdf", size: "1.2 MB", type: "PDF" }],
    });
    setToast(`Submitted ${id}${linkedEscIds.length ? ` (linked to ${linkedEscIds.join(", ")})` : ""}`);
    setShowForm(false);
    setProject("");
    setAmount("");
    setJustification("");
    setLinkedEscIds([]);
    setEscSearch("");
    setTimeout(() => setToast(null), 3500);
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
          <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Submit Budget Request</h2>
          <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project name" className="rounded-lg border px-3 py-2 text-xs focus:outline-none" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (Cr)" className="rounded-lg border px-3 py-2 text-xs focus:outline-none" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
          <textarea value={justification} onChange={(e) => setJustification(e.target.value)} rows={3} placeholder="Justification" className="rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />

          {/* Linked Escalations selector */}
          <div>
            <label className="text-[11px] font-semibold text-[var(--color-text-secondary)] block mb-1.5">
              Link Escalations <span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
            </label>
            {linkedEscIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {linkedEscIds.map((escId) => (
                  <span key={escId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border"
                    style={{ borderColor: "rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.08)", color: "#14b8a6" }}>
                    <ShieldAlert size={9} />
                    {escId}
                    <button type="button" onClick={() => setLinkedEscIds(prev => prev.filter(x => x !== escId))}
                      className="ml-0.5 hover:text-red-400 transition-colors">
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              value={escSearch}
              onChange={(e) => setEscSearch(e.target.value)}
              placeholder="Search ESC-XXXX..."
              className="rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none w-full mb-1"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            />
            {escSearch && filteredEscalations.length > 0 && (
              <div className="rounded-lg border overflow-hidden max-h-[120px] overflow-y-auto" style={{ borderColor: "var(--color-border)" }}>
                {filteredEscalations.map((esc) => (
                  <button key={esc.id} type="button"
                    onClick={() => { setLinkedEscIds(prev => [...prev, esc.id]); setEscSearch(""); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--color-surface)] transition-colors"
                    style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <span className="font-mono font-semibold text-teal-400">{esc.id}</span>
                    <span className="text-[var(--color-text-secondary)] truncate flex-1">{esc.title}</span>
                    <span className="text-[9px] text-[var(--color-text-muted)]">{esc.subDistrict}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setShowForm(false); setLinkedEscIds([]); setEscSearch(""); }} className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">Cancel</button>
            <button type="button" onClick={handleSubmit} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "#10b981" }}>Submit Request</button>
          </div>
        </DashboardCard>
      )}

      <DashboardCard>
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>{["ID", "Project", "Amount", "Approved", "Released", "Linked ESC", "Status", "Submitted"].map((h) => <th key={h} className="dashboard-table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {districtRequests.map((r) => (
                <tr key={r.id} className="dashboard-table-row">
                  <td className="dashboard-table-td dashboard-table-td-mono text-xs">{r.id}</td>
                  <td className="dashboard-table-td text-xs font-medium text-[var(--color-text-primary)]">{r.project}</td>
                  <td className="dashboard-table-td text-xs">{formatBudgetAmount(r.requestedAmount)}</td>
                  <td className="dashboard-table-td text-xs">
                    {r.approvedAmount ? (
                      <span className="font-bold text-emerald-400">{formatBudgetAmount(r.approvedAmount)}</span>
                    ) : <span className="text-[var(--color-text-muted)]">—</span>}
                  </td>
                  <td className="dashboard-table-td text-xs">
                    {r.releasedAmount ? (
                      <span className="font-bold text-cyan-400">{formatBudgetAmount(r.releasedAmount)}</span>
                    ) : r.releaseStatus === "Pending Release" ? (
                      <span className="text-[10px] font-semibold text-amber-400">Pending</span>
                    ) : <span className="text-[var(--color-text-muted)]">—</span>}
                  </td>
                  <td className="dashboard-table-td">
                    {r.linkedEscalationIds && r.linkedEscalationIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {r.linkedEscalationIds.map((escId) => (
                          <Link key={escId} href={`/district-admin/dashboard/escalation/${escId}`}
                            className="font-mono text-[10px] font-semibold text-teal-400 hover:underline">
                            {escId}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="dashboard-table-td">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${BUDGET_STATUS_CLS[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="dashboard-table-td text-xs">{r.submittedOn}</td>
                </tr>
              ))}
              {districtRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="dashboard-table-td text-center py-8 text-xs text-[var(--color-text-muted)]">
                    No budget requests found for this district.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}

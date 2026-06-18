"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Plus } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useGovernanceRequestStore } from "@/store/governanceRequestStore";
import { currentDistrictFields, filterByDistrictScope } from "@/lib/district-scope";

const STATUS_CLS: Record<string, string> = {
  "Pending Review": "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  Rejected: "bg-red-500/15 text-red-400 border border-red-500/30",
  "Clarification Requested": "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
  "Under Audit": "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  "Sent Back For Review": "bg-orange-500/15 text-orange-400 border border-orange-500/30",
};

export default function DistrictGovernancePage() {
  const requests = useGovernanceRequestStore((s) => s.requests);
  const submitRequest = useGovernanceRequestStore((s) => s.submitRequest);
  const respondToClarification = useGovernanceRequestStore((s) => s.respondToClarification);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"Policy Exception" | "Access Request" | "Compliance Waiver" | "Role Change">("Policy Exception");
  const [justification, setJustification] = useState("");
  const [clarifyId, setClarifyId] = useState<string | null>(null);
  const [clarifyResponse, setClarifyResponse] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const districtFields = currentDistrictFields();
  const districtRequests = filterByDistrictScope(requests, (r) => r.district, (r) => r.state);

  const handleSubmit = () => {
    if (!title.trim() || !justification.trim()) return;
    const id = submitRequest({
      district: districtFields.district,
      state: districtFields.state,
      title: title.trim(),
      type,
      submittedBy: "District Officer",
      justification: justification.trim(),
      notes: "",
    });
    setToast(`${id} submitted to Super Admin Governance Review`);
    setShowForm(false);
    setTitle("");
    setJustification("");
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-cyan-400" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Governance Requests</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Policy, access, and compliance requests to Super Admin</p>
          </div>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "#06b6d4" }}>
          <Plus size={14} /> New Request
        </button>
      </motion.div>

      {toast && <div className="rounded-lg border px-3 py-2 text-xs text-emerald-400" style={{ borderColor: "rgba(16,185,129,0.3)" }}>{toast}</div>}

      {showForm && (
        <DashboardCard className="p-4 flex flex-col gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Request title" className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            <option value="Policy Exception">Policy Exception</option>
            <option value="Access Request">Access Request</option>
            <option value="Compliance Waiver">Compliance Waiver</option>
            <option value="Role Change">Role Change</option>
          </select>
          <textarea value={justification} onChange={(e) => setJustification(e.target.value)} rows={3} placeholder="Justification" className="rounded-lg border px-3 py-2 text-xs resize-none" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
          <button type="button" onClick={handleSubmit} className="self-end rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "#10b981" }}>Submit</button>
        </DashboardCard>
      )}

      {clarifyId && (
        <DashboardCard className="p-4 flex flex-col gap-2">
          <h2 className="text-sm font-bold">Respond — {clarifyId}</h2>
          <textarea value={clarifyResponse} onChange={(e) => setClarifyResponse(e.target.value)} rows={3} className="rounded-lg border px-3 py-2 text-xs resize-none" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
          <button type="button" onClick={() => { respondToClarification(clarifyId, clarifyResponse); setClarifyId(null); setToast("Response sent"); }} className="self-end text-xs text-cyan-400 font-semibold">Send</button>
        </DashboardCard>
      )}

      <DashboardCard>
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>{["ID", "Title", "Type", "Status", "Submitted", ""].map((h) => <th key={h || "a"} className="dashboard-table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {districtRequests.map((r) => (
                <tr key={r.id} className="dashboard-table-row">
                  <td className="dashboard-table-td dashboard-table-td-mono text-xs">{r.id}</td>
                  <td className="dashboard-table-td text-xs">{r.title}</td>
                  <td className="dashboard-table-td text-xs">{r.type}</td>
                  <td className="dashboard-table-td">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_CLS[r.status]}`}>{r.status}</span>
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

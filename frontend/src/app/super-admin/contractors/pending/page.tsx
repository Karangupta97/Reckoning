"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Clock3, CheckCircle2, XCircle } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

type Status = "Pending" | "Approved" | "Rejected";

const INITIAL = [
  { id: "CTR-201", name: "Sadbhav Engineering",   state: "Gujarat",      submitted: "04 Jun 2026", status: "Pending"  as Status },
  { id: "CTR-202", name: "Gayatri Projects",       state: "Andhra Pradesh", submitted: "03 Jun 2026", status: "Pending"  as Status },
  { id: "CTR-203", name: "MBL Infrastructure",     state: "Haryana",     submitted: "02 Jun 2026", status: "Approved" as Status },
  { id: "CTR-204", name: "Era Infra Engineering",  state: "Delhi",       submitted: "01 Jun 2026", status: "Rejected" as Status },
  { id: "CTR-205", name: "Simplex Infrastructures",state: "West Bengal", submitted: "01 Jun 2026", status: "Pending"  as Status },
];

const badge: Record<Status, string> = {
  Pending:  "dashboard-table-badge-status-escalated",
  Approved: "dashboard-table-badge-status-resolved",
  Rejected: "dashboard-table-badge-status-open",
};

export default function PendingVerificationPage() {
  const [items, setItems] = useState(INITIAL);
  const update = useCallback((id: string, s: Status) => setItems(prev => prev.map(r => r.id === id ? { ...r, status: s } : r)), []);

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <Clock3 size={20} className="text-amber-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Pending Verification</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Contractor applications awaiting compliance review</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <DashboardCard className="flex flex-col">
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>{["Contractor","State","Submitted","Status","Actions"].map(h => (
                  <th key={h} className="dashboard-table-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {items.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="dashboard-table-row">
                    <td className="dashboard-table-td">
                      <div className="flex items-center gap-3">
                        <div className="dashboard-table-contractor-icon"><Users size={14} /></div>
                        <div>
                          <p className="dashboard-table-td-primary text-sm">{c.name}</p>
                          <p className="dashboard-table-td-mono text-[11px]">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="dashboard-table-td text-xs whitespace-nowrap">{c.state}</td>
                    <td className="dashboard-table-td text-xs whitespace-nowrap">{c.submitted}</td>
                    <td className="dashboard-table-td">
                      <span className={`dashboard-table-badge ${badge[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="dashboard-table-td">
                      {c.status === "Pending" ? (
                        <div className="flex items-center gap-1.5">
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => update(c.id, "Approved")}
                            className="flex items-center gap-1 h-7 px-2.5 rounded-md border text-[11px] font-medium"
                            style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", color: "var(--color-success)" }}>
                            <CheckCircle2 size={11} /> Approve
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => update(c.id, "Rejected")}
                            className="flex items-center gap-1 h-7 px-2.5 rounded-md border text-[11px] font-medium"
                            style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "var(--color-danger)" }}>
                            <XCircle size={11} /> Reject
                          </motion.button>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}

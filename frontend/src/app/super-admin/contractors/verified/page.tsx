"use client";

import { motion } from "framer-motion";
import { Users, ShieldCheck, Search } from "lucide-react";
import { useState } from "react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

const CONTRACTORS = [
  { id: "CTR-101", name: "L&T Infrastructure",    state: "Maharashtra",   projects: 18, score: 92, verified: true  },
  { id: "CTR-102", name: "NCC Limited",            state: "Karnataka",     projects: 11, score: 81, verified: true  },
  { id: "CTR-103", name: "Afcons Infrastructure",  state: "Delhi",         projects: 9,  score: 65, verified: true  },
  { id: "CTR-104", name: "IRB Infrastructure",     state: "Tamil Nadu",    projects: 14, score: 58, verified: true  },
  { id: "CTR-105", name: "GMR Projects",           state: "Gujarat",       projects: 7,  score: 44, verified: true  },
  { id: "CTR-106", name: "Dilip Buildcon",         state: "Madhya Pradesh",projects: 12, score: 77, verified: true  },
  { id: "CTR-107", name: "KNR Constructions",      state: "Telangana",     projects: 8,  score: 83, verified: true  },
  { id: "CTR-108", name: "PNC Infratech",          state: "Uttar Pradesh", projects: 10, score: 69, verified: true  },
];

export default function VerifiedContractorsPage() {
  const [search, setSearch] = useState("");
  const filtered = CONTRACTORS.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Verified Contractors</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Contractors who have passed all compliance and verification checks</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Verified",  value: String(CONTRACTORS.length), color: "text-emerald-400" },
          { label: "Active Projects", value: "89",                        color: "text-cyan-400"    },
          { label: "Avg Risk Score",  value: "71",                        color: "text-amber-400"   },
          { label: "States Covered",  value: "8",                         color: "text-teal-400"    },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2 rounded-lg border px-3 h-9 flex-1 max-w-sm"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
              <Search size={13} className="text-[var(--color-text-muted)] shrink-0" />
              <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search contractor, state…"
                className="bg-transparent text-xs outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] w-full" />
            </div>
          </div>
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>{["Contractor","State","Projects","Risk Score","Status"].map(h => (
                  <th key={h} className="dashboard-table-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
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
                    <td className="dashboard-table-td dashboard-table-td-primary tabular-nums">{c.projects}</td>
                    <td className="dashboard-table-td">
                      <span className={`dashboard-table-badge ${c.score >= 85 ? "dashboard-table-badge-risk-critical" : c.score >= 70 ? "dashboard-table-badge-risk-high" : c.score >= 50 ? "dashboard-table-badge-risk-moderate" : "dashboard-table-badge-risk-low"}`}>
                        {c.score}
                      </span>
                    </td>
                    <td className="dashboard-table-td">
                      <span className="dashboard-table-badge dashboard-table-badge-status-resolved flex items-center gap-1">
                        <ShieldCheck size={11} /> Verified
                      </span>
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

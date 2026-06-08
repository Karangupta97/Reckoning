"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Search, User, Settings, Shield, FileText, AlertTriangle } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

type Category = "Auth" | "Data" | "Config" | "Security" | "Report";

const LOGS = [
  { id: "LOG-8821", actor: "Super Admin",    action: "Approved contractor CTR-203 verification",   category: "Data"     as Category, time: "04 Jun 2026 11:42", ip: "192.168.1.10" },
  { id: "LOG-8820", actor: "System",         action: "AI anomaly detected — NH-48 budget spike",    category: "Security" as Category, time: "04 Jun 2026 11:18", ip: "—"            },
  { id: "LOG-8819", actor: "Super Admin",    action: "User role updated — Rajesh Kumar → Auditor",  category: "Config"   as Category, time: "04 Jun 2026 10:55", ip: "192.168.1.10" },
  { id: "LOG-8818", actor: "District Admin", action: "Escalation ESC-4021 assigned to R. Sharma",   category: "Data"     as Category, time: "04 Jun 2026 10:30", ip: "10.0.0.42"    },
  { id: "LOG-8817", actor: "Super Admin",    action: "Q2 Expenditure Audit report generated",        category: "Report"   as Category, time: "04 Jun 2026 09:15", ip: "192.168.1.10" },
  { id: "LOG-8816", actor: "System",         action: "Failed login attempt — 3 retries",             category: "Auth"     as Category, time: "04 Jun 2026 08:47", ip: "203.0.113.99" },
  { id: "LOG-8815", actor: "Super Admin",    action: "Access control matrix updated",                category: "Config"   as Category, time: "03 Jun 2026 17:30", ip: "192.168.1.10" },
  { id: "LOG-8814", actor: "Audit Officer",  action: "Downloaded contractor risk report",            category: "Report"   as Category, time: "03 Jun 2026 16:22", ip: "10.0.0.55"    },
  { id: "LOG-8813", actor: "System",         action: "SLA breach auto-escalation triggered",         category: "Security" as Category, time: "03 Jun 2026 14:10", ip: "—"            },
  { id: "LOG-8812", actor: "Super Admin",    action: "New district admin onboarded — Rajesh Kumar",  category: "Auth"     as Category, time: "03 Jun 2026 12:00", ip: "192.168.1.10" },
];

const catIcon: Record<Category, typeof User> = {
  Auth: User, Data: FileText, Config: Settings, Security: Shield, Report: ClipboardList,
};
const catColor: Record<Category, string> = {
  Auth: "text-cyan-400", Data: "text-emerald-400", Config: "text-amber-400", Security: "text-red-400", Report: "text-teal-400",
};
const catBadge: Record<Category, string> = {
  Auth: "dashboard-table-badge-status-review", Data: "dashboard-table-badge-status-resolved",
  Config: "dashboard-table-badge-status-escalated", Security: "dashboard-table-badge-status-open",
  Report: "dashboard-table-badge-status-review",
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [catF, setCatF] = useState("");

  const filtered = LOGS.filter(l => {
    const q = search.toLowerCase();
    return (!q || l.actor.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.id.toLowerCase().includes(q))
      && (!catF || l.category === catF);
  });

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <ClipboardList size={20} className="text-cyan-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Audit Logs</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Complete trail of admin actions, system events, and security incidents</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(["Auth","Data","Config","Security","Report"] as Category[]).map((c) => (
          <DashboardCard key={c} className="flex flex-col items-center justify-center py-3 px-2 text-center cursor-pointer"
            onClick={() => setCatF(catF === c ? "" : c)}>
            <span className={`text-lg font-bold ${catColor[c]}`}>{LOGS.filter(l => l.category === c).length}</span>
            <span className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{c}</span>
          </DashboardCard>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2 rounded-lg border px-3 h-9 flex-1 min-w-[180px] max-w-sm"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
              <Search size={13} className="text-[var(--color-text-muted)] shrink-0" />
              <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search actor, action, ID…"
                className="bg-transparent text-xs outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] w-full" />
            </div>
            {catF && (
              <button onClick={() => setCatF("")}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                Clear filter: {catF}
              </button>
            )}
          </div>
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>{["Log ID","Actor","Action","Category","Time","IP"].map(h => (
                  <th key={h} className="dashboard-table-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => {
                  const Icon = catIcon[l.category];
                  return (
                    <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="dashboard-table-row">
                      <td className="dashboard-table-td dashboard-table-td-mono text-xs">{l.id}</td>
                      <td className="dashboard-table-td text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1.5"><User size={11} className="text-[var(--color-text-muted)]" />{l.actor}</span>
                      </td>
                      <td className="dashboard-table-td text-xs max-w-[16rem] truncate">{l.action}</td>
                      <td className="dashboard-table-td">
                        <span className={`dashboard-table-badge flex items-center gap-1 w-fit ${catBadge[l.category]}`}>
                          <Icon size={10} />{l.category}
                        </span>
                      </td>
                      <td className="dashboard-table-td text-xs whitespace-nowrap text-[var(--color-text-muted)]">{l.time}</td>
                      <td className="dashboard-table-td text-xs font-mono">{l.ip}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)]">{filtered.length} of {LOGS.length} entries</span>
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}

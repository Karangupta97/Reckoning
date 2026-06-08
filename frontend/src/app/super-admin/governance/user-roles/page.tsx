"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, UserCheck, XCircle, CheckCircle2, Clock3 } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import OnboardingRequests from "@/components/super-admin-dashboard/onboarding-requests";

const ROLES = [
  { role: "Super Admin",       count: 2,   color: "text-cyan-400",    desc: "Full platform access"              },
  { role: "District Admin",    count: 28,  color: "text-teal-400",    desc: "District-level monitoring"         },
  { role: "Sub-District Admin",count: 142, color: "text-emerald-400", desc: "Taluka operations"                 },
  { role: "Audit Officer",     count: 18,  color: "text-amber-400",   desc: "Read-only audit access"            },
  { role: "Contractor",        count: 54,  color: "text-orange-400",  desc: "Project reporting access"          },
  { role: "Viewer",            count: 320, color: "text-slate-400",   desc: "Public dashboard access"           },
];

export default function UserRolesPage() {
  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <Shield size={20} className="text-cyan-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">User Roles</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Manage role assignments and access control across the platform</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <DashboardCard className="p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Role Distribution</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ROLES.map((r, i) => (
              <motion.div key={r.role} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="flex flex-col gap-1 rounded-lg border px-4 py-3"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                <span className={`text-lg font-bold tabular-nums ${r.color}`}>{r.count}</span>
                <span className="text-xs font-medium text-[var(--color-text-primary)]">{r.role}</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">{r.desc}</span>
              </motion.div>
            ))}
          </div>
        </DashboardCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <OnboardingRequests />
      </motion.div>
    </div>
  );
}

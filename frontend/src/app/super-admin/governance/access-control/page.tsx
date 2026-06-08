"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Check, X } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

const PERMISSIONS = [
  { module: "Dashboard",          superAdmin: true,  districtAdmin: true,  subDistrictAdmin: true,  auditor: true,  contractor: false },
  { module: "Complaints",         superAdmin: true,  districtAdmin: true,  subDistrictAdmin: true,  auditor: true,  contractor: false },
  { module: "Escalations",        superAdmin: true,  districtAdmin: true,  subDistrictAdmin: false, auditor: true,  contractor: false },
  { module: "Expenditure",        superAdmin: true,  districtAdmin: false, subDistrictAdmin: false, auditor: true,  contractor: false },
  { module: "Contractors",        superAdmin: true,  districtAdmin: false, subDistrictAdmin: false, auditor: true,  contractor: true  },
  { module: "GIS Monitoring",     superAdmin: true,  districtAdmin: true,  subDistrictAdmin: false, auditor: false, contractor: false },
  { module: "AI Alerts",          superAdmin: true,  districtAdmin: false, subDistrictAdmin: false, auditor: false, contractor: false },
  { module: "Reports",            superAdmin: true,  districtAdmin: true,  subDistrictAdmin: false, auditor: true,  contractor: false },
  { module: "Audit Logs",         superAdmin: true,  districtAdmin: false, subDistrictAdmin: false, auditor: true,  contractor: false },
  { module: "Settings",           superAdmin: true,  districtAdmin: true,  subDistrictAdmin: true,  auditor: false, contractor: false },
  { module: "Admin Governance",   superAdmin: true,  districtAdmin: false, subDistrictAdmin: false, auditor: false, contractor: false },
];

const ROLES = ["Super Admin","District Admin","Sub-District Admin","Auditor","Contractor"] as const;
const ROLE_KEYS: (keyof typeof PERMISSIONS[0])[] = ["superAdmin","districtAdmin","subDistrictAdmin","auditor","contractor"];

function Cell({ allowed }: { allowed: boolean }) {
  return (
    <td className="dashboard-table-td text-center">
      {allowed
        ? <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-400"><Check size={12} /></span>
        : <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500/10 text-red-400 opacity-50"><X size={12} /></span>}
    </td>
  );
}

export default function AccessControlPage() {
  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <Shield size={20} className="text-cyan-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Access Control</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Role-based permission matrix across all platform modules</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <DashboardCard className="p-5">
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th className="dashboard-table-th">Module</th>
                  {ROLES.map(r => <th key={r} className="dashboard-table-th text-center">{r}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((p, i) => (
                  <motion.tr key={p.module} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="dashboard-table-row">
                    <td className="dashboard-table-td dashboard-table-td-primary text-sm font-medium">{p.module}</td>
                    {ROLE_KEYS.map(k => <Cell key={k} allowed={p[k] as boolean} />)}
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

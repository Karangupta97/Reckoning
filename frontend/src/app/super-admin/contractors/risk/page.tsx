"use client";
import ContractorRiskTable from "@/components/super-admin-dashboard/contractor-risk-table";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

export default function ContractorRiskPage() {
  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <ShieldAlert size={20} className="text-red-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Risk Assessment</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">AI-generated contractor risk scores and anomaly flags</p>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Critical Risk",  value: "2",  color: "text-red-400"     },
          { label: "High Risk",      value: "3",  color: "text-orange-400"  },
          { label: "Moderate Risk",  value: "8",  color: "text-amber-400"   },
          { label: "Low Risk",       value: "41", color: "text-emerald-400" },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <ContractorRiskTable />
      </motion.div>
    </div>
  );
}

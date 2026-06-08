"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  CheckCircle2,
  ShieldAlert,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import ComplaintTrendChart from "@/components/district-admin-dashboard/complaint-trend-chart";

// Mock — replace with API fetch
const MOCK = {
  id: "SDA-003",
  name: "Amit Singh",
  subDistrict: "Dwarka",
  email: "a.singh@district.gov.in",
  phone: "+91 98765 43212",
  status: "Active" as const,
  joinDate: "20 Jun 2024",
  complaints: 201,
  resolved: 185,
  escalated: 6,
  sla: 92,
  designation: "Sub-District Officer",
};

export default function SubDistrictDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const d = MOCK;

  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      {/* Back */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/district-admin/sub-districts"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-teal-400 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Sub-Districts
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Users size={22} className="text-teal-400 shrink-0" />
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
            {d.name} — {d.subDistrict}
          </h1>
          <span className="dashboard-table-badge dashboard-table-badge-status-resolved inline-flex items-center gap-1">
            <CheckCircle2 size={11} />
            {d.status}
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile card */}
        <DashboardCard
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5"
        >
          {/* Avatar */}
          <div className="mb-4 flex flex-col items-center gap-2">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 text-2xl font-bold"
              style={{
                borderColor: "var(--da-border-teal)",
                background: "color-mix(in srgb, var(--da-teal) 12%, transparent)",
                color: "var(--da-teal)",
              }}
            >
              {d.name.charAt(0)}
            </div>
            <div className="text-center">
              <p className="font-semibold text-[var(--color-text-primary)]">{d.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{d.designation}</p>
              <p className="mt-1 text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--da-teal)" }}>{id}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2.5">
            {[
              { icon: Mail, value: d.email },
              { icon: Phone, value: d.phone },
              { icon: MapPin, value: d.subDistrict },
              { icon: CalendarDays, value: `Joined ${d.joinDate}` },
            ].map(({ icon: Icon, value }) => (
              <div key={value} className="flex items-center gap-2.5 text-xs text-[var(--color-text-secondary)]">
                <Icon size={13} className="shrink-0 text-teal-400" />
                <span className="truncate">{value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" className="da-btn-primary w-full flex items-center justify-center gap-2">
              <Mail size={14} />
              Send Message
            </button>
            <button type="button" className="da-btn-secondary w-full flex items-center justify-center gap-2">
              Edit Profile
            </button>
          </div>
        </DashboardCard>

        {/* Stats + chart */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: ClipboardList, label: "Total Complaints", value: d.complaints, color: "text-[var(--color-text-primary)]", bg: "bg-[var(--color-surface)]" },
              { icon: CheckCircle2, label: "Resolved", value: d.resolved, color: "text-teal-400", bg: "bg-teal-500/5" },
              { icon: ShieldAlert, label: "Escalated", value: d.escalated, color: "text-red-400", bg: "bg-red-500/5" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <DashboardCard
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col items-center justify-center py-4 px-3 text-center ${bg}`}
              >
                <Icon size={16} className={`mb-1 ${color}`} />
                <span className={`text-xl font-bold ${color}`}>{value}</span>
                <span className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{label}</span>
              </DashboardCard>
            ))}
          </div>

          {/* SLA */}
          <DashboardCard
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">SLA Compliance</p>
              <span className="text-lg font-bold text-teal-400">{d.sla}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${d.sla}%` }}
                transition={{ duration: 0.7 }}
                className="h-full rounded-full da-sla-bar-fill-good"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-[var(--color-text-muted)]">
              Target: 85% · Current: {d.sla}% · {d.sla >= 85 ? "✓ On target" : "⚠ Below target"}
            </p>
          </DashboardCard>

          {/* Mini chart */}
          <ComplaintTrendChart compact />
        </div>
      </div>
    </div>
  );
}

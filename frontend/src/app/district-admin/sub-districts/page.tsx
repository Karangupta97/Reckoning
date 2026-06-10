"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit2,
  ShieldOff,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";
import Link from "next/link";

type OfficerStatus = "Active" | "Suspended" | "Pending";

interface SubDistrictAdmin {
  id: string;
  name: string;
  subDistrict: string;
  email: string;
  phone: string;
  status: OfficerStatus;
  joinDate: string;
  complaints: number;
  resolved: number;
  sla: number;
}

const DATA: SubDistrictAdmin[] = [
  { id: "SDA-001", name: "Rajesh Sharma", subDistrict: "Panvel Taluka", email: "r.sharma@raigad.gov.in", phone: "+91 98765 43210", status: "Active", joinDate: "12 Jan 2025", complaints: 142, resolved: 118, sla: 83 },
  { id: "SDA-002", name: "Priya Iyer", subDistrict: "Alibag", email: "p.iyer@raigad.gov.in", phone: "+91 98765 43211", status: "Active", joinDate: "03 Mar 2025", complaints: 96, resolved: 79, sla: 82 },
  { id: "SDA-003", name: "Amit Singh", subDistrict: "Karjat", email: "a.singh@raigad.gov.in", phone: "+91 98765 43212", status: "Active", joinDate: "20 Jun 2024", complaints: 201, resolved: 185, sla: 92 },
  { id: "SDA-004", name: "Sunita Gupta", subDistrict: "Mahad", email: "s.gupta@raigad.gov.in", phone: "+91 98765 43213", status: "Suspended", joinDate: "08 Sep 2024", complaints: 178, resolved: 132, sla: 74 },
  { id: "SDA-005", name: "Mohammed Khan", subDistrict: "Mangaon", email: "m.khan@raigad.gov.in", phone: "+91 98765 43214", status: "Active", joinDate: "15 Nov 2024", complaints: 115, resolved: 94, sla: 82 },
  { id: "SDA-006", name: "Tanvi Verma", subDistrict: "Murud", email: "t.verma@raigad.gov.in", phone: "+91 98765 43215", status: "Pending", joinDate: "02 Jun 2026", complaints: 87, resolved: 55, sla: 63 },
];

const statusConfig: Record<OfficerStatus, { badge: string; icon: typeof CheckCircle2 }> = {
  Active: { badge: "dashboard-table-badge-status-resolved", icon: CheckCircle2 },
  Suspended: { badge: "dashboard-table-badge-status-open", icon: XCircle },
  Pending: { badge: "dashboard-table-badge-status-escalated", icon: Clock3 },
};

function getSlaTextClass(sla: number) {
  if (sla >= 85) return "text-teal-400";
  if (sla >= 70) return "text-amber-400";
  return "text-red-400";
}

export default function SubDistrictsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OfficerStatus | "All">("All");

  const filtered = DATA.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.subDistrict.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-2">
          <Users size={20} className="text-teal-400 shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
              Sub-Districts
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Manage sub-district administrators
            </p>
          </div>
        </div>
        <Link
          href="/district-admin/sub-districts/new"
          className="da-btn-primary flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={15} />
          Add Sub-District Admin
        </Link>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: "Total Admins", value: DATA.length, color: "text-[var(--color-text-primary)]" },
          { label: "Active", value: DATA.filter(d => d.status === "Active").length, color: "text-teal-400" },
          { label: "Suspended", value: DATA.filter(d => d.status === "Suspended").length, color: "text-red-400" },
        ].map((s) => (
          <DashboardCard
            key={s.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-4 px-3 text-center"
          >
            <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      {/* Filters */}
      <DashboardCard
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2 flex-1 min-w-[200px]"
            style={{ borderColor: "var(--dash-border)", background: "color-mix(in srgb, white 3%, transparent)" }}
          >
            <Search size={14} className="text-muted shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, sub-district or ID…"
              className="bg-transparent text-xs outline-none text-[var(--color-text-primary)] w-full"
              aria-label="Search sub-district admins"
            />
          </div>
          {(["All", "Active", "Suspended", "Pending"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s as typeof statusFilter)}
              className={`h-9 rounded-lg border px-4 text-xs font-medium transition-all ${
                statusFilter === s
                  ? "border-teal-500/30 bg-teal-500/10 text-teal-300"
                  : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
              style={{
                background:
                  statusFilter === s
                    ? undefined
                    : "color-mix(in srgb, white 3%, transparent)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </DashboardCard>

      {/* Table */}
      <DashboardCard
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-5"
      >
        <div className="dashboard-table-header">
          <div>
            <h3 className="text-primary text-sm font-semibold">
              Sub-District Administrators
            </h3>
            <p className="text-muted mt-1 text-xs">
              {filtered.length} admin{filtered.length !== 1 ? "s" : ""} listed
            </p>
          </div>
        </div>

        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th className="dashboard-table-th">Admin</th>
                <th className="dashboard-table-th">Sub-District</th>
                <th className="dashboard-table-th">Contact</th>
                <th className="dashboard-table-th">Status</th>
                <th className="dashboard-table-th">Complaints</th>
                <th className="dashboard-table-th">SLA Score</th>
                <th className="dashboard-table-th">Joined</th>
                <th className="dashboard-table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((d, index) => {
                  const { badge, icon: StatusIcon } = statusConfig[d.status];
                  return (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="dashboard-table-row da-table-row"
                    >
                      <td className="dashboard-table-td">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold"
                            style={{
                              borderColor: "var(--da-border-teal)",
                              background: "color-mix(in srgb, var(--da-teal) 10%, transparent)",
                              color: "var(--da-teal)",
                            }}
                          >
                            {d.name.charAt(0)}
                          </div>
                          <div>
                            <p className="dashboard-table-td-primary text-sm">{d.name}</p>
                            <p className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--da-teal)" }}>
                              {d.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="dashboard-table-td whitespace-nowrap">{d.subDistrict}</td>
                      <td className="dashboard-table-td">
                        <p className="text-xs">{d.email}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">{d.phone}</p>
                      </td>
                      <td className="dashboard-table-td">
                        <span className={`dashboard-table-badge inline-flex items-center gap-1 ${badge}`}>
                          <StatusIcon size={11} />
                          {d.status}
                        </span>
                      </td>
                      <td className="dashboard-table-td tabular-nums dashboard-table-td-primary">{d.complaints}</td>
                      <td className="dashboard-table-td">
                        <span className={`text-xs font-bold ${getSlaTextClass(d.sla)}`}>{d.sla}%</span>
                      </td>
                      <td className="dashboard-table-td whitespace-nowrap text-xs">{d.joinDate}</td>
                      <td className="dashboard-table-td">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/district-admin/sub-districts/${d.id}`} title="View">
                            <ActionButton label="View" icon={Eye} />
                          </Link>
                          <ActionButton label="Edit" icon={Edit2} color="emerald" />
                          <ActionButton label="Suspend" icon={ShieldOff} color="amber" />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  color = "teal",
}: {
  label: string;
  icon: typeof Eye;
  color?: "teal" | "emerald" | "amber";
}) {
  const colorMap = {
    teal: "border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
  };
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      title={label}
      aria-label={label}
      className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${colorMap[color]}`}
    >
      <Icon size={13} />
    </motion.button>
  );
}

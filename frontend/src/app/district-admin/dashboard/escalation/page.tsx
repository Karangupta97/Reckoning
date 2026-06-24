"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Search, ChevronDown, CheckCircle2, Eye,
  ArrowUpRight, Clock, Activity,
  Download, Plus, RotateCcw, Filter, MoreHorizontal,
  TrendingUp, TrendingDown, Timer, Zap, MapPin,
  UserCheck, XCircle, Inbox, ChevronRight, X,
} from "lucide-react";
import Link from "next/link";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useDistrictInfo } from "@/hooks/useDistrictInfo";
import { filterByDistrictScope } from "@/lib/district-scope";
import { useEscalationStore } from "@/store/escalationStore";
import { exportToCsv } from "@/lib/csv-export";
import type { EscalationPriority, EscalationStatus, EscalationCategory, EscalationSLAStatus, Escalation } from "@/store/escalationStore";

/* ─── Local type aliases (keeps all the rest of the file identical) ── */
type Priority  = EscalationPriority;
type Status    = EscalationStatus;
type Category  = EscalationCategory;
type SLAStatus = EscalationSLAStatus;

/* ─── Badge & colour maps ────────────────────────────────────── */
const PRIORITY_CONFIG: Record<Priority, { badge: string; dot: string; ring: string }> = {
  Critical: { badge: "bg-red-500/15 text-red-400 border-red-500/30",        dot: "bg-red-400",    ring: "shadow-[0_0_8px_rgba(239,68,68,0.4)]"  },
  High:     { badge: "bg-orange-500/15 text-orange-400 border-orange-500/30", dot: "bg-orange-400", ring: "shadow-[0_0_8px_rgba(249,115,22,0.35)]" },
  Medium:   { badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",   dot: "bg-amber-400",  ring: ""                                      },
  Low:      { badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400", ring: "" },
};

const STATUS_CONFIG: Record<Status, { badge: string; icon: typeof Activity }> = {
  "Pending Review": { badge: "bg-amber-500/12 text-amber-400 border-amber-500/25",   icon: Clock       },
  "Assigned":       { badge: "bg-blue-500/12 text-blue-400 border-blue-500/25",      icon: UserCheck   },
  "Investigating":  { badge: "bg-purple-500/12 text-purple-400 border-purple-500/25",icon: Activity    },
  "Resolved":       { badge: "bg-teal-500/12 text-teal-400 border-teal-500/25",      icon: CheckCircle2},
  "Closed":         { badge: "bg-slate-500/12 text-slate-400 border-slate-500/25",   icon: XCircle     },
};

const SLA_CONFIG: Record<SLAStatus, { text: string; bg: string; bar: string }> = {
  "On Track": { text: "text-teal-400",   bg: "bg-teal-400/10",   bar: "bg-teal-400"   },
  "At Risk":  { text: "text-amber-400",  bg: "bg-amber-400/10",  bar: "bg-amber-400"  },
  "Breached": { text: "text-red-400",    bg: "bg-red-400/10",    bar: "bg-red-400"    },
};

/* ─── Filter options ─────────────────────────────────────────── */
const PRIORITIES: (Priority | "All")[] = ["All","Critical","High","Medium","Low"];
const STATUSES:   (Status   | "All")[] = ["All","Pending Review","Assigned","Investigating","Resolved","Closed"];
const CATEGORIES: (Category | "All")[] = ["All","Sanitation","Infrastructure","Flooding","Road Damage","Utilities","Civic","Safety"];
const SUB_DISTRICTS = ["All", "Alibag", "Panvel", "Karjat", "Mahad", "Mangaon", "Murud"];
const SLA_STATUSES: (SLAStatus | "All")[] = ["All","On Track","At Risk","Breached"];

/* ─── Animation presets ──────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay },
});

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay: i * 0.045 },
});

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function EscalationsPage() {
  const { districtName } = useDistrictInfo();
  const _raw = filterByDistrictScope(
    useEscalationStore((s) => s.escalations),
    (e) => e.district,
    (e) => e.state
  );
  // Deduplicate by ID — guards against store/seed ID collision after hot reload
  const ALL = _raw.filter((e, idx, arr) => arr.findIndex((x) => x.id === e.id) === idx);
  const [search,      setSearch]      = useState("");
  const [priority,    setPriority]    = useState<Priority | "All">("All");
  const [status,      setStatus]      = useState<Status | "All">("All");
  const [category,    setCategory]    = useState<Category | "All">("All");
  const [subDistrict, setSubDistrict] = useState("All");
  const [slaFilter,   setSlaFilter]   = useState<SLAStatus | "All">("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    const seen = new Set<string>();
    return ALL.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      const q = search.toLowerCase();
      const matchSearch = !q || e.id.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.subDistrict.toLowerCase().includes(q);
      return matchSearch &&
        (priority    === "All" || e.priority    === priority)    &&
        (status      === "All" || e.status      === status)      &&
        (category    === "All" || e.category    === category)    &&
        (subDistrict === "All" || e.subDistrict === subDistrict) &&
        (slaFilter   === "All" || e.slaStatus   === slaFilter);
    });
  }, [ALL, search, priority, status, category, subDistrict, slaFilter]);

  const resetFilters = () => {
    setSearch(""); setPriority("All"); setStatus("All");
    setCategory("All"); setSubDistrict("All"); setSlaFilter("All");
  };

  const activeFilterCount = [
    priority !== "All", status !== "All", category !== "All",
    subDistrict !== "All", slaFilter !== "All", search !== "",
  ].filter(Boolean).length;

  /* ── Derived KPIs ── */
  const kpis = [
    { label: "Critical Escalations", value: String(ALL.filter(e => e.priority === "Critical").length), change: "+3 today", trend: "up" as const, variant: "danger" as const, icon: <ShieldAlert size={20} /> },
    { label: "Pending Review",        value: String(ALL.filter(e => e.status === "Pending Review").length), change: "+2 today", trend: "up" as const, variant: "warn" as const, icon: <Clock size={20} /> },
    { label: "SLA Breached",          value: String(ALL.filter(e => e.slaStatus === "Breached").length), change: "+1 today", trend: "up" as const, variant: "danger" as const, icon: <Timer size={20} /> },
    { label: "Resolved Today",        value: "18", change: "8.3%", trend: "down" as const, variant: "good" as const, icon: <CheckCircle2 size={20} /> },
  ];

  const opStats = [
    { label: "High Priority",          value: "24", color: "text-red-400"    },
    { label: "In Progress",            value: "38", color: "text-blue-400"   },
    { label: "Awaiting Assignment",    value: "12", color: "text-amber-400"  },
    { label: "Resolved Today",         value: "18", color: "text-teal-400"   },
    { label: "Avg Resolution",         value: "2.4d", color: "text-emerald-400" },
  ];

  return (
    <div className="flex min-h-0 gap-4">
      {/* ── Main Column ── */}
      <div className="flex flex-1 min-w-0 flex-col gap-4">

        {/* PAGE HEADER */}
        <motion.div {...fadeUp(0)} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                <ShieldAlert size={16} className="text-red-400" />
              </div>
              <h1 className="text-lg font-bold text-[var(--color-text-primary)] lg:text-xl">
                Escalation Management Center
              </h1>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] pl-0.5">
              Monitor SLA breaches, critical complaints and district-wide escalations
              in <span className="font-medium text-teal-400">{districtName}</span>.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => exportToCsv("escalations", filtered.map(e => ({
                ID: e.id, Title: e.title, SubDistrict: e.subDistrict,
                Category: e.category, Priority: e.priority, Status: e.status,
                SLA: e.slaLabel, AssignedTo: e.assignedTo, EscalatedOn: e.escalatedOn, DaysOpen: e.daysOpen,
              })))}
              className="da-btn-secondary flex items-center gap-1.5 !h-9 !px-3 !text-xs"
            >
              <Download size={14} />
              Export Report
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="da-btn-primary flex items-center gap-1.5 !h-9 !px-3 !text-xs"
            >
              <Plus size={14} />
              Assign Escalation
            </motion.button>
            {/* Mobile sidebar toggle */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(true)}
              className="xl:hidden da-btn-secondary flex items-center justify-center !h-9 !w-9 !px-0"
              aria-label="Open operations panel"
            >
              <Activity size={15} />
            </motion.button>
          </div>
        </motion.div>

        {/* KPI CARDS */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } }, hidden: {} }}
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label="Key performance indicators"
        >
          {kpis.map((k) => (
            <motion.div
              key={k.label}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            >
              <KpiCard {...k} />
            </motion.div>
          ))}
        </motion.section>

        {/* OPERATIONAL STATUS BAR */}
        <motion.div {...fadeUp(0.15)}>
          <DashboardCard className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                <Zap size={12} className="text-teal-400" />
                Live Status
              </span>
              <div className="h-4 w-px bg-[var(--color-border)] hidden sm:block" />
              {opStats.map((s, i) => (
                <div key={s.label} className="flex items-center gap-2">
                  {i > 0 && <div className="h-3 w-px bg-[var(--color-border)] hidden sm:block" />}
                  <span className={`text-sm font-bold tabular-nums ${s.color}`}>{s.value}</span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">{s.label}</span>
                </div>
              ))}
            </div>
          </DashboardCard>
        </motion.div>

        {/* FILTER BAR */}
        <motion.div {...fadeUp(0.2)}>
          <DashboardCard className="p-3 sm:p-4">
            {/* Mobile toggle */}
            <div className="flex items-center justify-between sm:hidden mb-3">
              <button
                type="button"
                onClick={() => setFiltersOpen(p => !p)}
                className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]"
              >
                <Filter size={14} className="text-teal-400" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-[10px] font-bold text-teal-400">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button type="button" onClick={resetFilters} className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-red-400 transition-colors">
                  <RotateCcw size={11} /> Reset
                </button>
              )}
            </div>

            <div className={`flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center ${!filtersOpen ? "hidden sm:flex" : "flex"}`}>
              {/* Search */}
              <div
                className="flex items-center gap-2 rounded-lg border h-9 px-3 flex-1 min-w-[180px] transition-colors focus-within:border-amber-400"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", outline: "none" }}
                onFocusCapture={e => (e.currentTarget.style.outline = "2px solid rgba(251,191,36,0.7)")}
                onBlurCapture={e => (e.currentTarget.style.outline = "none")}
              >
                <Search size={13} className="shrink-0 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search ID, title, location…"
                  className="bg-transparent text-xs outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] w-full"
                  aria-label="Search escalations"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Dropdowns */}
              <FilterSelect label="Priority"    value={priority}    options={PRIORITIES}    onChange={v => setPriority(v as typeof priority)} />
              <FilterSelect label="Status"      value={status}      options={STATUSES}      onChange={v => setStatus(v as typeof status)} />
              <FilterSelect label="Category"    value={category}    options={CATEGORIES}    onChange={v => setCategory(v as typeof category)} />
              <FilterSelect label="Sub-District" value={subDistrict} options={SUB_DISTRICTS} onChange={setSubDistrict} />
              <FilterSelect label="SLA"         value={slaFilter}   options={SLA_STATUSES}  onChange={v => setSlaFilter(v as typeof slaFilter)} />

              {/* Desktop reset */}
              {activeFilterCount > 0 && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={resetFilters}
                  className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-red-400 border border-[var(--color-border)] transition-colors"
                  style={{ background: "var(--color-surface)" }}
                >
                  <RotateCcw size={12} />
                  Reset
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-500/20 text-[9px] font-bold text-teal-400">
                    {activeFilterCount}
                  </span>
                </motion.button>
              )}
            </div>
          </DashboardCard>
        </motion.div>

        {/* MAIN TABLE / CARDS */}
        <motion.div {...fadeUp(0.25)}>
          <DashboardCard className="flex flex-col p-4 sm:p-5">
            {/* Table header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)] lg:text-base">
                  Active Escalations
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {filtered.length} of {ALL.length} escalations
                  {activeFilterCount > 0 && " (filtered)"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                  Live
                </span>
              </div>
            </div>

            {/* ── Desktop Table ── */}
            <div className="hidden sm:block">
              <div className="dashboard-table-scroll" style={{ maxHeight: "32rem" }}>
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      {["Complaint ID","Category","Priority","Sub-District","Escalated On","Assigned Officer","SLA Timer","Status","Actions"]
                        .map(h => <th key={h} className="dashboard-table-th">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {filtered.length === 0 ? (
                        <tr key="empty">
                          <td colSpan={10}>
                            <EmptyState />
                          </td>
                        </tr>
                      ) : (
                        filtered.map((e, i) => (
                          <motion.tr
                            key={e.id}
                            {...stagger(i)}
                            exit={{ opacity: 0 }}
                            className="dashboard-table-row da-table-row group"
                          >
                            {/* ID */}
                            <td className="dashboard-table-td">
                              <Link href={`/district-admin/dashboard/escalation/${e.id}`} className="flex items-center gap-1.5 group/link">
                                <ShieldAlert size={13} className="shrink-0 text-teal-400" />
                                <span className="text-xs font-mono font-semibold group-hover/link:underline" style={{ color: "var(--da-teal)" }}>
                                  {e.id}
                                </span>
                              </Link>
                              <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)] max-w-[10rem] truncate pl-5">{e.title}</p>
                            </td>

                            {/* Category */}
                            <td className="dashboard-table-td whitespace-nowrap text-xs">{e.category}</td>

                            {/* Priority */}
                            <td className="dashboard-table-td">
                              <PriorityBadge priority={e.priority} />
                            </td>

                            {/* Sub-District */}
                            <td className="dashboard-table-td whitespace-nowrap">
                              <span className="flex items-center gap-1 text-xs">
                                <MapPin size={11} className="text-[var(--color-text-muted)]" />
                                {e.subDistrict}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="dashboard-table-td whitespace-nowrap text-xs text-[var(--color-text-muted)]">
                              {e.escalatedOn}
                            </td>

                            {/* Officer */}
                            <td className="dashboard-table-td whitespace-nowrap text-xs">{e.assignedTo}</td>

                            {/* SLA */}
                            <td className="dashboard-table-td">
                              <SlaChip slaStatus={e.slaStatus} slaLabel={e.slaLabel} slaHours={e.slaHours} />
                            </td>

                            {/* Status */}
                            <td className="dashboard-table-td">
                              <StatusBadge status={e.status} />
                            </td>

                            {/* Actions */}
                            <td className="dashboard-table-td">
                              <ActionButtons id={e.id} status={e.status} />
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="flex flex-col gap-2 sm:hidden">
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <EmptyState key="empty" />
                ) : (
                  filtered.map((e, i) => (
                    <motion.div key={e.id} {...stagger(i)} exit={{ opacity: 0 }}>
                      <MobileEscalationCard escalation={e} />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </DashboardCard>
        </motion.div>

      </div>{/* end main column */}

      {/* ── RIGHT SIDEBAR (desktop sticky) ── */}
      <aside className="hidden xl:flex xl:w-[280px] xl:flex-shrink-0 xl:flex-col xl:gap-3 xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
        <SidebarPanel />
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 right-0 z-50 w-80 overflow-y-auto p-4 xl:hidden"
              style={{ background: "var(--color-card)", borderLeft: "1px solid var(--color-border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">Operations Panel</span>
                <button onClick={() => setSidebarOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  <X size={18} />
                </button>
              </div>
              <SidebarPanel />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════════ */

/* ── KPI Card ── */
function KpiCard({ label, value, change, trend, variant, icon }: {
  label: string; value: string; change: string;
  trend: "up" | "down"; variant: "good" | "warn" | "danger" | "neutral"; icon: React.ReactNode;
}) {
  const glowMap = {
    good:    "border-teal-500/40 bg-teal-500/10 text-teal-400",
    warn:    "border-amber-500/40 bg-amber-500/10 text-amber-400",
    danger:  "border-red-500/40 bg-red-500/10 text-red-400",
    neutral: "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]",
  };
  return (
    <DashboardCard
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className="min-h-[100px] overflow-hidden p-3 sm:p-4"
    >
      <div className="flex h-full items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 sm:h-11 sm:w-11 ${glowMap[variant]}`}>
          {icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] truncate">{label}</p>
          <p className="text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl leading-none">{value}</p>
          <div className="flex items-center gap-1">
            {trend === "up"
              ? <TrendingUp size={11} className="shrink-0 text-red-400" />
              : <TrendingDown size={11} className="shrink-0 text-emerald-400" />}
            <span className={`text-[11px] font-semibold ${trend === "up" ? "text-red-400" : "text-emerald-400"}`}>
              {change}
            </span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

/* ── Priority Badge ── */
function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.badge} ${priority === "Critical" ? cfg.ring : ""}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${priority === "Critical" ? "animate-pulse" : ""}`} />
      {priority}
    </span>
  );
}

/* ── Status Badge ── */
function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
      <Icon size={11} />
      {status}
    </span>
  );
}

/* ── SLA Chip ── */
function SlaChip({ slaStatus, slaLabel, slaHours }: { slaStatus: SLAStatus; slaLabel: string; slaHours: number }) {
  const cfg = SLA_CONFIG[slaStatus];
  if (slaLabel === "Resolved" || slaLabel === "Closed") {
    return <span className="text-xs text-[var(--color-text-muted)]">—</span>;
  }
  const isBreached = slaStatus === "Breached";
  const pct = isBreached ? 100 : slaHours <= 0 ? 100 : Math.max(0, Math.min(100, (1 - slaHours / 24) * 100));
  return (
    <div className={`flex min-w-[80px] flex-col gap-1 rounded-lg px-2 py-1.5 ${cfg.bg}`}>
      <div className="flex items-center gap-1">
        <Timer size={10} className={cfg.text} />
        <span className={`text-[10px] font-bold ${cfg.text} ${isBreached ? "animate-pulse" : ""}`}>
          {slaLabel}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── Action Buttons ── */
function ActionButtons({ id, status }: { id: string; status: Status }) {
  const isResolved = status === "Resolved" || status === "Closed";
  return (
    <div className="flex items-center gap-1">
      <Link href={`/district-admin/dashboard/escalation/${id}`}>
        <motion.span
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
          title="View Details"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 transition-colors"
        >
          <Eye size={13} />
        </motion.span>
      </Link>
      {!isResolved && (
        <>
          <motion.button
            type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
            title="Assign Officer"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 transition-colors"
          >
            <UserCheck size={13} />
          </motion.button>
          <motion.button
            type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
            title="Escalate Further"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 transition-colors"
          >
            <ArrowUpRight size={13} />
          </motion.button>
          <motion.button
            type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
            title="Mark Resolved"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 transition-colors"
          >
            <CheckCircle2 size={13} />
          </motion.button>
        </>
      )}
      <motion.button
        type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
        title="More Options"
        className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 transition-colors"
        style={{ background: "var(--color-surface)" }}
      >
        <MoreHorizontal size={13} />
      </motion.button>
    </div>
  );
}

/* ── Mobile Escalation Card ── */
function MobileEscalationCard({ escalation: e }: { escalation: Escalation }) {
  return (
    <DashboardCard className="p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert size={14} className="shrink-0 text-teal-400" />
          <Link href={`/district-admin/dashboard/escalation/${e.id}`}>
            <span className="text-xs font-mono font-semibold" style={{ color: "var(--da-teal)" }}>{e.id}</span>
          </Link>
          <PriorityBadge priority={e.priority} />
        </div>
        <StatusBadge status={e.status} />
      </div>

      <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2 line-clamp-2">{e.title}</p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
        {[
          { icon: MapPin,    val: e.subDistrict },
          { icon: Activity,  val: e.category    },
          { icon: UserCheck, val: e.assignedTo  },
          { icon: Clock,     val: e.escalatedOn },
        ].map(({ icon: Icon, val }) => (
          <span key={val} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            <Icon size={11} className="shrink-0 text-[var(--color-text-muted)]" />
            {val}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <SlaChip slaStatus={e.slaStatus} slaLabel={e.slaLabel} slaHours={e.slaHours} />
        <ActionButtons id={e.id} status={e.status} />
      </div>
    </DashboardCard>
  );
}

/* ── Empty State ── */
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border"
        style={{ background: "color-mix(in srgb, var(--da-teal) 8%, transparent)", borderColor: "var(--da-border-teal)" }}
      >
        <Inbox size={28} className="text-teal-400" />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
        No Active Escalations
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] max-w-xs">
        All district complaints are operating within SLA limits.
      </p>
    </motion.div>
  );
}

/* ── Right Sidebar Panel ── */
function SidebarPanel() {
  const raw = filterByDistrictScope(
    useEscalationStore((s) => s.escalations),
    (e) => e.district,
    (e) => e.state
  );
  // Deduplicate by ID — guard against store/seed collision after hot reload
  const seen = new Set<string>();
  const ALL = raw.filter((e) => { if (seen.has(e.id)) return false; seen.add(e.id); return true; });
  const critical = ALL.filter(e => e.priority === "Critical" && e.status !== "Resolved" && e.status !== "Closed");
  const slaRisk  = ALL.filter(e => e.slaStatus === "At Risk").length;
  const breached = ALL.filter(e => e.slaStatus === "Breached").length;
  const onTrack  = ALL.filter(e => e.slaStatus === "On Track").length;

  const recentActivity = [
    { title: "ESC-4030 escalated to priority",  time: "3m ago",  color: "text-red-400",    icon: ArrowUpRight },
    { title: "ESC-4026 marked resolved",         time: "12m ago", color: "text-teal-400",   icon: CheckCircle2 },
    { title: "ESC-4022 assigned to A. Singh",    time: "25m ago", color: "text-blue-400",   icon: UserCheck    },
    { title: "SLA breach — ESC-4024",            time: "1h ago",  color: "text-amber-400",  icon: Timer        },
    { title: "New escalation — ESC-4032 raised", time: "1h ago",  color: "text-purple-400", icon: ShieldAlert  },
  ];

  return (
    <div className="flex flex-col gap-3">

      {/* ── SLA Alerts — 3-col horizontal ── */}
      <DashboardCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Timer size={13} className="text-amber-400 shrink-0" />
          <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">SLA Alerts</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Breached", value: breached, color: "text-red-400",   border: "border-red-500/25",  bg: "bg-red-500/8"   },
            { label: "At Risk",  value: slaRisk,  color: "text-amber-400", border: "border-amber-500/25",bg: "bg-amber-500/8" },
            { label: "On Track", value: onTrack,  color: "text-teal-400",  border: "border-teal-500/25", bg: "bg-teal-500/8"  },
          ].map(s => (
            <div
              key={s.label}
              className={`flex flex-col items-center justify-center rounded-xl border py-2.5 px-1 ${s.border} ${s.bg}`}
            >
              <span className={`text-xl font-bold tabular-nums leading-none ${s.color}`}>{s.value}</span>
              <span className="mt-1 text-[10px] font-medium text-[var(--color-text-muted)] text-center leading-tight">{s.label}</span>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* ── Critical Escalations — no scroll, compact rows ── */}
      <DashboardCard className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <ShieldAlert size={13} className="text-red-400 shrink-0" />
            <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">Critical</h3>
          </div>
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/15 px-1.5 text-[10px] font-bold text-red-400">
            {critical.length}
          </span>
        </div>

        <div className="flex flex-col divide-y divide-[var(--color-border)] overflow-y-auto" style={{ maxHeight: "16rem", scrollbarWidth: "thin", scrollbarColor: "color-mix(in srgb, #ef4444 25%, transparent) transparent" }}>
          {critical.map((e, i) => (
            <Link key={e.id} href={`/district-admin/dashboard/escalation/${e.id}`}>
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: 2 }}
                className="flex items-center gap-2.5 py-2 transition-colors hover:bg-red-500/4 rounded-lg px-1 -mx-1 cursor-pointer group"
              >
                {/* Pulse dot */}
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400 animate-pulse" />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-mono font-bold text-red-400">{e.id}</span>
                    <SlaChip slaStatus={e.slaStatus} slaLabel={e.slaLabel} slaHours={e.slaHours} />
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] truncate mt-0.5 max-w-[160px]">
                    {e.title}
                  </p>
                </div>

                <ChevronRight size={11} className="shrink-0 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </Link>
          ))}
        </div>
      </DashboardCard>

      {/* ── Recent Activity ── */}
      <DashboardCard className="p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <Activity size={13} className="text-teal-400 shrink-0" />
          <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">Recent Activity</h3>
        </div>

        <div className="flex flex-col overflow-y-auto" style={{ maxHeight: "14rem", scrollbarWidth: "thin", scrollbarColor: "color-mix(in srgb, var(--da-teal) 25%, transparent) transparent" }}>
          {recentActivity.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                className="flex items-start gap-2.5 py-2 border-b border-[var(--color-border)] last:border-0"
              >
                {/* Icon circle */}
                <div
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <Icon size={11} className={a.color} />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-[var(--color-text-secondary)] leading-snug">
                    {a.title}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{a.time}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </DashboardCard>

    </div>
  );
}

/* ── Filter Select ── */
function FilterSelect({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const isActive = value !== "All" && value !== "";
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label={label}
        className="h-9 appearance-none rounded-lg border pl-3 pr-8 text-xs outline-none cursor-pointer transition-colors"
        style={{
          borderColor: isActive ? "var(--da-border-teal)" : "var(--color-border)",
          background:  isActive ? "color-mix(in srgb, var(--da-teal) 8%, var(--color-surface))" : "var(--color-surface)",
          color: isActive ? "var(--da-teal)" : "var(--color-text-secondary)",
        }}
      >
        {options.map(o => (
          <option key={o} value={o} style={{ background: "var(--color-card)", color: "var(--color-text-primary)" }}>
            {o === "All" ? `All ${label}` : o}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
    </div>
  );
}


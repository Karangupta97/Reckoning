"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileWarning, ClipboardCheck,
  MapPinned, UserCircle, X, Zap, MapPin,
  TrendingUp, ShieldCheck, Clock, Trophy, Award, IndianRupee, MessageSquare,
} from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { subDistrictSidebarSubtitle, SUB_DISTRICT_CONFIG } from "@/lib/sub-district-config";
import { useSubDistrictDashboardMetrics } from "@/hooks/use-dashboard-metrics";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  color?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard",   icon: <LayoutDashboard size={18} />, href: "/sub-district-admin/dashboard",            color: "text-[var(--color-text-muted)]" },
  { label: "Complaints",  icon: <FileWarning size={18} />,     href: "/sub-district-admin/dashboard/complaints", color: "text-[var(--color-text-muted)]" },
  { label: "Tickets",     icon: <ClipboardCheck size={18} />,  href: "/sub-district-admin/dashboard/tickets",    color: "text-[var(--color-text-muted)]" },
  { label: "Clarifications", icon: <MessageSquare size={18} />, href: "/sub-district-admin/dashboard/clarifications", color: "text-[var(--color-text-muted)]" },
  { label: "Budget Status",icon: <IndianRupee size={18} />,    href: "/sub-district-admin/dashboard/budget",     color: "text-[var(--color-text-muted)]" },
  { label: "Map View",    icon: <MapPinned size={18} />,       href: "/sub-district-admin/dashboard/map",        color: "text-[var(--color-text-muted)]" },
  { label: "Leaderboard", icon: <Trophy size={18} />,          href: "/sub-district-admin/dashboard/leaderboard",color: "text-[var(--color-text-muted)]" },
  { label: "Achievements",icon: <Award size={18} />,           href: "/sub-district-admin/dashboard/achievements",color: "text-[var(--color-text-muted)]" },
  { label: "Profile",     icon: <UserCircle size={18} />,      href: "/sub-district-admin/dashboard/profile",    color: "text-[var(--color-text-muted)]" },
];

interface SidebarProps { activePath?: string; }

const SIDEBAR_WIDTH = 250;
const sidebarShell = "bg-[var(--color-card)] border-[var(--color-border)]";
const navScrollClass = [
  "flex-1 overflow-y-auto px-3 py-3 space-y-0.5",
  "[scrollbar-width:thin]",
  "[scrollbar-color:rgba(255,255,255,0.12)_transparent]",
  "[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10",
].join(" ");

export default function SubDistrictAdminSidebar({ activePath: activePathProp }: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const activePath = activePathProp ?? pathname ?? "/sub-district-admin/dashboard";
  const metrics = useSubDistrictDashboardMetrics();
  const [isOpen,  setIsOpen]  = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isActive = useCallback((item: NavItem) => {
    // Dashboard: exact match only — prevents /dashboard highlighting on all sub-pages
    if (item.href === "/sub-district-admin/dashboard") {
      return activePath === item.href;
    }
    // Other items: exact or sub-path match (e.g. /complaints/[id] highlights Complaints)
    return activePath === item.href || activePath.startsWith(item.href + "/");
  }, [activePath]);

  const sidebarContent = useMemo(() => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3.5 px-4 py-4">
        <LogoMark size={36} className="shrink-0" />
        <div className="min-w-0 flex flex-col gap-0.5">
          <span className="text-sm font-bold tracking-wide text-[var(--color-text-primary)] truncate">RECKONING</span>
          <span className="flex items-center gap-1 text-[10px] leading-snug text-amber-400/80 line-clamp-1 font-medium truncate">
            <MapPin size={8} className="shrink-0" />
            {subDistrictSidebarSubtitle}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className={navScrollClass} aria-label="Sub-district admin navigation">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <motion.button
              key={item.label}
              onClick={() => router.push(item.href)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] transition-all duration-200 ${
                active ? "admin-nav-active" : "admin-nav-item"
              }`}
            >
              <span className={`shrink-0 ${active ? "admin-nav-active-icon" : "admin-nav-item-icon"}`}>
                {item.icon}
              </span>
              <span className="flex-1 text-left truncate">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Status widget — mini operational dashboard */}
      <div className="px-3 pb-4 pt-2 border-t border-[var(--color-border)]">
        <div className="rounded-xl border border-amber-500/15 overflow-hidden" style={{ background: "color-mix(in srgb, var(--sda-amber) 4%, var(--color-surface))" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
              </span>
              <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">Operations Active</span>
            </div>
            <span className="text-[9px] text-[var(--color-text-muted)]">2m ago</span>
          </div>
          {/* Zone label */}
          <div className="px-3 pb-1.5">
            <span className="text-[10px] text-[var(--color-text-muted)]">Zone: </span>
            <span className="text-[10px] font-medium" style={{ color: "var(--sda-amber)" }}>{SUB_DISTRICT_CONFIG.name}</span>
          </div>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-px border-t border-amber-500/10">
            {[
              { label: "SLA Health",  value: `${metrics.zoneHealth}%`,  icon: ShieldCheck, color: "text-green-400" },
              { label: "Open Cases",  value: String(metrics.open), icon: FileWarning, color: "text-amber-400" },
              { label: "Avg Resolve", value: `${metrics.resolved > 0 ? "2.4" : "0"}d`, icon: Clock, color: "text-blue-400" },
              { label: "Resolved", value: String(metrics.resolved), icon: TrendingUp, color: "text-teal-400" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-0.5 px-2.5 py-2" style={{ background: "color-mix(in srgb, var(--color-card) 50%, transparent)" }}>
                <div className="flex items-center gap-1">
                  <s.icon size={10} className={s.color} />
                  <span className={`text-[11px] font-bold tabular-nums ${s.color}`}>{s.value}</span>
                </div>
                <span className="text-[9px] text-[var(--color-text-muted)] leading-tight">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ), [isActive, router, metrics]);

  return (
    <>
      {isMobile && (
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors lg:hidden"
          aria-label="Open navigation"
        >
          <Zap size={20} />
        </motion.button>
      )}

      <AnimatePresence>
        {isMobile && isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" />
            <motion.div
              initial={{ x: -SIDEBAR_WIDTH }} animate={{ x: 0 }} exit={{ x: -SIDEBAR_WIDTH }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{ width: SIDEBAR_WIDTH }}
              className={`fixed inset-y-0 left-0 z-50 border-r lg:hidden ${sidebarShell}`}
            >
              <button onClick={() => setIsOpen(false)}
                className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside style={{ width: SIDEBAR_WIDTH }}
        className={`hidden lg:flex lg:flex-col lg:shrink-0 border-r h-screen sticky top-0 ${sidebarShell}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

"use client";

import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Map,
  Bell,
  Users,
  Award,
  Trophy,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

import { LogoMark } from "@/components/ui/Logo";
import { useSidebarStore } from "@/store/sidebarStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatCountry(country?: string): string {
  if (!country) return "Citizen";
  return country
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const NAV_ITEMS: Array<{
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  highlight?: boolean;
  exactMatch?: boolean;
}> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", exactMatch: true },
  { id: "reportHazard", label: "Report Hazard", icon: Plus, href: "/dashboard/report", highlight: true },
    { id: "reports", label: "My Reports", icon: FileText, href: "/dashboard/my-reports" },
    { id: "map", label: "Safety Map", icon: Map, href: "/dashboard/map" },
    { id: "notifications", label: "Notifications", icon: Bell, href: "/dashboard/notifications" },
    { id: "community", label: "Community", icon: Users, href: "/dashboard/community" },
    { id: "achievements", label: "Achievements", icon: Trophy, href: "/dashboard/achievements" },
    { id: "leaderboard", label: "Leaderboard", icon: Award, href: "/dashboard/leaderboard" },
    { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
    { id: "help", label: "Help Center", icon: HelpCircle, href: "/dashboard/help" },
  ];

export function Sidebar() {
  const { expanded, toggle } = useSidebarStore();
  const { notificationCount } = useDashboardStore();
  const { logout, isLoading: isLoggingOut } = useAuth();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const pathname = usePathname();

  // Strip locale prefix if present (e.g. /en/dashboard → /dashboard)
  const normalizedPath = pathname.replace(/^\/[a-z]{2}(?=\/)/, "");

  return (
    <motion.aside
      initial={false}
      animate={{ width: expanded ? 280 : 80 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="hidden lg:flex flex-col h-screen sticky top-0 bg-[var(--color-card)] border-r border-[var(--color-border)] z-30 overflow-hidden"
    >
      {/* Logo + Brand */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <LogoMark size={36} />
        {expanded && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            <span className="font-semibold text-base tracking-tight text-[var(--color-text-primary)]">
              RECKONING
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Citizen Dashboard
            </span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          // Derive active state purely from pathname
          const isReportRoute =
            normalizedPath === "/dashboard/report" ||
            normalizedPath.startsWith("/dashboard/report/");
          const isActive = item.id === "reportHazard"
            ? isReportRoute
            : item.exactMatch
            ? normalizedPath === item.href
            : normalizedPath === item.href || normalizedPath.startsWith(item.href + "/");
          const Icon = item.icon;
          const showBadge = item.id === "notifications" && notificationCount > 0;
          const isHighlight = item.highlight;

          return (
            <button
              key={item.id}
              onClick={() => {
                router.push(item.href);
              }}
              className={`group relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${isHighlight && !isActive
                  ? "bg-[var(--color-amber)] text-[#1c2b3a] font-semibold hover:brightness-105"
                  : isActive
                    ? "bg-[var(--color-text-primary)] text-[var(--color-card)] shadow-[var(--shadow-neu)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                }`}
              title={!expanded ? item.label : undefined}
            >
              <span className="relative shrink-0">
                <Icon size={20} strokeWidth={isHighlight ? 2.2 : 1.8} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </span>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pb-4 space-y-1">
        {expanded && user && (
          <div className="mb-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-amber)] to-orange-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {getInitials(user.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                  {user.fullName}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                  {formatCountry(user.country)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-[var(--color-border)] mb-3" />

        <button
          onClick={() => {
            void logout();
          }}
          disabled={isLoggingOut}
          className="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-danger)] transition-all duration-200"
          title={!expanded ? "Logout" : undefined}
        >
          <LogOut size={20} strokeWidth={1.8} />
          {expanded && (
            <span className="text-sm font-medium">{isLoggingOut ? "Signing out..." : "Logout"}</span>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-all duration-200"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? (
            <ChevronLeft size={18} strokeWidth={2} />
          ) : (
            <ChevronRight size={18} strokeWidth={2} />
          )}
          {expanded && (
            <span className="text-xs font-medium">Collapse</span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
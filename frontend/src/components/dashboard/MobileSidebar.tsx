"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Map,
  Bell,
  Users,
  Trophy,
  User,
  Award,
  Settings,
  HelpCircle,
  LogOut,
  X,
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
  exactMatch?: boolean;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", exactMatch: true },
  { id: "reports", label: "My Reports", icon: FileText, href: "/dashboard/my-reports" },
  { id: "map", label: "Safety Map", icon: Map, href: "/dashboard/safety-map" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/dashboard/notifications" },
  { id: "community", label: "Community", icon: Users, href: "/dashboard/community" },
  { id: "achievements", label: "Achievements", icon: Trophy, href: "/dashboard/achievements" },
  { id: "leaderboard", label: "Leaderboard", icon: Award, href: "/dashboard/leaderboard" },
  { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
  { id: "help", label: "Help Center", icon: HelpCircle, href: "/dashboard/help" },
];

export function MobileSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebarStore();
  const { notificationCount } = useDashboardStore();
  const { logout, isLoading: isLoggingOut } = useAuth();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const pathname = usePathname();

  // Strip locale prefix if present (e.g. /en/dashboard → /dashboard)
  const normalizedPath = pathname.replace(/^\/[a-z]{2}(?=\/)/, "");

  return (
    <AnimatePresence>
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-[var(--color-card)] border-r border-[var(--color-border)] flex flex-col lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <LogoMark size={32} />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm tracking-tight text-[var(--color-text-primary)]">
                    RECKONING
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    Citizen Dashboard
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {user && (
              <div className="px-5 pb-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-amber)] to-orange-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {getInitials(user.fullName)}
                  </div>
                  <div className="min-w-0">
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

            {/* Nav */}
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                // Derive active state purely from pathname
                const isActive = item.exactMatch
                  ? normalizedPath === item.href
                  : normalizedPath === item.href || normalizedPath.startsWith(item.href + "/");
                const Icon = item.icon;
                const showBadge = item.id === "notifications" && notificationCount > 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      router.push(item.href);
                      setMobileOpen(false);
                    }}
                    className={`group relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                      isActive
                        ? "bg-[var(--color-text-primary)] text-[var(--color-card)] shadow-[var(--shadow-neu)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    <span className="relative shrink-0">
                      <Icon size={20} strokeWidth={1.8} />
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold flex items-center justify-center">
                          {notificationCount}
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="px-3 pb-6">
              <div className="border-t border-[var(--color-border)] mb-3" />
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-danger)] transition-all duration-200 disabled:opacity-50"
              >
                <LogOut size={20} strokeWidth={1.8} className={isLoggingOut ? "animate-pulse" : ""} />
                <span className="text-sm font-medium">
                  {isLoggingOut ? "Signing out…" : "Logout"}
                </span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

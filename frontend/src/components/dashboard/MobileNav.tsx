"use client";

import {
  LayoutDashboard,
  FileText,
  Map,
  Bell,
  User,
} from "lucide-react";
import { useDashboardStore, type NavItem } from "@/store/dashboardStore";

const MOBILE_NAV: Array<{ id: NavItem; label: string; icon: React.ElementType }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "map", label: "Map", icon: Map },
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const { activeNav, setActiveNav, notificationCount } = useDashboardStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[var(--color-card)] border-t border-[var(--color-border)] px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2">
        {MOBILE_NAV.map((item) => {
          const isActive = activeNav === item.id;
          const Icon = item.icon;
          const showBadge = item.id === "notifications" && notificationCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                isActive
                  ? "text-[var(--color-amber)]"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[var(--color-danger)] text-white text-[8px] font-bold flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[var(--color-amber)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

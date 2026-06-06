"use client";

import { Search, Plus, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardLanguageSwitcher } from "@/components/dashboard/DashboardLanguageSwitcher";
import { NotificationDropdown } from "@/components/dashboard/NotificationDropdown";
import { InstallPWAButton } from "@/components/pwa/InstallPWAButton";
import { useSidebarStore } from "@/store/sidebarStore";

export function TopHeader() {
  const { toggleMobile } = useSidebarStore();
  const t = useTranslations("dashboard");
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 bg-[var(--color-card)] border-b border-[var(--color-border)] px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16 gap-4">
        {/* Mobile menu + Search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={toggleMobile}
            className="lg:hidden shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>

          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="text"
              placeholder="Search reports, locations..."
              className="w-full pl-9 pr-12 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)] transition-shadow"
            />
            <kbd className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--color-card)] border border-[var(--color-border)] text-[10px] font-mono text-[var(--color-text-muted)]">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Install App */}
          <div className="hidden md:block">
            <InstallPWAButton variant="compact" />
          </div>

          {/* Language */}
          <div className="hidden sm:block">
            <DashboardLanguageSwitcher />
          </div>

          {/* Theme toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Profile */}
          <button className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-amber)] to-orange-500 flex items-center justify-center text-white text-xs font-bold">
              KP
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-semibold text-[var(--color-text-primary)] leading-tight">
                Karan Patel
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] leading-tight">
                Mumbai, India
              </span>
            </div>
          </button>

          {/* Quick report */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/dashboard/report")}
            className="btn-amber flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">{t("quickActions.reportHazard")}</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}

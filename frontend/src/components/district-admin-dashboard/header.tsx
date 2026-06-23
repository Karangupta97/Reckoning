"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Settings,
  Calendar,
  ChevronDown,
  User,
  Menu,
  LogOut,
  HelpCircle,
  Shield,
  Sliders,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { districtLabel, districtLocationLabel } from "@/lib/district-config";
import { useAdminDateRange } from "@/hooks/useAdminDateRange";

interface HeaderProps {
  onMenuToggle?: () => void;
  title?: string;
  subtitle?: string;
}

const DATE_OPTIONS = ["Today", "This Week", "This Month", "This Quarter", "This Year"] as const;

const SETTINGS_ITEMS: {
  label: string;
  icon: typeof User;
  href?: string;
  danger?: boolean;
}[] = [
  { label: "Profile Settings",  icon: User,       href: "/district-admin/profile?tab=profile"      },
  { label: "District Settings", icon: Sliders,    href: "/district-admin/settings"                  },
  { label: "Security",          icon: Shield,     href: "/district-admin/profile?tab=security"      },
  { label: "Notifications",     icon: Settings,   href: "/district-admin/profile?tab=notifications" },
  { label: "Help Center",       icon: HelpCircle, href: "/district-admin/profile?tab=preferences"   },
  { label: "Logout",            icon: LogOut,     danger: true                                      },
];

const dropdownMotion = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

export default function DistrictAdminHeader({
  onMenuToggle,
  title = districtLabel,
  subtitle = "Monitoring • Escalations • SLA Compliance",
}: HeaderProps) {
  const router = useRouter();
  const adminLogout = useAdminAuthStore((s) => s.logout);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { period: selectedDate, setPeriod: setSelectedDate } = useAdminDateRange();
  const [showSettings, setShowSettings] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const closeAll = useCallback(() => {
    setShowSettings(false);
    setShowDateDropdown(false);
  }, []);

  const logout = useCallback(async () => {
    await adminLogout();
    router.push("/admin/login");
  }, [adminLogout, router]);

  const toggleSettings = useCallback(() => {
    setShowSettings((p) => !p);
    setShowDateDropdown(false);
  }, []);

  const toggleDate = useCallback(() => {
    setShowDateDropdown((p) => !p);
    setShowSettings(false);
  }, []);

  return (
    <header className="da-header-container">
      {/* Left */}
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        {isMobile && onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="da-btn-icon lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-primary truncate text-base font-bold leading-tight lg:text-lg">
            {title}
          </h1>
          <p className="text-muted mt-0.5 truncate text-xs">{subtitle}</p>
        </div>
      </div>

      {/* Search */}
      <label className="da-header-search order-last w-full min-w-0 lg:order-none">
        <Search size={16} className="text-muted shrink-0" aria-hidden />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search complaints, escalations, sub-districts…"
          className="text-primary"
          aria-label="Search district operations"
        />
      </label>

      {/* Right actions */}
      <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-3 sm:flex-nowrap">
        {/* Date range */}
        <div className="relative">
          <button
            type="button"
            onClick={toggleDate}
            className={`da-header-button ${showDateDropdown ? "da-header-button-active" : ""}`}
            aria-expanded={showDateDropdown}
            aria-haspopup="listbox"
          >
            <Calendar size={14} className="text-muted" aria-hidden />
            <span>{selectedDate}</span>
            <ChevronDown size={14} className="text-muted" aria-hidden />
          </button>

          <AnimatePresence>
            {showDateDropdown && (
              <motion.div
                {...dropdownMotion}
                className="dashboard-panel glass-panel absolute right-0 top-[calc(100%+8px)] z-50 w-48 py-1"
                role="listbox"
              >
                {DATE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    role="option"
                    aria-selected={selectedDate === opt}
                    onClick={() => {
                      setSelectedDate(opt);
                      setShowDateDropdown(false);
                    }}
                    className={`da-dropdown-item ${selectedDate === opt ? "da-dropdown-item-active" : ""}`}
                  >
                    {opt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AdminNotificationBell portal="district" />

        <ThemeToggle />

        {/* Settings */}
        <div className="relative">
          <button
            type="button"
            onClick={toggleSettings}
            className="da-btn-icon"
            aria-expanded={showSettings}
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                {...dropdownMotion}
                className="dashboard-panel glass-panel absolute right-0 top-[calc(100%+8px)] z-50 w-52 py-1"
              >
                {SETTINGS_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      closeAll();
                      if (item.danger) {
                        void logout();
                      } else if (item.href) {
                        router.push(item.href);
                      }
                    }}
                    className={`da-dropdown-item ${item.danger ? "da-dropdown-item-danger" : ""}`}
                  >
                    <item.icon size={14} aria-hidden />
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div className="da-card-badge flex min-w-0">
          <div className="da-avatar relative shrink-0">
            <User size={16} aria-hidden />
            <span className="da-online-indicator absolute -bottom-0.5 -right-0.5" aria-label="Online" />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-primary truncate text-xs font-semibold leading-tight">
              District Infrastructure Commissioner
            </p>
            <p className="text-muted truncate text-[10px] leading-tight">
              {districtLocationLabel}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

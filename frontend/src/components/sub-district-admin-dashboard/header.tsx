"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, Settings, Calendar, ChevronDown,
  User, Menu, LogOut, HelpCircle, Shield, UserCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { useAdminDateRange } from "@/hooks/useAdminDateRange";
import { useSubDistrictInfo } from "@/hooks/useSubDistrictInfo";

interface HeaderProps {
  onMenuToggle?: () => void;
  title?: string;
  subtitle?: string;
}

const DATE_OPTIONS = ["Today", "This Week", "This Month", "This Quarter", "This Year"] as const;

const SETTINGS_ITEMS = [
  { label: "Profile",       icon: UserCircle, href: "/sub-district-admin/dashboard/profile",                    danger: false },
  { label: "Security",      icon: Shield,     href: "/sub-district-admin/dashboard/settings?tab=security",      danger: false },
  { label: "Notifications", icon: Bell,       href: "/sub-district-admin/dashboard/settings?tab=notifications", danger: false },
  { label: "Preferences",   icon: Settings,   href: "/sub-district-admin/dashboard/settings?tab=appearance",    danger: false },
  { label: "Help Center",   icon: HelpCircle, href: "/sub-district-admin/dashboard/settings",                   danger: false },
  { label: "Logout",        icon: LogOut,     href: "/",                                                          danger: true  },
] as const;

const dropdownMotion = {
  initial: { opacity: 0, y: -8, scale: 0.97 },
  animate: { opacity: 1, y: 0,  scale: 1    },
  exit:    { opacity: 0, y: -8, scale: 0.97 },
  transition: { duration: 0.15 },
};

/** Close dropdown on outside click or Escape key. */
function useDropdownClose(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleKey   = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);
  return ref;
}

export default function SubDistrictAdminHeader({
  onMenuToggle,
  title,
  subtitle = "Field Operations • Complaint Resolution • SLA Management",
}: HeaderProps) {
  const router = useRouter();
  const adminLogout = useAdminAuthStore((s) => s.logout);
  const { subDistrictLabel, subDistrictLocationLabel } = useSubDistrictInfo();
  const resolvedTitle = title ?? subDistrictLabel;

  const [isMobile,         setIsMobile]         = useState(false);
  const [searchQuery,      setSearchQuery]       = useState("");
  const { period: selectedDate, setPeriod: setSelectedDate } = useAdminDateRange();
  const [showSettings,     setShowSettings]      = useState(false);
  const [showDateDropdown, setShowDateDropdown]  = useState(false);
  const [showProfile,      setShowProfile]       = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const closeSettings = useCallback(() => setShowSettings(false), []);
  const closeDateDropdown = useCallback(() => setShowDateDropdown(false), []);
  const closeProfile = useCallback(() => setShowProfile(false), []);

  const logout = useCallback(async () => {
    await adminLogout();
    router.push("/admin/login");
  }, [adminLogout, router]);

  const settingsRef = useDropdownClose(closeSettings);
  const dateRef     = useDropdownClose(closeDateDropdown);
  const profileRef  = useDropdownClose(closeProfile);

  return (
    <header className="sda-header-container">
      {/* Left — title + live indicator */}
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        {isMobile && onMenuToggle && (
          <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onMenuToggle}
            className="sda-btn-icon lg:hidden" aria-label="Open navigation">
            <Menu size={18} />
          </motion.button>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-primary truncate text-base font-bold leading-tight lg:text-lg">{resolvedTitle}</h1>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-green-500/20 bg-green-500/8">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
              </span>
              <span className="text-[10px] font-medium text-green-400 whitespace-nowrap">All Systems Operational</span>
            </div>
          </div>
          <p className="text-muted mt-0.5 truncate text-xs">{subtitle}</p>
        </div>
      </div>

      {/* Search */}
      <label className="sda-header-search order-last w-full min-w-0 lg:order-none">
        <Search size={16} className="text-muted shrink-0" aria-hidden />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search complaints, tickets, officers..."
          className="text-primary bg-transparent outline-none border-none flex-1 min-w-0 text-[13px]"
          aria-label="Search sub-district operations"
        />
      </label>

      {/* Right controls */}
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">

        {/* Date range */}
        <div className="relative hidden sm:block" ref={dateRef}>
          <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setShowDateDropdown((p) => !p); setShowSettings(false); setShowProfile(false); }}
            className={`sda-header-button ${showDateDropdown ? "sda-header-button-active" : ""}`}
            aria-expanded={showDateDropdown} aria-haspopup="listbox">
            <Calendar size={14} className="text-muted" aria-hidden />
            <span className="hidden md:inline">{selectedDate}</span>
            <ChevronDown size={14} className="text-muted" aria-hidden />
          </motion.button>
          <AnimatePresence>
            {showDateDropdown && (
              <motion.div {...dropdownMotion}
                className="dashboard-panel glass-panel absolute right-0 top-[calc(100%+8px)] z-50 w-48 py-1"
                role="listbox">
                {DATE_OPTIONS.map((opt) => (
                  <button key={opt} type="button" role="option" aria-selected={selectedDate === opt}
                    onClick={() => { setSelectedDate(opt); setShowDateDropdown(false); }}
                    className={`sda-dropdown-item ${selectedDate === opt ? "sda-dropdown-item-active" : ""}`}>
                    {opt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AdminNotificationBell portal="sub-district" />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Settings */}
        <div className="relative" ref={settingsRef}>
          <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setShowSettings((p) => !p); setShowDateDropdown(false); setShowProfile(false); }}
            className="sda-btn-icon" aria-expanded={showSettings} aria-label="Settings">
            <Settings size={18} />
          </motion.button>
          <AnimatePresence>
            {showSettings && (
              <motion.div {...dropdownMotion}
                className="dashboard-panel glass-panel absolute right-0 top-[calc(100%+8px)] z-50 w-52 py-1 overflow-hidden">
                {SETTINGS_ITEMS.map((item) => (
                  <button key={item.label} type="button"
                    onClick={() => {
                      setShowSettings(false);
                      if (item.danger) { void logout(); return; }
                      router.push(item.href);
                    }}
                    className={`sda-dropdown-item w-full ${item.danger ? "sda-dropdown-item-danger" : ""}`}>
                    <item.icon size={14} aria-hidden />
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar / profile */}
        <div className="relative" ref={profileRef}>
          <button type="button"
            onClick={() => { setShowProfile((p) => !p); setShowSettings(false); setShowDateDropdown(false); }}
            className="sda-card-badge flex min-w-0 items-center gap-2 cursor-pointer"
            aria-expanded={showProfile} aria-label="User menu">
            <div className="sda-avatar relative shrink-0">
              <User size={16} aria-hidden />
              <span className="sda-online-indicator absolute -bottom-0.5 -right-0.5" aria-label="Online" />
            </div>
            <div className="min-w-0 text-left hidden sm:block">
              <p className="text-primary truncate text-xs font-semibold leading-tight">Sub-District Admin</p>
              <p className="text-muted truncate text-[10px] leading-tight">{subDistrictLocationLabel}</p>
            </div>
          </button>
          <AnimatePresence>
            {showProfile && (
              <motion.div {...dropdownMotion}
                className="dashboard-panel glass-panel absolute right-0 top-[calc(100%+8px)] z-50 w-48 py-1 overflow-hidden">
                <button type="button"
                  onClick={() => { setShowProfile(false); router.push("/sub-district-admin/dashboard/profile"); }}
                  className="sda-dropdown-item w-full">
                  <UserCircle size={14} /> View Profile
                </button>
                <button type="button"
                  onClick={() => { setShowProfile(false); router.push("/sub-district-admin/dashboard/profile?tab=security"); }}
                  className="sda-dropdown-item w-full">
                  <Settings size={14} /> Account Settings
                </button>
                <div className="my-1 border-t border-[var(--color-border)]" />
                <button type="button"
                  onClick={() => { setShowProfile(false); void logout(); }}
                  className="sda-dropdown-item sda-dropdown-item-danger w-full">
                  <LogOut size={14} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

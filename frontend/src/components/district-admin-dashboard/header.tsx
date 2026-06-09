"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
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
import { useAuth } from "@/hooks/useAuth";
import { districtLabel, districtLocationLabel } from "@/lib/district-config";

interface HeaderProps {
  onMenuToggle?: () => void;
  title?: string;
  subtitle?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  timestamp: string;
  unread: boolean;
}

const DATE_OPTIONS = [
  "Today",
  "This Week",
  "This Month",
  "This Quarter",
] as const;

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "New escalation: Pothole — Ward 12",
    timestamp: "3 min ago",
    unread: true,
  },
  {
    id: "2",
    title: "SLA breach warning — Mehrauli sub-district",
    timestamp: "22 min ago",
    unread: true,
  },
  {
    id: "3",
    title: "5 complaints pending review",
    timestamp: "45 min ago",
    unread: true,
  },
  {
    id: "4",
    title: "Sub-district officer login detected",
    timestamp: "1 hr ago",
    unread: false,
  },
  {
    id: "5",
    title: "Monthly district report generated",
    timestamp: "3 hr ago",
    unread: false,
  },
];

const SETTINGS_ITEMS: {
  label: string;
  icon: typeof User;
  href?: string;
  danger?: boolean;
}[] = [
  { label: "Profile Settings",  icon: User,       href: "/district-admin/profile?tab=profile"  },
  { label: "District Settings", icon: Sliders,    href: "/district-admin/settings"              },
  { label: "Security",          icon: Shield,     href: "/district-admin/profile?tab=security"  },
  { label: "Notifications",     icon: Settings,   href: "/district-admin/profile?tab=notifications" },
  { label: "Help Center",       icon: HelpCircle, href: "/district-admin/profile?tab=preferences" },
  { label: "Logout",            icon: LogOut,     danger: true                                  },
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
  const { logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] =
    useState<(typeof DATE_OPTIONS)[number]>("This Month");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const closeAll = useCallback(() => {
    setShowNotifications(false);
    setShowSettings(false);
    setShowDateDropdown(false);
  }, []);

  const toggleNotifications = useCallback(() => {
    setShowNotifications((p) => !p);
    setShowSettings(false);
    setShowDateDropdown(false);
  }, []);

  const toggleSettings = useCallback(() => {
    setShowSettings((p) => !p);
    setShowNotifications(false);
    setShowDateDropdown(false);
  }, []);

  const toggleDate = useCallback(() => {
    setShowDateDropdown((p) => !p);
    setShowNotifications(false);
    setShowSettings(false);
  }, []);

  const hasUnread = NOTIFICATIONS.some((n) => n.unread);

  return (
    <header className="da-header-container">
      {/* Left */}
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        {isMobile && onMenuToggle && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={onMenuToggle}
            className="da-btn-icon lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </motion.button>
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
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleDate}
            className={`da-header-button ${showDateDropdown ? "da-header-button-active" : ""}`}
            aria-expanded={showDateDropdown}
            aria-haspopup="listbox"
          >
            <Calendar size={14} className="text-muted" aria-hidden />
            <span>{selectedDate}</span>
            <ChevronDown size={14} className="text-muted" aria-hidden />
          </motion.button>

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

        {/* Notifications */}
        <div className="relative">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleNotifications}
            className="da-btn-icon"
            aria-expanded={showNotifications}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {hasUnread && <span className="da-notification-dot" aria-hidden />}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                {...dropdownMotion}
                className="dashboard-panel glass-panel absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden"
              >
                <div className="da-dropdown-panel-header">
                  <h3 className="text-primary text-sm font-semibold">
                    Notifications
                  </h3>
                  <button
                    type="button"
                    className="da-btn-secondary !h-8 !px-3 !text-[11px]"
                    onClick={closeAll}
                  >
                    View All
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {NOTIFICATIONS.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={`da-dropdown-item flex-col !items-start gap-1 ${n.unread ? "da-dropdown-item-unread" : ""}`}
                    >
                      <span className="text-primary text-left text-xs leading-snug">
                        {n.title}
                      </span>
                      <span className="text-muted text-[10px]">
                        {n.timestamp}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ThemeToggle />

        {/* Settings */}
        <div className="relative">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleSettings}
            className="da-btn-icon"
            aria-expanded={showSettings}
            aria-label="Settings"
          >
            <Settings size={18} />
          </motion.button>

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
              District Administrator
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

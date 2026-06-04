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
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  Shield,
  Sliders,
} from "lucide-react";

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
    title: "Road quality anomaly detected",
    timestamp: "4 min ago",
    unread: true,
  },
  {
    id: "2",
    title: "Budget overspend warning",
    timestamp: "18 min ago",
    unread: true,
  },
  {
    id: "3",
    title: "AI complaint spike detected",
    timestamp: "42 min ago",
    unread: true,
  },
  {
    id: "4",
    title: "Contractor risk score increased",
    timestamp: "1 hr ago",
    unread: false,
  },
  {
    id: "5",
    title: "GIS monitoring alert",
    timestamp: "2 hr ago",
    unread: false,
  },
];

const SETTINGS_ITEMS: {
  label: string;
  icon: typeof User;
  danger?: boolean;
}[] = [
  { label: "Profile Settings", icon: User },
  { label: "System Settings", icon: Sliders },
  { label: "Security", icon: Shield },
  { label: "Audit Preferences", icon: Settings },
  { label: "Help Center", icon: HelpCircle },
  { label: "Logout", icon: LogOut, danger: true },
];

const dropdownMotion = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

export default function Header({
  onMenuToggle,
  title = "Super Admin Dashboard",
  subtitle = "National Infrastructure Overview",
}: HeaderProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkTheme, setIsDarkTheme] = useState(true);
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

  const closeAllDropdowns = useCallback(() => {
    setShowNotifications(false);
    setShowSettings(false);
    setShowDateDropdown(false);
  }, []);

  const toggleNotifications = useCallback(() => {
    setShowNotifications((prev) => !prev);
    setShowSettings(false);
    setShowDateDropdown(false);
  }, []);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
    setShowNotifications(false);
    setShowDateDropdown(false);
  }, []);

  const toggleDateDropdown = useCallback(() => {
    setShowDateDropdown((prev) => !prev);
    setShowNotifications(false);
    setShowSettings(false);
  }, []);

  const hasUnreadNotifications = NOTIFICATIONS.some((n) => n.unread);

  return (
    <header className="header-container">
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        {isMobile && onMenuToggle && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={onMenuToggle}
            className="btn-icon lg:hidden"
            aria-label="Open navigation menu"
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

      <label className="header-search order-last w-full min-w-0 lg:order-none">
        <Search size={16} className="text-muted shrink-0" aria-hidden />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search roads, complaints, contractors..."
          className="text-primary"
          aria-label="Search dashboard"
        />
      </label>

      <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-3 sm:flex-nowrap">
        <div className="relative">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleDateDropdown}
            className={`header-button ${showDateDropdown ? "header-button-active" : ""}`}
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
                {DATE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={selectedDate === option}
                    onClick={() => {
                      setSelectedDate(option);
                      setShowDateDropdown(false);
                    }}
                    className={`dropdown-item ${
                      selectedDate === option ? "dropdown-item-active" : ""
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleNotifications}
            className="btn-icon"
            aria-expanded={showNotifications}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {hasUnreadNotifications && (
              <span className="notification-dot" aria-hidden />
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                {...dropdownMotion}
                className="dashboard-panel glass-panel absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden"
              >
                <div className="dropdown-panel-header">
                  <h3 className="text-primary text-sm font-semibold">
                    Notifications
                  </h3>
                  <button
                    type="button"
                    className="btn-secondary !h-8 !px-3 !text-[11px]"
                    onClick={closeAllDropdowns}
                  >
                    View All
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {NOTIFICATIONS.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className={`dropdown-item flex-col !items-start gap-1 ${
                        notification.unread ? "dropdown-item-unread" : ""
                      }`}
                    >
                      <span className="text-primary text-left text-xs leading-snug">
                        {notification.title}
                      </span>
                      <span className="text-muted text-[10px]">
                        {notification.timestamp}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsDarkTheme((prev) => !prev)}
          className="btn-icon"
          aria-label={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
          title={isDarkTheme ? "Light mode (coming soon)" : "Dark mode"}
        >
          {isDarkTheme ? <Moon size={18} /> : <Sun size={18} />}
        </motion.button>

        <div className="relative">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleSettings}
            className="btn-icon"
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
                    className={`dropdown-item ${
                      item.danger ? "dropdown-item-danger" : ""
                    }`}
                  >
                    <item.icon size={14} aria-hidden />
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="dashboard-card flex min-w-0">
          <div className="dashboard-avatar relative shrink-0">
            <User size={16} aria-hidden />
            <span
              className="online-indicator absolute -bottom-0.5 -right-0.5"
              aria-label="Online"
            />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-primary truncate text-xs font-semibold leading-tight">
              Super Admin
            </p>
            <p className="text-muted truncate text-[10px] leading-tight">
              Infrastructure Authority
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

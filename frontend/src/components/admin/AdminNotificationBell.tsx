"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  timestamp: string;
  unread: boolean;
}

// Static mock notifications — no backend integration yet
const MOCK_NOTIFICATIONS: NotificationItem[] = [
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

const dropdownMotion = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

interface AdminNotificationBellProps {
  portal: "district" | "sub-district" | "super";
}

const PORTAL_STYLES: Record<AdminNotificationBellProps["portal"], { buttonClassName: string; dotClassName: string }> = {
  district: {
    buttonClassName: "da-btn-icon",
    dotClassName: "da-notification-dot",
  },
  "sub-district": {
    buttonClassName: "sda-btn-icon",
    dotClassName: "sda-notification-dot",
  },
  super: {
    buttonClassName: "btn-icon",
    dotClassName: "notification-dot",
  },
};

export function AdminNotificationBell({ portal }: AdminNotificationBellProps) {
  const { buttonClassName, dotClassName } = PORTAL_STYLES[portal];
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setOpen((p) => !p), []);
  const close = useCallback(() => setOpen(false), []);

  // Close on outside click or Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [close]);

  const hasUnread = MOCK_NOTIFICATIONS.some((n) => n.unread);
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={toggle}
        className={buttonClassName}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={18} />
        {hasUnread && (
          <span
            className={dotClassName}
            aria-hidden={true}
          >
            {unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
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
                onClick={close}
              >
                View All
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {MOCK_NOTIFICATIONS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`da-dropdown-item flex-col !items-start gap-1 ${n.unread ? "da-dropdown-item-unread" : ""}`}
                >
                  <span className="text-primary text-left text-xs leading-snug">
                    {n.title}
                  </span>
                  <span className="text-muted text-[10px]">{n.timestamp}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Shield,
  MapPin,
  CheckCircle2,
  MessageSquare,
  Info,
  Settings,
  X,
} from "lucide-react";

import {
  useNotificationStore,
  type Notification,
  type NotificationType,
  type NotificationPriority,
} from "@/store/notificationStore";
import { useDashboardStore } from "@/store/dashboardStore";

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  hazard_verified: { icon: CheckCircle2, color: "var(--color-info)" },
  authority_action: { icon: Shield, color: "var(--color-success)" },
  new_hazard_nearby: { icon: MapPin, color: "var(--color-danger)" },
  report_resolved: { icon: CheckCircle2, color: "var(--color-success)" },
  community_comment: { icon: MessageSquare, color: "var(--color-amber)" },
  safety_alert: { icon: AlertTriangle, color: "var(--color-danger)" },
  system_update: { icon: Settings, color: "var(--color-text-muted)" },
};

const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  critical: "var(--color-danger)",
  high: "var(--color-amber)",
  medium: "var(--color-info)",
  low: "var(--color-text-muted)",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isToday(date: Date): boolean {
  return date.toDateString() === new Date().toDateString();
}

function isYesterday(date: Date): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return date.toDateString() === y.toDateString();
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notifications, markAsRead, markAllAsRead, getUnreadCount } = useNotificationStore();
  const { setActiveNav } = useDashboardStore();

  const unreadCount = getUnreadCount();

  // Sync unread count with dashboard store
  const { setNotificationCount } = useDashboardStore();
  useEffect(() => {
    setNotificationCount(unreadCount);
  }, [unreadCount, setNotificationCount]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Group recent notifications for the dropdown (max 6)
  const recent = [...notifications]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 6);

  const todayItems = recent.filter((n) => isToday(n.timestamp));
  const yesterdayItems = recent.filter((n) => isYesterday(n.timestamp));
  const earlierItems = recent.filter((n) => !isToday(n.timestamp) && !isYesterday(n.timestamp));

  const renderItem = (n: Notification) => {
    const config = TYPE_CONFIG[n.type];
    const Icon = config.icon;
    const priorityColor = PRIORITY_COLORS[n.priority];

    return (
      <motion.button
        key={n.id}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => {
          markAsRead(n.id);
        }}
        className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors hover:bg-[var(--color-surface)] ${
          !n.read ? "bg-[color-mix(in_srgb,var(--color-amber)_4%,transparent)]" : ""
        }`}
      >
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{
            backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)`,
            color: config.color,
          }}
        >
          <Icon size={15} strokeWidth={2} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-xs truncate ${!n.read ? "font-semibold text-[var(--color-text-primary)]" : "font-medium text-[var(--color-text-secondary)]"}`}>
              {n.title}
            </p>
            {!n.read && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-amber)] shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5">
            {n.description}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-[var(--color-text-muted)]">
              {timeAgo(n.timestamp)}
            </span>
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `color-mix(in srgb, ${priorityColor} 12%, transparent)`,
                color: priorityColor,
              }}
            >
              {n.priority.charAt(0).toUpperCase() + n.priority.slice(1)}
            </span>
          </div>
        </div>
      </motion.button>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-danger)] text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-[var(--color-info)] hover:bg-[var(--color-surface)] transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={12} />
                    <span className="hidden sm:inline">Mark all read</span>
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
              {todayItems.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-2 mb-1">
                    Today
                  </p>
                  <div className="space-y-0.5">{todayItems.map(renderItem)}</div>
                </div>
              )}
              {yesterdayItems.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-2 mb-1">
                    Yesterday
                  </p>
                  <div className="space-y-0.5">{yesterdayItems.map(renderItem)}</div>
                </div>
              )}
              {earlierItems.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-2 mb-1">
                    Earlier
                  </p>
                  <div className="space-y-0.5">{earlierItems.map(renderItem)}</div>
                </div>
              )}
              {recent.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Bell size={32} className="text-[var(--color-text-muted)] mb-2" />
                  <p className="text-sm text-[var(--color-text-muted)]">No notifications yet</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--color-border)] p-2">
              <button
                onClick={() => {
                  setActiveNav("notifications");
                  setOpen(false);
                }}
                className="w-full py-2 rounded-xl text-xs font-semibold text-[var(--color-amber)] hover:bg-[var(--color-surface)] transition-colors"
              >
                View All Notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

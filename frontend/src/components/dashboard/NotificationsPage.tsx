"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  CheckCheck,
  Trash2,
  Filter,
  AlertTriangle,
  Shield,
  MapPin,
  CheckCircle2,
  MessageSquare,
  Settings,
  Map,
  Phone,
  FileText,
  X,
  MoreHorizontal,
  Info,
} from "lucide-react";

import {
  useNotificationStore,
  type Notification,
  type NotificationType,
  type NotificationPriority,
  type NotificationAction,
} from "@/store/notificationStore";

// ─── Config ─────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; label: string }> = {
  hazard_verified: { icon: CheckCircle2, color: "var(--color-info)", label: "Hazard Verified" },
  authority_action: { icon: Shield, color: "var(--color-success)", label: "Authority Action" },
  new_hazard_nearby: { icon: MapPin, color: "var(--color-danger)", label: "New Hazard Nearby" },
  report_resolved: { icon: CheckCircle2, color: "var(--color-success)", label: "Report Resolved" },
  community_comment: { icon: MessageSquare, color: "var(--color-amber)", label: "Community Comment" },
  safety_alert: { icon: AlertTriangle, color: "var(--color-danger)", label: "Safety Alert" },
  system_update: { icon: Settings, color: "var(--color-text-muted)", label: "System Update" },
};

const PRIORITY_CONFIG: Record<NotificationPriority, { color: string; label: string }> = {
  critical: { color: "var(--color-danger)", label: "Critical" },
  high: { color: "var(--color-amber)", label: "High" },
  medium: { color: "var(--color-info)", label: "Medium" },
  low: { color: "var(--color-text-muted)", label: "Low" },
};

const ACTION_CONFIG: Record<NotificationAction, { icon: React.ElementType; label: string; color: string }> = {
  view_report: { icon: FileText, label: "View Report", color: "var(--color-info)" },
  open_map: { icon: Map, label: "Open Map", color: "var(--color-success)" },
  contact_authority: { icon: Phone, label: "Contact Authority", color: "var(--color-amber)" },
  dismiss: { icon: X, label: "Dismiss", color: "var(--color-text-muted)" },
};

const TABS = [
  { id: "all" as const, label: "All" },
  { id: "unread" as const, label: "Unread" },
  { id: "critical" as const, label: "Critical" },
  { id: "nearby" as const, label: "Nearby" },
  { id: "reports" as const, label: "Reports" },
];

// ─── Helpers ────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

// ─── Skeleton ───────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)]" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/4 rounded bg-[var(--color-surface)]" />
        <div className="h-3 w-full rounded bg-[var(--color-surface)]" />
        <div className="h-2.5 w-1/3 rounded bg-[var(--color-surface)]" />
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────

function EmptyState({ tab }: { tab: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-20 h-20 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-4">
        <Bell size={32} className="text-[var(--color-text-muted)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
        No notifications
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] text-center max-w-xs">
        {tab === "unread"
          ? "You're all caught up! No unread notifications."
          : tab === "critical"
          ? "No critical alerts at this time. Stay safe!"
          : "When something happens, you'll see it here."}
      </p>
    </motion.div>
  );
}

// ─── Notification Card ──────────────────────────────────────

function NotificationCard({
  notification,
  bulkMode,
  selected,
  onToggleSelect,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  bulkMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);
  const config = TYPE_CONFIG[notification.type];
  const priorityConfig = PRIORITY_CONFIG[notification.priority];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.3 }}
      className={`group relative rounded-2xl border transition-all duration-200 hover:shadow-md ${
        !notification.read
          ? "border-[color-mix(in_srgb,var(--color-amber)_30%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-amber)_3%,var(--color-card))]"
          : "border-[var(--color-border)] bg-[var(--color-card)]"
      } ${selected ? "ring-2 ring-[var(--color-amber)]" : ""}`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Bulk select checkbox */}
        {bulkMode && (
          <button
            onClick={onToggleSelect}
            className={`w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
              selected
                ? "bg-[var(--color-amber)] border-[var(--color-amber)]"
                : "border-[var(--color-border)] hover:border-[var(--color-amber)]"
            }`}
          >
            {selected && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}

        {/* Icon */}
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)`,
            color: config.color,
          }}
        >
          <Icon size={18} strokeWidth={2} />
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className={`text-sm truncate ${!notification.read ? "font-semibold text-[var(--color-text-primary)]" : "font-medium text-[var(--color-text-secondary)]"}`}>
                  {notification.title}
                </h4>
                {!notification.read && (
                  <span className="w-2 h-2 rounded-full bg-[var(--color-amber)] shrink-0" />
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">
                {notification.description}
              </p>
            </div>

            {/* More actions */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowActions(!showActions)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--color-surface)] transition-all"
              >
                <MoreHorizontal size={14} />
              </button>

              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg z-10 p-1"
                  >
                    {!notification.read && (
                      <button
                        onClick={() => { onMarkRead(); setShowActions(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
                      >
                        <CheckCircle2 size={13} />
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => { onDelete(); setShowActions(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--color-danger)] hover:bg-[var(--color-surface)] transition-colors"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Meta + Actions */}
          <div className="flex items-center flex-wrap gap-2 mt-2.5">
            <span className="text-[10px] text-[var(--color-text-muted)]">
              {timeAgo(notification.timestamp)}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: `color-mix(in srgb, ${priorityConfig.color} 12%, transparent)`,
                color: priorityConfig.color,
              }}
            >
              {priorityConfig.label}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--color-surface)] text-[var(--color-text-muted)]"
            >
              {config.label}
            </span>
          </div>

          {/* Quick actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3">
              {notification.actions.filter((a) => a !== "dismiss").map((action) => {
                const actionConfig = ACTION_CONFIG[action];
                const ActionIcon = actionConfig.icon;
                return (
                  <button
                    key={action}
                    onClick={() => {
                      if (action === "open_map") {
                        router.push("/dashboard/safety-map");
                      } else if (action === "view_report") {
                        router.push("/dashboard/my-reports");
                      } else if (action === "contact_authority") {
                        window.location.href = "tel:112";
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
                    style={{ color: actionConfig.color }}
                  >
                    <ActionIcon size={12} />
                    {actionConfig.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export function NotificationsPage() {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteSelected,
    toggleSelect,
    selectAll,
    clearSelection,
    toggleBulkMode,
    bulkMode,
    selectedIds,
    getFilteredNotifications,
    getGrouped,
    getUnreadCount,
    hasMore,
    loadMore,
    loading,
  } = useNotificationStore();

  const [initialLoad, setInitialLoad] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  const filtered = getFilteredNotifications();
  const grouped = getGrouped();
  const unreadCount = getUnreadCount();

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        loadMore();
      }
    },
    [hasMore, loading, loadMore]
  );

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Notifications
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "You're all caught up!"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {bulkMode && selectedIds.size > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={deleteSelected}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--color-danger)] border border-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] transition-colors"
              >
                <Trash2 size={13} />
                Delete ({selectedIds.size})
              </motion.button>
            )}
            {bulkMode ? (
              <>
                <button
                  onClick={selectAll}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--color-info)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <CheckCheck size={13} />
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={toggleBulkMode}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
                >
                  <Filter size={13} />
                  Select
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search + Tabs */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)] transition-shadow"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                {tab.label}
                {tab.id === "unread" && unreadCount > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-danger)] text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notification List */}
        {initialLoad ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="space-y-6">
            {/* Today */}
            {grouped.today.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 px-1">
                  Today
                </h3>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {grouped.today.map((n) => (
                      <NotificationCard
                        key={n.id}
                        notification={n}
                        bulkMode={bulkMode}
                        selected={selectedIds.has(n.id)}
                        onToggleSelect={() => toggleSelect(n.id)}
                        onMarkRead={() => markAsRead(n.id)}
                        onDelete={() => deleteNotification(n.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Yesterday */}
            {grouped.yesterday.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 px-1">
                  Yesterday
                </h3>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {grouped.yesterday.map((n) => (
                      <NotificationCard
                        key={n.id}
                        notification={n}
                        bulkMode={bulkMode}
                        selected={selectedIds.has(n.id)}
                        onToggleSelect={() => toggleSelect(n.id)}
                        onMarkRead={() => markAsRead(n.id)}
                        onDelete={() => deleteNotification(n.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Earlier */}
            {grouped.earlier.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 px-1">
                  Earlier
                </h3>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {grouped.earlier.map((n) => (
                      <NotificationCard
                        key={n.id}
                        notification={n}
                        bulkMode={bulkMode}
                        selected={selectedIds.has(n.id)}
                        onToggleSelect={() => toggleSelect(n.id)}
                        onMarkRead={() => markAsRead(n.id)}
                        onDelete={() => deleteNotification(n.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div ref={observerRef} className="py-4">
                <NotificationSkeleton />
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

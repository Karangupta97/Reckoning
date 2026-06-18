import { create } from "zustand";

export type NotificationType =
  | "hazard_verified"
  | "authority_action"
  | "new_hazard_nearby"
  | "report_resolved"
  | "community_comment"
  | "safety_alert"
  | "system_update";

export type NotificationPriority = "critical" | "high" | "medium" | "low";

export type NotificationAction = "view_report" | "open_map" | "contact_authority" | "dismiss";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  priority: NotificationPriority;
  actions?: NotificationAction[];
}

type TabFilter = "all" | "unread" | "critical" | "nearby" | "reports";

interface NotificationState {
  notifications: Notification[];
  activeTab: TabFilter;
  searchQuery: string;
  selectedIds: Set<string>;
  bulkMode: boolean;
  page: number;
  hasMore: boolean;
  loading: boolean;

  // Actions
  setActiveTab: (tab: TabFilter) => void;
  setSearchQuery: (q: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  deleteSelected: () => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleBulkMode: () => void;
  loadMore: () => void;
  getFilteredNotifications: () => Notification[];
  getUnreadCount: () => number;
  getGrouped: () => { today: Notification[]; yesterday: Notification[]; earlier: Notification[] };
}

// Sample notification data
const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "safety_alert",
    title: "Safety Alert: Heavy Rain Warning",
    description: "Heavy rainfall expected on NH48 corridor. Exercise caution while driving.",
    timestamp: hoursAgo(0.5),
    read: false,
    priority: "critical",
    actions: ["open_map", "dismiss"],
  },
  {
    id: "n2",
    type: "hazard_verified",
    title: "Your Pothole Report Verified",
    description: "Report RW-1001 on NH48 near Panvel has been verified by 12 citizens.",
    timestamp: hoursAgo(1),
    read: false,
    priority: "high",
    actions: ["view_report", "dismiss"],
  },
  {
    id: "n3",
    type: "new_hazard_nearby",
    title: "New Hazard Detected Nearby",
    description: "Flooding reported 0.8 km from your location on Mumbai-Pune Highway.",
    timestamp: hoursAgo(2),
    read: false,
    priority: "high",
    actions: ["open_map", "view_report", "dismiss"],
  },
  {
    id: "n4",
    type: "authority_action",
    title: "Authority Action Taken",
    description: "Municipal Corporation has dispatched a repair crew for pothole on Thane-Belapur Rd.",
    timestamp: hoursAgo(4),
    read: true,
    priority: "medium",
    actions: ["view_report", "contact_authority"],
  },
  {
    id: "n5",
    type: "community_comment",
    title: "New Comment on Your Report",
    description: "Rahul M. commented: 'This pothole has gotten worse since yesterday.'",
    timestamp: hoursAgo(6),
    read: true,
    priority: "low",
    actions: ["view_report", "dismiss"],
  },
  {
    id: "n6",
    type: "report_resolved",
    title: "Report Resolved: Road Debris",
    description: "Your report RW-998 for road debris on Sion-Panvel Highway has been resolved.",
    timestamp: daysAgo(1),
    read: true,
    priority: "medium",
    actions: ["view_report", "dismiss"],
  },
  {
    id: "n7",
    type: "safety_alert",
    title: "Traffic Diversion Alert",
    description: "Road closure on Eastern Expressway due to repairs. Expect delays.",
    timestamp: daysAgo(1),
    read: false,
    priority: "high",
    actions: ["open_map", "dismiss"],
  },
  {
    id: "n8",
    type: "system_update",
    title: "App Update Available",
    description: "Version 2.4 is now available with improved AI detection and offline support.",
    timestamp: daysAgo(1),
    read: true,
    priority: "low",
    actions: ["dismiss"],
  },
  {
    id: "n9",
    type: "hazard_verified",
    title: "Broken Signal Verified",
    description: "Traffic signal issue at Vashi junction confirmed. Authorities alerted.",
    timestamp: daysAgo(2),
    read: true,
    priority: "medium",
    actions: ["view_report", "open_map"],
  },
  {
    id: "n10",
    type: "new_hazard_nearby",
    title: "Waterlogging Reported Nearby",
    description: "Waterlogging at Andheri subway. Depth estimated at 2 feet.",
    timestamp: daysAgo(2),
    read: true,
    priority: "high",
    actions: ["open_map", "dismiss"],
  },
  {
    id: "n11",
    type: "authority_action",
    title: "Highway Patrol Deployed",
    description: "Highway patrol unit dispatched to NH4 for reported road debris.",
    timestamp: daysAgo(3),
    read: true,
    priority: "medium",
    actions: ["view_report", "contact_authority"],
  },
  {
    id: "n12",
    type: "community_comment",
    title: "Report Upvoted",
    description: "Your flooding report received 25 upvotes from the community.",
    timestamp: daysAgo(4),
    read: true,
    priority: "low",
    actions: ["view_report", "dismiss"],
  },
];

const PAGE_SIZE = 8;

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: SAMPLE_NOTIFICATIONS,
  activeTab: "all",
  searchQuery: "",
  selectedIds: new Set(),
  bulkMode: false,
  page: 1,
  hasMore: true,
  loading: false,

  setActiveTab: (tab) => set({ activeTab: tab, page: 1 }),
  setSearchQuery: (q) => set({ searchQuery: q, page: 1 }),

  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  deleteNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
      selectedIds: new Set([...s.selectedIds].filter((sid) => sid !== id)),
    })),

  deleteSelected: () =>
    set((s) => ({
      notifications: s.notifications.filter((n) => !s.selectedIds.has(n.id)),
      selectedIds: new Set(),
      bulkMode: false,
    })),

  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  selectAll: () =>
    set((s) => ({
      selectedIds: new Set(s.notifications.map((n) => n.id)),
    })),

  clearSelection: () => set({ selectedIds: new Set(), bulkMode: false }),

  toggleBulkMode: () =>
    set((s) => ({
      bulkMode: !s.bulkMode,
      selectedIds: s.bulkMode ? new Set() : s.selectedIds,
    })),

  loadMore: () => {
    const s = get();
    const filtered = s.getFilteredNotifications();
    const nextPage = s.page + 1;
    const hasMore = nextPage * PAGE_SIZE < filtered.length;
    set({ page: nextPage, hasMore });
  },

  getFilteredNotifications: () => {
    const { notifications, activeTab, searchQuery } = get();
    let filtered = [...notifications];

    // Tab filter
    switch (activeTab) {
      case "unread":
        filtered = filtered.filter((n) => !n.read);
        break;
      case "critical":
        filtered = filtered.filter((n) => n.priority === "critical" || n.priority === "high");
        break;
      case "nearby":
        filtered = filtered.filter((n) => n.type === "new_hazard_nearby" || n.type === "safety_alert");
        break;
      case "reports":
        filtered = filtered.filter(
          (n) => n.type === "hazard_verified" || n.type === "report_resolved" || n.type === "authority_action"
        );
        break;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },

  getUnreadCount: () => get().notifications.filter((n) => !n.read).length,

  getGrouped: () => {
    const filtered = get().getFilteredNotifications();
    const paged = filtered.slice(0, get().page * PAGE_SIZE);

    return {
      today: paged.filter((n) => isToday(n.timestamp)),
      yesterday: paged.filter((n) => isYesterday(n.timestamp)),
      earlier: paged.filter((n) => !isToday(n.timestamp) && !isYesterday(n.timestamp)),
    };
  },
}));

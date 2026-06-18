import { create } from "zustand";

export type NavItem =
  | "dashboard"
  | "reports"
  | "hazards"
  | "map"
  | "notifications"
  | "community"
  | "achievements"
  | "profile"
  | "settings"
  | "help";

interface DashboardState {
  activeNav: NavItem;
  setActiveNav: (nav: NavItem) => void;
  notificationCount: number;
  setNotificationCount: (n: number) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeNav: "dashboard",
  setActiveNav: (nav) => set({ activeNav: nav }),
  notificationCount: 3,
  setNotificationCount: (n) => set({ notificationCount: n }),
}));

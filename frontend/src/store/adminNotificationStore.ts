/**
 * adminNotificationStore.ts — Simulated notifications for District & Super Admin portals.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adminPersistOptions } from "@/lib/store-persist";

export type AdminPortal = "district" | "super" | "sub-district";

export type AdminNotificationType =
  | "escalation_new"
  | "escalation_escalated"
  | "escalation_decision"
  | "escalation_update"
  | "budget_submitted"
  | "budget_decision"
  | "evidence_submitted"
  | "evidence_decision"
  | "governance_submitted"
  | "governance_decision"
  | "resolution_submitted"
  | "resolution_decision"
  | "clarification_request"
  | "ticket_submitted";

export interface AdminNotification {
  id: string;
  portal: AdminPortal;
  type: AdminNotificationType;
  title: string;
  message: string;
  entityId: string;
  href: string;
  timestamp: string;
  unread: boolean;
}

function nowLabel(): string {
  return "Just now";
}

const SEED: AdminNotification[] = [
  {
    id: "n1",
    portal: "super",
    type: "escalation_new",
    title: "New escalation received",
    message: "ESC-4030 — Road accident black spot (Dwarka)",
    entityId: "ESC-4030",
    href: "/super-admin/complaints/escalated-cases/ESC-4030",
    timestamp: "12 min ago",
    unread: true,
  },
  {
    id: "n2",
    portal: "super",
    type: "budget_submitted",
    title: "Budget request pending",
    message: "BUD-2026-001 — NH-48 Emergency Bridge Repair",
    entityId: "BUD-2026-001",
    href: "/super-admin/governance/approvals/BUD-2026-001",
    timestamp: "28 min ago",
    unread: true,
  },
  {
    id: "n3",
    portal: "district",
    type: "budget_decision",
    title: "Budget clarification requested — Urban Road Resurfacing Phase II",
    message: "Super Admin requested clarification on your submission",
    entityId: "BUD-2026-002",
    href: "/district-admin/budget",
    timestamp: "1 hr ago",
    unread: true,
  },
];

interface AdminNotificationState {
  notifications: AdminNotification[];
  nextId: number;
  push: (n: Omit<AdminNotification, "id" | "timestamp" | "unread"> & { timestamp?: string }) => void;
  markRead: (id: string) => void;
  markAllRead: (portal: AdminPortal) => void;
  /** Imperative helper only — do not pass to useAdminNotificationStore selectors. */
  unreadCount: (portal: AdminPortal) => number;
  /** Imperative helper only — do not pass to useAdminNotificationStore selectors. */
  forPortal: (portal: AdminPortal) => AdminNotification[];
}

export const useAdminNotificationStore = create<AdminNotificationState>()(
  persist(
    (set, get) => ({
  notifications: SEED,
  nextId: 100,

  push: (n) => {
    const id = `admin-n-${get().nextId}`;
    set({
      nextId: get().nextId + 1,
      notifications: [
        { ...n, id, timestamp: n.timestamp ?? nowLabel(), unread: true },
        ...get().notifications,
      ],
    });
  },

  markRead: (id) => {
    set({
      notifications: get().notifications.map((x) => (x.id === id ? { ...x, unread: false } : x)),
    });
  },

  markAllRead: (portal) => {
    set({
      notifications: get().notifications.map((x) => (x.portal === portal ? { ...x, unread: false } : x)),
    });
  },

  unreadCount: (portal) => get().notifications.filter((x) => x.portal === portal && x.unread).length,

  forPortal: (portal) => get().notifications.filter((x) => x.portal === portal),
}),
    {
      ...adminPersistOptions("admin-notifications", (s) => ({
        notifications: s.notifications,
        nextId: s.nextId,
      })),
      skipHydration: true,
    }
  )
);

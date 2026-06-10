"use client";

import { useEffect, useState } from "react";
import {
  useAdminNotificationStore,
  type AdminNotification,
} from "@/store/adminNotificationStore";
import { startAdminNotificationRehydrate } from "@/hooks/useAdminNotificationHydrated";

/**
 * Subscribe to admin notifications via useState — avoids useSyncExternalStore /
 * getServerSnapshot loops from Zustand persist under Next.js SSR.
 */
export function useAdminNotifications(): AdminNotification[] {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  useEffect(() => {
    startAdminNotificationRehydrate();

    const sync = () => {
      setNotifications(useAdminNotificationStore.getState().notifications);
    };

    sync();
    return useAdminNotificationStore.subscribe(sync);
  }, []);

  return notifications;
}

"use client";

import { useEffect, useState } from "react";
import { useAdminNotificationStore } from "@/store/adminNotificationStore";

let rehydrateStarted = false;

export function startAdminNotificationRehydrate() {
  if (rehydrateStarted) return;
  rehydrateStarted = true;
  void useAdminNotificationStore.persist.rehydrate();
}

/** True once persisted notification state has been rehydrated on the client. */
export function useAdminNotificationHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAdminNotificationStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    const unsub = useAdminNotificationStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    startAdminNotificationRehydrate();

    return unsub;
  }, []);

  return hydrated;
}

"use client";

import { useEffect, useRef } from "react";
import { initLeaderboardSync } from "@/store/leaderboardStore";
import { useAchievementStore } from "@/store/achievementStore";

// Module-level flag prevents duplicate subscriptions across fast remounts
let _syncActive = false;

/**
 * Initialize store sync subscriptions once per app lifecycle.
 * - Leaderboard recomputes when source stores change.
 * - Achievement challenges recompute from live store data.
 * - Cleanup on layout unmount to prevent memory leaks.
 */
export function useStoreSync() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (_syncActive) return;
    _syncActive = true;

    // Start leaderboard → store subscriptions (returns unsubscribe)
    cleanupRef.current = initLeaderboardSync();

    // Recompute achievement challenges from live data on mount
    useAchievementStore.getState().recomputeFromStores();

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      _syncActive = false;
    };
  }, []);
}

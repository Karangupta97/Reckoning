"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, CloudUpload, Check } from "lucide-react";
import { getPendingReports, syncOfflineReports, type OfflineReport } from "@/lib/offlineDb";

/**
 * Offline sync status indicator.
 * Shows when:
 * - User is offline (with pending report count)
 * - Reports are being synced
 * - Sync completed successfully
 */
export function OfflineSyncStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; failed: number } | null>(null);

  // Check online status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Check pending reports count
  useEffect(() => {
    const checkPending = async () => {
      const pending = await getPendingReports();
      setPendingCount(pending.length);
    };

    checkPending();
    const interval = setInterval(checkPending, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming back online
  const handleSync = useCallback(async () => {
    if (pendingCount === 0 || syncing) return;

    setSyncing(true);
    setSyncResult(null);

    // Placeholder submit function — should be wired to actual API
    const submitFn = async (_report: OfflineReport): Promise<boolean> => {
      // TODO: Wire to actual report submission API
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: _report.title,
          description: _report.description,
          category: _report.category,
          latitude: _report.latitude,
          longitude: _report.longitude,
        }),
      });
      return res.ok;
    };

    const result = await syncOfflineReports(submitFn);
    setSyncResult(result);
    setSyncing(false);

    // Refresh pending count
    const pending = await getPendingReports();
    setPendingCount(pending.length);

    // Clear success message after 5 seconds
    if (result.synced > 0) {
      setTimeout(() => setSyncResult(null), 5000);
    }
  }, [pendingCount, syncing]);

  // Auto-sync on online event
  useEffect(() => {
    const onOnline = () => {
      handleSync();
    };
    window.addEventListener("reckoning:online", onOnline);
    return () => window.removeEventListener("reckoning:online", onOnline);
  }, [handleSync]);

  // Don't render if all is well
  if (isOnline && pendingCount === 0 && !syncing && !syncResult) return null;

  return (
    <AnimatePresence mode="wait">
      {/* Offline indicator */}
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm"
        >
          <WifiOff size={14} className="text-amber-500 shrink-0" />
          <span className="text-[var(--color-text-primary)]">
            You&apos;re offline
            {pendingCount > 0 && (
              <span className="text-[var(--color-text-secondary)]">
                {" "}· {pendingCount} report{pendingCount !== 1 ? "s" : ""} queued
              </span>
            )}
          </span>
        </motion.div>
      )}

      {/* Syncing */}
      {isOnline && syncing && (
        <motion.div
          key="syncing"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm"
        >
          <CloudUpload size={14} className="text-blue-500 shrink-0 animate-pulse" />
          <span className="text-[var(--color-text-primary)]">Syncing reports...</span>
        </motion.div>
      )}

      {/* Sync complete */}
      {isOnline && !syncing && syncResult && syncResult.synced > 0 && (
        <motion.div
          key="synced"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm"
        >
          <Check size={14} className="text-emerald-500 shrink-0" />
          <span className="text-[var(--color-text-primary)]">
            {syncResult.synced} report{syncResult.synced !== 1 ? "s" : ""} synced
          </span>
        </motion.div>
      )}

      {/* Pending reports while online (manual sync) */}
      {isOnline && !syncing && !syncResult && pendingCount > 0 && (
        <motion.div
          key="pending"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm"
        >
          <Wifi size={14} className="text-blue-500 shrink-0" />
          <span className="text-[var(--color-text-primary)]">
            {pendingCount} pending report{pendingCount !== 1 ? "s" : ""}
          </span>
          <button
            onClick={handleSync}
            className="ml-auto text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Sync now
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

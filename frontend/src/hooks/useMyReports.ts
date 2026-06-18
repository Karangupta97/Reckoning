"use client";

/**
 * useMyReports — data hook for the My Reports page.
 *
 * Calls getMyComplaints / getMyStats through withMockFallback, so dev team
 * members automatically get mock hydration / fallback while normal users hit
 * the live API directly.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { getMyComplaints, getMyStats } from "@/lib/api/citizenApi";
import type { MyReport, UserStats } from "@/components/my-reports/types";
import { shouldUseMock } from "@/lib/useMock";

interface UseMyReportsResult {
  reports: MyReport[];
  stats: UserStats;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useMyReports(): UseMyReportsResult {
  const email = useAuthStore((state) => state.user?.email);

  const isMockEnabledForUser = shouldUseMock(email);

  const [reports, setReports] = useState<MyReport[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalReports: 0,
    openReports: 0,
    resolvedReports: 0,
    rejectedReports: 0,
    criticalReports: 0,
    totalUpvotes: 0,
    totalComments: 0,
    totalViews: 0,
    resolutionRate: 0,
    rankPercentile: 0,
    rankArea: "",
    hazardBreakdown: {
      pothole: 0,
      flooding: 0,
      accident: 0,
      debris: 0,
      signal: 0,
    },
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedReports, fetchedStats] = await Promise.all([
        getMyComplaints(undefined, email),
        getMyStats(email),
      ]);
      setReports(fetchedReports);
      setStats(fetchedStats);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load your reports.";
      setError(message);

      // When mock mode is off, don't leak placeholder data after a hard failure.
      if (!isMockEnabledForUser) {
        setReports([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, isMockEnabledForUser]);

  useEffect(() => {
    void load();
  }, [load]);

  return { reports, stats, isLoading, error, refresh: load };
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { shouldUseMock } from "@/lib/useMock";
import { api } from "@/lib/api";
import { DISTRICT_CONFIG } from "@/lib/district-config";

export interface DistrictInfo {
  id: string;
  name: string;
  country: string;
  isActive: boolean;
  geofence: unknown | null;
}

/**
 * Hook to fetch the real district name/info from the backend.
 * Falls back to the admin store's districtName (populated at login),
 * then to static DISTRICT_CONFIG when in mock mode or on error.
 */
export function useDistrictInfo() {
  const currentAdmin = useAdminAuthStore((s) => s.admin);
  const isMock = shouldUseMock(currentAdmin?.email);

  const { data, isLoading } = useQuery({
    queryKey: ["myDistrictInfo"],
    queryFn: async () => {
      const res = await api.get("/api/admin/my-district");
      return res.data?.data?.district as DistrictInfo;
    },
    enabled: !isMock && currentAdmin?.role === "DISTRICT_ADMIN",
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Priority: live API data → store admin's districtName (from login/me) → static fallback
  const districtName =
    data?.name ??
    (currentAdmin?.districtName as string | null | undefined) ??
    (isMock ? DISTRICT_CONFIG.name : DISTRICT_CONFIG.name);

  return {
    district: data ?? null,
    districtName,
    districtLabel: `${districtName} District`,
    districtOpsCenter: `${districtName} District Operations Center`,
    districtSidebarSubtitle: `${districtName} Operations Center`,
    districtLocationLabel: `${DISTRICT_CONFIG.state} • ${districtName}`,
    isLoading,
    isMock,
  };
}

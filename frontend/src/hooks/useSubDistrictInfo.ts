"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { shouldUseMock } from "@/lib/useMock";
import { api } from "@/lib/api";
import { SUB_DISTRICT_CONFIG } from "@/lib/sub-district-config";

export interface SubDistrictInfo {
  subDistrictName: string;
  districtName: string;
  subDistrictLabel: string;
  subDistrictOpsLabel: string;
  subDistrictLocationLabel: string;
  subDistrictSidebarSubtitle: string;
  isLoading: boolean;
  isMock: boolean;
}

export function useSubDistrictInfo(): SubDistrictInfo {
  const currentAdmin = useAdminAuthStore((s) => s.admin);
  const isMock = shouldUseMock(currentAdmin?.email);

  const { data, isLoading } = useQuery({
    queryKey: ["myAdminProfile"],
    queryFn: async () => {
      // /api/admin/auth/me returns { success: true, data: { ...adminFields, districtName, subDistrictName } }
      const res = await api.get("/api/admin/auth/me");
      return res.data?.data;
    },
    enabled: !isMock && (currentAdmin?.role === "SUB_DISTRICT_ADMIN" || currentAdmin?.role === "DISTRICT_ADMIN"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const admin = data ?? currentAdmin;
  const subDistrictName = admin?.subDistrictName ?? SUB_DISTRICT_CONFIG.name;
  const districtName = admin?.districtName ?? SUB_DISTRICT_CONFIG.district;

  return {
    subDistrictName,
    districtName,
    subDistrictLabel: subDistrictName,
    subDistrictOpsLabel: `${subDistrictName} Operations Desk`,
    subDistrictLocationLabel: `${districtName} • ${subDistrictName}`,
    subDistrictSidebarSubtitle: `${subDistrictName} Operations Desk`,
    isLoading: !isMock && isLoading,
    isMock,
  };
}

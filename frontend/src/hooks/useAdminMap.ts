'use client';

import { useMemo } from 'react';
import type { AdminRole, MapConfig } from '@/lib/map/types';
import { useMapData } from '@/lib/map/useMapData';

export function useAdminMap(adminRole: AdminRole, adminRegionId?: string) {
  const config: MapConfig = useMemo(() => ({
    defaultLevel: adminRole === 'super_admin' ? 'national' : adminRole === 'district_admin' ? 'district' : 'national',
    defaultRegionId: adminRegionId,
    adminRole,
    allowedLevels: adminRole === 'super_admin'
      ? ['national', 'state', 'district', 'subdistrict']
      : adminRole === 'sub_district_admin'
        ? ['district', 'subdistrict']
        : ['national', 'state', 'district', 'subdistrict'],
    dimOtherRegions: adminRole !== 'super_admin',
  }), [adminRole, adminRegionId]);

  return useMapData(config);
}

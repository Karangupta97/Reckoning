/**
 * India Interactive Drill-Down Map — Reusable across all admin levels.
 *
 * @example
 * // Super admin — full India drill-down
 * <IndiaMap adminRole="super_admin" height="600px" />
 *
 * @example
 * // District admin — defaults to Maharashtra, can't go above state level
 * <IndiaMap adminRole="district_admin" adminRegionId="maharashtra" height="500px" />
 *
 * @example
 * // Sub-district admin — defaults to Mumbai City
 * <IndiaMap adminRole="sub_district_admin" adminRegionId="mumbai-city" height="400px" />
 */
'use client';

import dynamic from 'next/dynamic';
import type { AdminRole, RegionStats } from '@/lib/map/types';
import { MapSkeleton } from './MapSkeleton';

export interface IndiaMapProps {
  adminRole: AdminRole;
  adminRegionId?: string;
  height?: string;
  className?: string;
  onRegionSelect?: (stats: RegionStats) => void;
  showSidebar?: boolean;
  showBreadcrumb?: boolean;
  showLegend?: boolean;
  showControls?: boolean;
  isDark?: boolean;
}

const MapInner = dynamic<IndiaMapProps>(
  () => import('./IndiaMapInner').then(mod => mod.default) as never,
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

export default function IndiaMap(props: IndiaMapProps) {
  return <MapInner {...props} />;
}

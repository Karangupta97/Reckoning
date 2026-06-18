export type MapLevel = 'national' | 'state' | 'district' | 'subdistrict';

export type AdminRole = 'super_admin' | 'district_admin' | 'sub_district_admin';

export type RiskLevel = 'very_high' | 'high' | 'medium' | 'low' | 'very_low';

export type HazardType = 'Pothole' | 'Flooding' | 'Accident' | 'Debris' | 'Signal';

export type Trend = 'up' | 'down' | 'stable';

export interface RegionStats {
  id: string;
  name: string;
  level: MapLevel;
  parentId?: string;
  parentName?: string;
  totalReports: number;
  openReports: number;
  resolvedReports: number;
  pendingReports: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  verificationAccuracy: number;
  avgResolutionDays: number;
  topHazardType: HazardType;
  riskScore: number;
  riskLevel: RiskLevel;
  lastReportedAt: string;
  trend: Trend;
  trendPercent: number;
}

export interface MapConfig {
  defaultLevel: MapLevel;
  defaultRegionId?: string;
  defaultRegionName?: string;
  adminRole: AdminRole;
  allowedLevels: MapLevel[];
  dimOtherRegions: boolean;
}

export interface DrillState {
  level: MapLevel;
  stateId?: string;
  stateName?: string;
  districtId?: string;
  districtName?: string;
  subdistrictId?: string;
  subdistrictName?: string;
}

export interface GeoJSONCache {
  [key: string]: GeoJSON.FeatureCollection;
}

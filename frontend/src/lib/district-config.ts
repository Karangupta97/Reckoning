/**
 * District configuration object.
 * All district-specific labels across the dashboard read from here.
 */

import {
  RAIGAD_DISTRICT,
  countActiveOfficers,
} from "@/lib/governance/district-structure";

export interface DistrictConfig {
  name: string;
  state: string;
  subDistrictCount: number;
  activeOfficers: number;
}

export const DISTRICT_CONFIG: DistrictConfig = {
  name: RAIGAD_DISTRICT.name,
  state: RAIGAD_DISTRICT.state,
  subDistrictCount: RAIGAD_DISTRICT.subDistricts.length,
  activeOfficers: countActiveOfficers(),
};

export const districtLabel = `${DISTRICT_CONFIG.name} District`;
export const districtOpsCenter = `${DISTRICT_CONFIG.name} District Operations Center`;
export const districtLocationLabel = `${DISTRICT_CONFIG.state} • ${DISTRICT_CONFIG.name}`;
export const districtSidebarSubtitle = `${DISTRICT_CONFIG.name} Operations Center`;

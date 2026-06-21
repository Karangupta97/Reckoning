/**
 * Sub-District configuration object.
 * Active portal sub-district — metrics are computed from stores at runtime.
 */

import { DEFAULT_SUB_DISTRICT, RAIGAD_DISTRICT } from "@/lib/governance/district-structure";

export interface SubDistrictConfig {
  name: string;
  district: string;
  state: string;
  zone: string;
  activeOfficers: number;
}

export const SUB_DISTRICT_CONFIG: SubDistrictConfig = {
  name: DEFAULT_SUB_DISTRICT.taluka,
  district: RAIGAD_DISTRICT.name,
  state: RAIGAD_DISTRICT.state,
  zone: DEFAULT_SUB_DISTRICT.zone,
  activeOfficers: DEFAULT_SUB_DISTRICT.officers.length,
};

export const subDistrictLabel = DEFAULT_SUB_DISTRICT.name;
export const subDistrictOpsLabel = `${DEFAULT_SUB_DISTRICT.taluka} Operations Desk`;
export const subDistrictLocationLabel = `${RAIGAD_DISTRICT.name} • ${DEFAULT_SUB_DISTRICT.name}`;
export const subDistrictSidebarSubtitle = `${DEFAULT_SUB_DISTRICT.taluka} Operations Desk`;

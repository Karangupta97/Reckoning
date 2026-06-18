/**
 * District configuration object.
 * All district-specific labels across the dashboard read from here.
 * To deploy for a different district, only this file needs to change.
 */

export interface DistrictConfig {
  /** Short district name, e.g. "Raigad" */
  name: string;
  /** Parent state, e.g. "Maharashtra" */
  state: string;
  /** Total sub-district count for display */
  subDistrictCount: number;
  /** Active field officers count */
  activeOfficers: number;
}

export const DISTRICT_CONFIG: DistrictConfig = {
  name: "Raigad",
  state: "Maharashtra",
  subDistrictCount: 6,
  activeOfficers: 14,
};

/* ─── Derived labels (computed once, reused everywhere) ──── */

/** "Raigad District" */
export const districtLabel = `${DISTRICT_CONFIG.name} District`;

/** "Raigad District Operations Center" */
export const districtOpsCenter = `${DISTRICT_CONFIG.name} District Operations Center`;

/** "Maharashtra • Raigad" */
export const districtLocationLabel = `${DISTRICT_CONFIG.state} • ${DISTRICT_CONFIG.name}`;

/** "Raigad Operations Center" — compact sidebar variant */
export const districtSidebarSubtitle = `${DISTRICT_CONFIG.name} Operations Center`;

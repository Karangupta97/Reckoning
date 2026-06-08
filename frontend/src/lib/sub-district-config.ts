/**
 * Sub-District configuration object.
 * All sub-district-specific labels across the dashboard read from here.
 * To deploy for a different sub-district, only this file needs to change.
 */

export interface SubDistrictConfig {
  name: string;
  district: string;
  state: string;
  zone: string;
  activeOfficers: number;
  openComplaints: number;
}

export const SUB_DISTRICT_CONFIG: SubDistrictConfig = {
  name: "Panvel Taluka",
  district: "Raigad",
  state: "Maharashtra",
  zone: "Zone A",
  activeOfficers: 8,
  openComplaints: 84,
};

/* ─── Derived labels (computed once, reused everywhere) ──── */

/** "Panvel Taluka" */
export const subDistrictLabel = `${SUB_DISTRICT_CONFIG.name}`;

/** "Panvel Taluka Operations Desk" */
export const subDistrictOpsLabel = `${SUB_DISTRICT_CONFIG.name} Operations Desk`;

/** "Raigad • Panvel Taluka" */
export const subDistrictLocationLabel = `${SUB_DISTRICT_CONFIG.district} • ${SUB_DISTRICT_CONFIG.name}`;

/** "Panvel Taluka Operations Desk" — compact sidebar variant */
export const subDistrictSidebarSubtitle = `${SUB_DISTRICT_CONFIG.name} Operations Desk`;

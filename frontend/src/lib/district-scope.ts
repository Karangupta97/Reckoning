import { DISTRICT_CONFIG, districtLabel } from "@/lib/district-config";

/** Whether a record belongs to the currently configured district portal */
export function belongsToCurrentDistrict(district?: string, state?: string): boolean {
  if (!district && !state) return true;
  const name = DISTRICT_CONFIG.name.toLowerCase();
  const d = (district ?? "").toLowerCase();
  const s = (state ?? "").toLowerCase();
  return (
    d.includes(name) ||
    d.includes(districtLabel.toLowerCase()) ||
    s === DISTRICT_CONFIG.state.toLowerCase()
  );
}

export function filterByDistrictScope<T>(
  items: T[],
  getDistrict: (item: T) => string | undefined,
  getState?: (item: T) => string | undefined
): T[] {
  return items.filter((item) =>
    belongsToCurrentDistrict(getDistrict(item), getState?.(item))
  );
}

export const currentDistrictFields = () => ({
  district: districtLabel,
  state: DISTRICT_CONFIG.state,
});

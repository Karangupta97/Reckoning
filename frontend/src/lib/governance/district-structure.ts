/**
 * Canonical Raigad district hierarchy — single source for sub-districts, officers, and labels.
 */

export interface SubDistrictDefinition {
  id: string;
  /** Display name without Taluka suffix, e.g. "Panvel" */
  name: string;
  /** Full taluka label used on complaint records, e.g. "Panvel Taluka" */
  taluka: string;
  zone: string;
  officers: string[];
}

export interface DistrictDefinition {
  name: string;
  state: string;
  subDistricts: SubDistrictDefinition[];
}

export const RAIGAD_DISTRICT: DistrictDefinition = {
  name: "Raigad",
  state: "Maharashtra",
  subDistricts: [
    {
      id: "panvel",
      name: "Panvel",
      taluka: "Panvel Taluka",
      zone: "Zone A",
      officers: ["R. Sharma", "P. Nair", "M. Khan"],
    },
    {
      id: "alibag",
      name: "Alibag",
      taluka: "Alibag Taluka",
      zone: "Zone B",
      officers: ["A. Singh", "T. Verma"],
    },
    {
      id: "pen",
      name: "Pen",
      taluka: "Pen Taluka",
      zone: "Zone C",
      officers: ["S. Gupta", "D. Patil"],
    },
    {
      id: "uran",
      name: "Uran",
      taluka: "Uran Taluka",
      zone: "Zone D",
      officers: ["P. Iyer", "K. Joshi"],
    },
    {
      id: "karjat",
      name: "Karjat",
      taluka: "Karjat Taluka",
      zone: "Zone E",
      officers: ["V. Desai", "N. Kulkarni"],
    },
    {
      id: "roha",
      name: "Roha",
      taluka: "Roha Taluka",
      zone: "Zone F",
      officers: ["H. More", "L. Pawar"],
    },
    {
      id: "mangaon",
      name: "Mangaon",
      taluka: "Mangaon Taluka",
      zone: "Zone G",
      officers: ["J. Bhosale", "F. Naik"],
    },
  ],
};

export const RAIGAD_SUB_DISTRICTS = RAIGAD_DISTRICT.subDistricts;

export const DEFAULT_SUB_DISTRICT = RAIGAD_SUB_DISTRICTS[0];

export function subDistrictTaluka(name: string): string {
  const match = RAIGAD_SUB_DISTRICTS.find(
    (s) => s.name === name || s.taluka === name || name.includes(s.name)
  );
  return match?.taluka ?? name;
}

export function normalizeSubDistrictLabel(value: string): string {
  const match = RAIGAD_SUB_DISTRICTS.find(
    (s) =>
      s.name === value ||
      s.taluka === value ||
      value.includes(s.name) ||
      s.name.includes(value.replace(" Taluka", ""))
  );
  return match?.taluka ?? value;
}

export function allSubDistrictTalukas(): string[] {
  return RAIGAD_SUB_DISTRICTS.map((s) => s.taluka);
}

export function allSubDistrictNames(): string[] {
  return RAIGAD_SUB_DISTRICTS.map((s) => s.name);
}

export function countActiveOfficers(): number {
  return RAIGAD_SUB_DISTRICTS.reduce((sum, s) => sum + s.officers.length, 0);
}

export function officersForSubDistrict(taluka: string): string[] {
  const match = RAIGAD_SUB_DISTRICTS.find((s) => s.taluka === taluka || s.name === taluka);
  return match?.officers ?? ["Field Officer"];
}

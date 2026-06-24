/**
 * Canonical district hierarchy — single source for sub-districts, officers, and labels.
 * Includes both Raigad and Mumbai Suburban districts.
 */

export interface SubDistrictDefinition {
  id: string;
  /** Display name without Taluka suffix, e.g. "Panvel" */
  name: string;
  /** Full taluka label used on complaint records, e.g. "Panvel Taluka" */
  taluka: string;
  zone: string;
  officers: string[];
  /** Approximate center coordinates [lat, lng] for map centering */
  center?: [number, number];
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
      center: [19.0330, 73.1175],
    },
    {
      id: "alibag",
      name: "Alibag",
      taluka: "Alibag Taluka",
      zone: "Zone B",
      officers: ["A. Singh", "T. Verma"],
      center: [18.6488, 72.8726],
    },
    {
      id: "pen",
      name: "Pen",
      taluka: "Pen Taluka",
      zone: "Zone C",
      officers: ["S. Gupta", "D. Patil"],
      center: [18.7373, 73.0952],
    },
    {
      id: "uran",
      name: "Uran",
      taluka: "Uran Taluka",
      zone: "Zone D",
      officers: ["P. Iyer", "K. Joshi"],
      center: [18.8826, 72.9395],
    },
    {
      id: "karjat",
      name: "Karjat",
      taluka: "Karjat Taluka",
      zone: "Zone E",
      officers: ["V. Desai", "N. Kulkarni"],
      center: [18.9106, 73.3244],
    },
    {
      id: "roha",
      name: "Roha",
      taluka: "Roha Taluka",
      zone: "Zone F",
      officers: ["H. More", "L. Pawar"],
      center: [18.4384, 73.1178],
    },
    {
      id: "mangaon",
      name: "Mangaon",
      taluka: "Mangaon Taluka",
      zone: "Zone G",
      officers: ["J. Bhosale", "F. Naik"],
      center: [18.2338, 73.2757],
    },
  ],
};

/**
 * Mumbai Suburban district — real sub-district (ward) boundaries for the
 * district-admin "Add New Sub-District" form.
 */
export const MUMBAI_SUBURBAN_DISTRICT: DistrictDefinition = {
  name: "Mumbai Suburban",
  state: "Maharashtra",
  subDistricts: [
    {
      id: "andheri",
      name: "Andheri",
      taluka: "Andheri",
      zone: "Zone K-West",
      officers: ["S. Patil", "R. Naik"],
      center: [19.1197, 72.8464],
    },
    {
      id: "bandra",
      name: "Bandra",
      taluka: "Bandra",
      zone: "Zone H-West",
      officers: ["A. Mehta", "V. Joshi"],
      center: [19.0596, 72.8295],
    },
    {
      id: "borivali",
      name: "Borivali",
      taluka: "Borivali",
      zone: "Zone R-Central",
      officers: ["M. Gupta", "T. Desai"],
      center: [19.2307, 72.8567],
    },
    {
      id: "kurla",
      name: "Kurla",
      taluka: "Kurla",
      zone: "Zone L",
      officers: ["P. Shah", "K. Kulkarni"],
      center: [19.0726, 72.8794],
    },
    {
      id: "malad",
      name: "Malad",
      taluka: "Malad",
      zone: "Zone P-North",
      officers: ["D. More", "N. Bhosale"],
      center: [19.1870, 72.8489],
    },
    {
      id: "goregaon",
      name: "Goregaon",
      taluka: "Goregaon",
      zone: "Zone P-South",
      officers: ["H. Iyer", "L. Pawar"],
      center: [19.1663, 72.8526],
    },
    {
      id: "jogeshwari",
      name: "Jogeshwari",
      taluka: "Jogeshwari",
      zone: "Zone K-East",
      officers: ["F. Khan", "G. Nair"],
      center: [19.1364, 72.8490],
    },
    {
      id: "kandivali",
      name: "Kandivali",
      taluka: "Kandivali",
      zone: "Zone R-South",
      officers: ["B. Sharma", "C. Singh"],
      center: [19.2094, 72.8527],
    },
    {
      id: "dahisar",
      name: "Dahisar",
      taluka: "Dahisar",
      zone: "Zone R-North",
      officers: ["E. Verma"],
      center: [19.2502, 72.8597],
    },
    {
      id: "vile-parle",
      name: "Vile Parle",
      taluka: "Vile Parle",
      zone: "Zone K-West",
      officers: ["J. Patil"],
      center: [19.1042, 72.8497],
    },
    {
      id: "santacruz",
      name: "Santacruz",
      taluka: "Santacruz",
      zone: "Zone H-East",
      officers: ["W. Deshmukh"],
      center: [19.0830, 72.8401],
    },
    {
      id: "chembur",
      name: "Chembur",
      taluka: "Chembur",
      zone: "Zone M-East",
      officers: ["X. Rao", "Y. Naik"],
      center: [19.0522, 72.9005],
    },
  ],
};

/**
 * Mumbai City district — real sub-district (ward) boundaries.
 */
export const MUMBAI_CITY_DISTRICT: DistrictDefinition = {
  name: "Mumbai City",
  state: "Maharashtra",
  subDistricts: [
    {
      id: "colaba",
      name: "Colaba",
      taluka: "Colaba",
      zone: "Zone A",
      officers: ["R. Desai", "P. Mehta"],
      center: [18.9067, 72.8147],
    },
    {
      id: "fort",
      name: "Fort",
      taluka: "Fort",
      zone: "Zone A",
      officers: ["S. Rao"],
      center: [18.9340, 72.8356],
    },
    {
      id: "marine-lines",
      name: "Marine Lines",
      taluka: "Marine Lines",
      zone: "Zone B",
      officers: ["A. Shah", "V. Kulkarni"],
      center: [18.9432, 72.8237],
    },
    {
      id: "grant-road",
      name: "Grant Road",
      taluka: "Grant Road",
      zone: "Zone C",
      officers: ["M. Patil"],
      center: [18.9630, 72.8120],
    },
    {
      id: "byculla",
      name: "Byculla",
      taluka: "Byculla",
      zone: "Zone D",
      officers: ["K. Gupta", "L. Naik"],
      center: [18.9785, 72.8334],
    },
    {
      id: "dadar",
      name: "Dadar",
      taluka: "Dadar",
      zone: "Zone E",
      officers: ["T. Bhosale", "N. More"],
      center: [19.0178, 72.8478],
    },
    {
      id: "parel",
      name: "Parel",
      taluka: "Parel",
      zone: "Zone F",
      officers: ["H. Iyer"],
      center: [18.9929, 72.8389],
    },
    {
      id: "worli",
      name: "Worli",
      taluka: "Worli",
      zone: "Zone G",
      officers: ["D. Singh", "E. Verma"],
      center: [19.0096, 72.8179],
    },
    {
      id: "mahalaxmi",
      name: "Mahalaxmi",
      taluka: "Mahalaxmi",
      zone: "Zone D",
      officers: ["F. Khan"],
      center: [18.9822, 72.8120],
    },
    {
      id: "sewri",
      name: "Sewri",
      taluka: "Sewri",
      zone: "Zone F",
      officers: ["G. Pawar"],
      center: [18.9990, 72.8570],
    },
    {
      id: "mahim",
      name: "Mahim",
      taluka: "Mahim",
      zone: "Zone G",
      officers: ["R. Kulkarni", "S. Nair"],
      center: [19.0376, 72.8406],
    },
  ],
};

/** All known districts */
export const ALL_DISTRICTS = [RAIGAD_DISTRICT, MUMBAI_SUBURBAN_DISTRICT, MUMBAI_CITY_DISTRICT] as const;

export const RAIGAD_SUB_DISTRICTS = RAIGAD_DISTRICT.subDistricts;
export const MUMBAI_SUB_DISTRICTS = MUMBAI_SUBURBAN_DISTRICT.subDistricts;
export const MUMBAI_CITY_SUB_DISTRICTS = MUMBAI_CITY_DISTRICT.subDistricts;

export const DEFAULT_SUB_DISTRICT = RAIGAD_SUB_DISTRICTS[0];

export function subDistrictTaluka(name: string): string {
  for (const district of ALL_DISTRICTS) {
    const match = district.subDistricts.find(
      (s) => s.name === name || s.taluka === name || name.includes(s.name)
    );
    if (match) return match.taluka;
  }
  return name;
}

export function normalizeSubDistrictLabel(value: string): string {
  for (const district of ALL_DISTRICTS) {
    const match = district.subDistricts.find(
      (s) =>
        s.name === value ||
        s.taluka === value ||
        value.includes(s.name) ||
        s.name.includes(value.replace(" Taluka", ""))
    );
    if (match) return match.taluka;
  }
  return value;
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
  for (const district of ALL_DISTRICTS) {
    const match = district.subDistricts.find((s) => s.taluka === taluka || s.name === taluka);
    if (match) return match.officers;
  }
  return ["Field Officer"];
}

/**
 * Get sub-districts for a given district name.
 */
export function getSubDistrictsForDistrict(districtName: string): SubDistrictDefinition[] {
  const district = ALL_DISTRICTS.find(
    (d) => d.name.toLowerCase() === districtName.toLowerCase()
  );
  return district?.subDistricts ?? RAIGAD_SUB_DISTRICTS;
}

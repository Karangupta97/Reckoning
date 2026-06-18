import type { MapConfig, MapLevel, RegionStats } from './types';

export function getRiskColor(riskScore: number): string {
  if (riskScore >= 80) return '#DC2626';
  if (riskScore >= 60) return '#F59E0B';
  if (riskScore >= 40) return '#EAB308';
  if (riskScore >= 20) return '#22C55E';
  return '#06B6D4';
}

export function getRiskLabel(riskScore: number): string {
  if (riskScore >= 80) return 'Very High Risk';
  if (riskScore >= 60) return 'High Risk';
  if (riskScore >= 40) return 'Medium Risk';
  if (riskScore >= 20) return 'Low Risk';
  return 'Very Low Risk';
}

export function getGeoJSONUrl(level: MapLevel, regionId?: string): string {
  if (level === 'national') return '/geojson/india_states.geojson';
  if (level === 'state') return '/geojson/districts/india_district.geojson';
  if (level === 'district') return '/geojson/districts/sub-districts/india_subdistricts.geojson';
  return '/geojson/india_states.geojson';
}

// Map old/alternate GeoJSON names to our mock data IDs
const NAME_ALIASES: Record<string, string> = {
  'orissa': 'odisha',
  'pondicherry': 'puducherry',
  'uttaranchal': 'uttarakhand',
  'nct-of-delhi': 'delhi',
  'greater-bombay': 'mumbai-city',
  'bid': 'beed',
  'garhchiroli': 'gadchiroli',
  'gondiya': 'gondia',
  'raigarh': 'raigad',
  'bangalore-urban': 'bengaluru-urban',
  'bangalore-rural': 'bengaluru-rural',
  'mysore': 'mysuru',
  'belgaum': 'belagavi',
  'bellary': 'ballari',
  'gulbarga': 'kalaburagi',
  'bijapur': 'vijayapura',
  'shimoga': 'shimoga',
  'tumkur': 'tumakuru',
  'allahabad': 'prayagraj',
  'faizabad': 'ayodhya',
  'bara-banki': 'barabanki',
  'kanpur': 'kanpur-nagar',
  'badaun': 'budaun',
  'siddharth-nagar': 'siddharthnagar',
  'jyotiba-phule-nagar': 'amroha',
  'sant-ravi-das-nagar': 'bhadohi',
  'dakshin-kannad': 'dakshina-kannada',
  'uttar-kannand': 'uttara-kannada',
  'chamrajnagar': 'chamarajanagar',
  'chikmagalur': 'chikkamagaluru',
  'hubli-dharwad': 'dharwad',
  'mangaluru': 'dakshina-kannada',
  'buldana': 'buldhana',
};

function normalizeToId(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

export function getFeatureId(feature: GeoJSON.Feature): string {
  const props = feature.properties || {};

  // For subdistrict-level GeoJSON (has NAME_3), use NAME_3 as the ID
  if (props['NAME_3']) {
    const normalized = normalizeToId(props['NAME_3']);
    return NAME_ALIASES[normalized] || normalized;
  }

  // For district-level GeoJSON (has NAME_2), use NAME_2 as the ID
  if (props['NAME_2']) {
    const normalized = normalizeToId(props['NAME_2']);
    return NAME_ALIASES[normalized] || normalized;
  }

  // For state-level GeoJSON, use NAME_1 or other state keys
  const keys = ['ST_NM', 'ST_NAME', 'NAME_1', 'DISTRICT', 'dtname', 'sdtname', 'name', 'district', 'state', 'NAME', 'Name'];
  let raw = '';
  for (const key of keys) {
    if (props[key]) {
      raw = props[key];
      break;
    }
  }
  if (!raw) raw = 'unknown';

  const normalized = normalizeToId(raw);
  return NAME_ALIASES[normalized] || normalized;
}

/**
 * Filter a full district GeoJSON to only features belonging to a specific state.
 * Uses NAME_1 property to match the parent state.
 */
export function filterDistrictsByState(
  allDistricts: GeoJSON.FeatureCollection,
  stateId: string
): GeoJSON.FeatureCollection {
  const stateIdNormalized = stateId.toLowerCase().trim();

  const filtered = allDistricts.features.filter(feature => {
    const stateName = feature.properties?.['NAME_1'] || '';
    const featureStateId = normalizeToId(stateName);
    const aliased = NAME_ALIASES[featureStateId] || featureStateId;
    return aliased === stateIdNormalized || featureStateId === stateIdNormalized;
  });

  return {
    type: 'FeatureCollection',
    features: filtered,
  };
}

/**
 * Filter a state-level subdistrict GeoJSON (Level 3) to only features belonging to a specific district.
 * Expects features with NAME_2 (district) and NAME_3 (subdistrict).
 * The file is already split by state — we just filter by NAME_2 for the district.
 */
export function filterSubdistrictsByDistrict(
  stateSubdistricts: GeoJSON.FeatureCollection,
  districtId: string
): GeoJSON.FeatureCollection {
  const districtIdNormalized = districtId.toLowerCase().trim();

  const filtered = stateSubdistricts.features.filter(feature => {
    const districtName = feature.properties?.['NAME_2'] || '';
    const featureDistrictId = normalizeToId(districtName);
    const aliased = NAME_ALIASES[featureDistrictId] || featureDistrictId;
    return aliased === districtIdNormalized || featureDistrictId === districtIdNormalized;
  });

  return {
    type: 'FeatureCollection',
    features: filtered,
  };
}

export function getFeatureName(feature: GeoJSON.Feature): string {
  const props = feature.properties || {};

  // For subdistrict-level GeoJSON (has NAME_3), use NAME_3
  if (props['NAME_3']) {
    return props['NAME_3'];
  }

  // For district-level GeoJSON (has NAME_2), use NAME_2 as the display name
  if (props['NAME_2']) {
    return props['NAME_2'];
  }

  const keys = ['ST_NM', 'ST_NAME', 'NAME_1', 'DISTRICT', 'dtname', 'sdtname', 'name', 'district', 'state', 'NAME', 'Name'];
  let raw = '';
  for (const key of keys) {
    if (props[key]) {
      raw = props[key];
      break;
    }
  }
  if (!raw) raw = 'Unknown';
  return raw
    .split(' ')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export const fitBoundsOptions = {
  padding: [40, 40] as [number, number],
  maxZoom: 10,
  animate: true,
  duration: 0.8,
};

export const STATE_CENTERS: Record<string, [number, number]> = {
  'andhra-pradesh': [15.9129, 79.74],
  'arunachal-pradesh': [28.218, 94.7278],
  'assam': [26.2006, 92.9376],
  'bihar': [25.0961, 85.3131],
  'chhattisgarh': [21.2787, 81.8661],
  'goa': [15.2993, 74.124],
  'gujarat': [22.2587, 71.1924],
  'haryana': [29.0588, 76.0856],
  'himachal-pradesh': [31.1048, 77.1734],
  'jharkhand': [23.6102, 85.2799],
  'karnataka': [15.3173, 75.7139],
  'kerala': [10.8505, 76.2711],
  'madhya-pradesh': [22.9734, 78.6569],
  'maharashtra': [19.7515, 75.7139],
  'manipur': [24.6637, 93.9063],
  'meghalaya': [25.467, 91.3662],
  'mizoram': [23.1645, 92.9376],
  'nagaland': [26.1584, 94.5624],
  'odisha': [20.9517, 85.0985],
  'punjab': [31.1471, 75.3412],
  'rajasthan': [27.0238, 74.2179],
  'sikkim': [27.533, 88.5122],
  'tamil-nadu': [11.1271, 78.6569],
  'telangana': [18.1124, 79.0193],
  'tripura': [23.9408, 91.9882],
  'uttar-pradesh': [26.8467, 80.9462],
  'uttarakhand': [30.0668, 79.0193],
  'west-bengal': [22.9868, 87.855],
  'delhi': [28.7041, 77.1025],
  'jammu-and-kashmir': [33.7782, 76.5762],
  'ladakh': [34.1526, 77.577],
  'chandigarh': [30.7333, 76.7794],
  'puducherry': [11.9416, 79.8083],
  'andaman-and-nicobar': [11.7401, 92.6586],
  'dadra-and-nagar-haveli': [20.1809, 73.0169],
  'lakshadweep': [10.5667, 72.6417],
};

export const DISTRICT_CENTERS: Record<string, [number, number]> = {
  'mumbai-city': [18.9388, 72.8354],
  'mumbai-suburban': [19.1726, 72.8561],
  'pune': [18.5204, 73.8567],
  'nagpur': [21.1458, 79.0882],
  'nashik': [19.9975, 73.7898],
  'thane': [19.2183, 72.9781],
  'aurangabad': [19.8762, 75.3433],
  'solapur': [17.6599, 75.9064],
  'kolhapur': [16.705, 74.2433],
  'sangli': [16.8524, 74.5815],
  'satara': [17.68, 74.0183],
  'ratnagiri': [16.9944, 73.3],
  'sindhudurg': [16.3489, 73.5558],
  'north-delhi': [28.7325, 77.1963],
  'south-delhi': [28.5244, 77.2066],
  'east-delhi': [28.6279, 77.295],
  'west-delhi': [28.6517, 77.1072],
  'central-delhi': [28.6454, 77.2168],
  'new-delhi': [28.6139, 77.209],
};

export function getInitialView(config: MapConfig): { center: [number, number]; zoom: number } {
  if (config.defaultLevel === 'national') {
    return { center: [20.5937, 78.9629], zoom: 5 };
  }

  if (config.defaultRegionId) {
    const stateCenter = STATE_CENTERS[config.defaultRegionId];
    if (stateCenter) {
      return { center: stateCenter, zoom: 7 };
    }

    const districtCenter = DISTRICT_CENTERS[config.defaultRegionId];
    if (districtCenter) {
      return { center: districtCenter, zoom: 10 };
    }
  }

  return { center: [20.5937, 78.9629], zoom: 5 };
}

export function generateTooltipHTML(stats: RegionStats, isDark: boolean): string {
  const bg = isDark ? '#222838' : '#FFFFFF';
  const textPrimary = isDark ? '#EDF1F7' : '#1C2B3A';
  const textSecondary = isDark ? '#A8B6C8' : '#4A5D70';
  const textMuted = isDark ? '#5C6E82' : '#8A9BAD';
  const border = isDark ? '#313A50' : '#D6DFE8';
  const riskColor = getRiskColor(stats.riskScore);
  const riskLabel = getRiskLabel(stats.riskScore);

  const trendIcon = stats.trend === 'up' ? '📈' : stats.trend === 'down' ? '📉' : '➡️';
  const trendSign = stats.trend === 'up' ? '+' : stats.trend === 'down' ? '-' : '';

  return `
    <div style="
      background: ${bg};
      border: 1px solid ${border};
      border-radius: 12px;
      padding: 12px 14px;
      max-width: 220px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: ${textPrimary};
    ">
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
        <span style="
          display: inline-block;
          padding: 2px 7px;
          border-radius: 6px;
          background: ${riskColor}22;
          color: ${riskColor};
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">${riskLabel}</span>
      </div>
      <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px; color: ${textPrimary};">${stats.name}</div>
      <div style="border-top: 1px solid ${border}; margin-bottom: 8px;"></div>
      <div style="color: ${textSecondary}; margin-bottom: 3px;">📊 ${stats.totalReports} Total Reports</div>
      <div style="color: ${textSecondary}; margin-bottom: 3px;">🔴 Critical: ${stats.criticalCount} &nbsp; 🟡 High: ${stats.highCount}</div>
      <div style="color: ${textSecondary}; margin-bottom: 8px;">🟢 Resolved: ${stats.resolvedReports} &nbsp; ⏳ Open: ${stats.openReports}</div>
      <div style="border-top: 1px solid ${border}; margin-bottom: 8px;"></div>
      <div style="color: ${textMuted}; margin-bottom: 3px;">⚠️ Top: ${stats.topHazardType} &nbsp; ${trendIcon} ${trendSign}${stats.trendPercent}%</div>
      <div style="color: ${textMuted};">✅ ${stats.verificationAccuracy}% accuracy &nbsp; ⏱ ${stats.avgResolutionDays}d avg</div>
    </div>
  `;
}

export function generateFallbackGeoJSON(
  center: [number, number],
  regionCount: number,
  regionNames: string[]
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = regionNames.map((name, i) => {
    const angle = (2 * Math.PI * i) / regionCount;
    const radius = 0.8 + Math.random() * 0.5;
    const lat = center[0] + radius * Math.cos(angle);
    const lng = center[1] + radius * Math.sin(angle);
    const size = 0.3 + Math.random() * 0.2;

    return {
      type: 'Feature',
      properties: {
        name: name,
        NAME_1: name,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [lng - size, lat - size],
          [lng + size, lat - size],
          [lng + size, lat + size],
          [lng - size, lat + size],
          [lng - size, lat - size],
        ]],
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

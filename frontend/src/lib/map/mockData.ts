import type { HazardType, MapLevel, RegionStats, RiskLevel, Trend } from './types';

const HAZARD_TYPES: HazardType[] = ['Pothole', 'Flooding', 'Accident', 'Debris', 'Signal'];

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'very_high';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'very_low';
}

function deterministicHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function createRegionStats(
  id: string,
  name: string,
  level: MapLevel,
  riskScore: number,
  totalReports: number,
  parentId?: string,
  parentName?: string
): RegionStats {
  const rand = seededRandom(deterministicHash(id));
  const openRatio = 0.15 + rand() * 0.25;
  const resolvedRatio = 0.5 + rand() * 0.3;
  const pendingRatio = 1 - openRatio - resolvedRatio;

  const openReports = Math.round(totalReports * openRatio);
  const resolvedReports = Math.round(totalReports * resolvedRatio);
  const pendingReports = Math.max(0, totalReports - openReports - resolvedReports);

  const criticalRatio = riskScore > 70 ? 0.1 + rand() * 0.1 : 0.03 + rand() * 0.05;
  const highRatio = 0.15 + rand() * 0.15;
  const mediumRatio = 0.3 + rand() * 0.15;

  const criticalCount = Math.round(totalReports * criticalRatio);
  const highCount = Math.round(totalReports * highRatio);
  const mediumCount = Math.round(totalReports * mediumRatio);
  const lowCount = Math.max(0, totalReports - criticalCount - highCount - mediumCount);

  const trends: Trend[] = ['up', 'down', 'stable'];
  const trend = trends[Math.floor(rand() * 3)];

  return {
    id,
    name,
    level,
    parentId,
    parentName,
    totalReports,
    openReports,
    resolvedReports,
    pendingReports,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    verificationAccuracy: Math.round(75 + rand() * 22),
    avgResolutionDays: Math.round((1.5 + rand() * 6) * 10) / 10,
    topHazardType: HAZARD_TYPES[Math.floor(rand() * 5)],
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    lastReportedAt: new Date(Date.now() - Math.floor(rand() * 86400000 * 3)).toISOString(),
    trend,
    trendPercent: Math.round(rand() * 25),
  };
}

// ─── INDIA STATES MOCK ──────────────────────────────────────────────────────
export const INDIA_STATES_MOCK: Record<string, RegionStats> = {
  'maharashtra': createRegionStats('maharashtra', 'Maharashtra', 'national', 88, 4523),
  'uttar-pradesh': createRegionStats('uttar-pradesh', 'Uttar Pradesh', 'national', 85, 5102),
  'bihar': createRegionStats('bihar', 'Bihar', 'national', 78, 3245),
  'west-bengal': createRegionStats('west-bengal', 'West Bengal', 'national', 75, 2987),
  'delhi': createRegionStats('delhi', 'Delhi', 'national', 82, 2876),
  'karnataka': createRegionStats('karnataka', 'Karnataka', 'national', 62, 2134),
  'tamil-nadu': createRegionStats('tamil-nadu', 'Tamil Nadu', 'national', 58, 1987),
  'rajasthan': createRegionStats('rajasthan', 'Rajasthan', 'national', 55, 1876),
  'madhya-pradesh': createRegionStats('madhya-pradesh', 'Madhya Pradesh', 'national', 52, 1654),
  'odisha': createRegionStats('odisha', 'Odisha', 'national', 48, 1432),
  'andhra-pradesh': createRegionStats('andhra-pradesh', 'Andhra Pradesh', 'national', 35, 1234),
  'telangana': createRegionStats('telangana', 'Telangana', 'national', 38, 1345),
  'gujarat': createRegionStats('gujarat', 'Gujarat', 'national', 32, 1198),
  'kerala': createRegionStats('kerala', 'Kerala', 'national', 22, 876),
  'punjab': createRegionStats('punjab', 'Punjab', 'national', 28, 945),
  'haryana': createRegionStats('haryana', 'Haryana', 'national', 34, 1023),
  'jharkhand': createRegionStats('jharkhand', 'Jharkhand', 'national', 45, 1287),
  'chhattisgarh': createRegionStats('chhattisgarh', 'Chhattisgarh', 'national', 38, 987),
  'uttarakhand': createRegionStats('uttarakhand', 'Uttarakhand', 'national', 25, 654),
  'himachal-pradesh': createRegionStats('himachal-pradesh', 'Himachal Pradesh', 'national', 18, 432),
  'assam': createRegionStats('assam', 'Assam', 'national', 36, 876),
  'goa': createRegionStats('goa', 'Goa', 'national', 15, 234),
  'tripura': createRegionStats('tripura', 'Tripura', 'national', 20, 345),
  'meghalaya': createRegionStats('meghalaya', 'Meghalaya', 'national', 22, 287),
  'manipur': createRegionStats('manipur', 'Manipur', 'national', 19, 198),
  'nagaland': createRegionStats('nagaland', 'Nagaland', 'national', 16, 167),
  'mizoram': createRegionStats('mizoram', 'Mizoram', 'national', 12, 134),
  'arunachal-pradesh': createRegionStats('arunachal-pradesh', 'Arunachal Pradesh', 'national', 14, 156),
  'sikkim': createRegionStats('sikkim', 'Sikkim', 'national', 10, 98),
  'jammu-and-kashmir': createRegionStats('jammu-and-kashmir', 'Jammu & Kashmir', 'national', 30, 765),
  'ladakh': createRegionStats('ladakh', 'Ladakh', 'national', 11, 87),
  'chandigarh': createRegionStats('chandigarh', 'Chandigarh', 'national', 24, 345),
  'puducherry': createRegionStats('puducherry', 'Puducherry', 'national', 17, 189),
  'andaman-and-nicobar': createRegionStats('andaman-and-nicobar', 'Andaman & Nicobar', 'national', 10, 67),
  'daman-and-diu': createRegionStats('daman-and-diu', 'Daman & Diu', 'national', 12, 78),
  'dadra-and-nagar-haveli': createRegionStats('dadra-and-nagar-haveli', 'Dadra & Nagar Haveli', 'national', 11, 65),
};

// ─── MAHARASHTRA DISTRICTS ──────────────────────────────────────────────────
export const MAHARASHTRA_DISTRICTS_MOCK: Record<string, RegionStats> = {
  'mumbai-city': createRegionStats('mumbai-city', 'Mumbai City', 'state', 92, 847, 'maharashtra', 'Maharashtra'),
  'mumbai-suburban': createRegionStats('mumbai-suburban', 'Mumbai Suburban', 'state', 87, 756, 'maharashtra', 'Maharashtra'),
  'pune': createRegionStats('pune', 'Pune', 'state', 82, 623, 'maharashtra', 'Maharashtra'),
  'nagpur': createRegionStats('nagpur', 'Nagpur', 'state', 78, 445, 'maharashtra', 'Maharashtra'),
  'nashik': createRegionStats('nashik', 'Nashik', 'state', 72, 398, 'maharashtra', 'Maharashtra'),
  'thane': createRegionStats('thane', 'Thane', 'state', 75, 534, 'maharashtra', 'Maharashtra'),
  'aurangabad': createRegionStats('aurangabad', 'Aurangabad', 'state', 58, 312, 'maharashtra', 'Maharashtra'),
  'solapur': createRegionStats('solapur', 'Solapur', 'state', 45, 234, 'maharashtra', 'Maharashtra'),
  'kolhapur': createRegionStats('kolhapur', 'Kolhapur', 'state', 42, 213, 'maharashtra', 'Maharashtra'),
  'sangli': createRegionStats('sangli', 'Sangli', 'state', 38, 187, 'maharashtra', 'Maharashtra'),
  'satara': createRegionStats('satara', 'Satara', 'state', 35, 176, 'maharashtra', 'Maharashtra'),
  'ratnagiri': createRegionStats('ratnagiri', 'Ratnagiri', 'state', 28, 145, 'maharashtra', 'Maharashtra'),
  'sindhudurg': createRegionStats('sindhudurg', 'Sindhudurg', 'state', 22, 98, 'maharashtra', 'Maharashtra'),
  'ahmednagar': createRegionStats('ahmednagar', 'Ahmednagar', 'state', 48, 267, 'maharashtra', 'Maharashtra'),
  'jalgaon': createRegionStats('jalgaon', 'Jalgaon', 'state', 44, 234, 'maharashtra', 'Maharashtra'),
  'dhule': createRegionStats('dhule', 'Dhule', 'state', 36, 167, 'maharashtra', 'Maharashtra'),
  'nandurbar': createRegionStats('nandurbar', 'Nandurbar', 'state', 30, 123, 'maharashtra', 'Maharashtra'),
  'beed': createRegionStats('beed', 'Beed', 'state', 40, 189, 'maharashtra', 'Maharashtra'),
  'latur': createRegionStats('latur', 'Latur', 'state', 37, 167, 'maharashtra', 'Maharashtra'),
  'osmanabad': createRegionStats('osmanabad', 'Osmanabad', 'state', 33, 145, 'maharashtra', 'Maharashtra'),
  'nanded': createRegionStats('nanded', 'Nanded', 'state', 39, 178, 'maharashtra', 'Maharashtra'),
  'parbhani': createRegionStats('parbhani', 'Parbhani', 'state', 34, 156, 'maharashtra', 'Maharashtra'),
  'hingoli': createRegionStats('hingoli', 'Hingoli', 'state', 29, 112, 'maharashtra', 'Maharashtra'),
  'washim': createRegionStats('washim', 'Washim', 'state', 27, 98, 'maharashtra', 'Maharashtra'),
  'akola': createRegionStats('akola', 'Akola', 'state', 35, 145, 'maharashtra', 'Maharashtra'),
  'amravati': createRegionStats('amravati', 'Amravati', 'state', 41, 198, 'maharashtra', 'Maharashtra'),
  'yavatmal': createRegionStats('yavatmal', 'Yavatmal', 'state', 36, 156, 'maharashtra', 'Maharashtra'),
  'buldhana': createRegionStats('buldhana', 'Buldhana', 'state', 32, 134, 'maharashtra', 'Maharashtra'),
  'wardha': createRegionStats('wardha', 'Wardha', 'state', 28, 112, 'maharashtra', 'Maharashtra'),
  'chandrapur': createRegionStats('chandrapur', 'Chandrapur', 'state', 38, 167, 'maharashtra', 'Maharashtra'),
  'gadchiroli': createRegionStats('gadchiroli', 'Gadchiroli', 'state', 25, 89, 'maharashtra', 'Maharashtra'),
  'gondia': createRegionStats('gondia', 'Gondia', 'state', 26, 98, 'maharashtra', 'Maharashtra'),
  'bhandara': createRegionStats('bhandara', 'Bhandara', 'state', 24, 87, 'maharashtra', 'Maharashtra'),
  'raigad': createRegionStats('raigad', 'Raigad', 'state', 40, 198, 'maharashtra', 'Maharashtra'),
  'palghar': createRegionStats('palghar', 'Palghar', 'state', 43, 212, 'maharashtra', 'Maharashtra'),
  'jalna': createRegionStats('jalna', 'Jalna', 'state', 31, 134, 'maharashtra', 'Maharashtra'),
};

// ─── UTTAR PRADESH DISTRICTS ────────────────────────────────────────────────
const UP_DISTRICT_NAMES = [
  'Lucknow', 'Kanpur Nagar', 'Varanasi', 'Agra', 'Prayagraj', 'Meerut', 'Ghaziabad',
  'Noida', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur', 'Saharanpur', 'Jhansi',
  'Mathura', 'Firozabad', 'Ayodhya', 'Sultanpur', 'Rae Bareli', 'Unnao',
  'Shahjahanpur', 'Budaun', 'Rampur', 'Etawah', 'Farrukhabad', 'Mainpuri',
  'Kannauj', 'Etah', 'Hathras', 'Kasganj', 'Sambhal', 'Amroha',
  'Bijnor', 'Muzaffarnagar', 'Shamli', 'Baghpat', 'Hapur', 'Bulandshahr',
  'Gautam Buddha Nagar', 'Ghazipur', 'Jaunpur', 'Azamgarh', 'Mau', 'Ballia',
  'Deoria', 'Kushinagar', 'Maharajganj', 'Siddharthnagar', 'Basti', 'Sant Kabir Nagar',
  'Ambedkar Nagar', 'Barabanki', 'Hardoi', 'Sitapur', 'Lakhimpur Kheri', 'Pilibhit',
  'Banda', 'Chitrakoot', 'Hamirpur', 'Mahoba', 'Jalaun', 'Lalitpur',
  'Fatehpur', 'Kaushambi', 'Pratapgarh', 'Chandauli', 'Mirzapur', 'Sonbhadra',
  'Bhadohi', 'Bahraich', 'Shravasti', 'Balrampur', 'Gonda', 'Amethi', 'Kanpur Dehat'
];

export const UTTAR_PRADESH_DISTRICTS_MOCK: Record<string, RegionStats> = {};
UP_DISTRICT_NAMES.forEach((name, index) => {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const baseRisk = index < 8 ? 70 + Math.floor(seededRandom(deterministicHash(id))() * 25)
    : index < 25 ? 40 + Math.floor(seededRandom(deterministicHash(id))() * 30)
    : 15 + Math.floor(seededRandom(deterministicHash(id))() * 30);
  const baseReports = index < 8 ? 400 + Math.floor(seededRandom(deterministicHash(id))() * 300)
    : index < 25 ? 150 + Math.floor(seededRandom(deterministicHash(id))() * 200)
    : 50 + Math.floor(seededRandom(deterministicHash(id))() * 150);
  UTTAR_PRADESH_DISTRICTS_MOCK[id] = createRegionStats(id, name, 'state', baseRisk, baseReports, 'uttar-pradesh', 'Uttar Pradesh');
});

// ─── KARNATAKA DISTRICTS ────────────────────────────────────────────────────
const KARNATAKA_DISTRICT_NAMES = [
  'Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Mangaluru', 'Hubli-Dharwad',
  'Belagavi', 'Kalaburagi', 'Ballari', 'Raichur', 'Bidar',
  'Tumakuru', 'Shimoga', 'Davanagere', 'Hassan', 'Mandya',
  'Chikkamagaluru', 'Udupi', 'Kodagu', 'Chitradurga', 'Kolar',
  'Chamarajanagar', 'Ramanagara', 'Chikkaballapur', 'Yadgir', 'Bagalkot',
  'Gadag', 'Haveri', 'Koppal', 'Uttara Kannada', 'Dakshina Kannada', 'Vijayapura'
];

export const KARNATAKA_DISTRICTS_MOCK: Record<string, RegionStats> = {};
KARNATAKA_DISTRICT_NAMES.forEach((name, index) => {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const baseRisk = index < 5 ? 55 + Math.floor(seededRandom(deterministicHash(id))() * 30)
    : index < 15 ? 30 + Math.floor(seededRandom(deterministicHash(id))() * 25)
    : 10 + Math.floor(seededRandom(deterministicHash(id))() * 25);
  const baseReports = index < 5 ? 300 + Math.floor(seededRandom(deterministicHash(id))() * 250)
    : index < 15 ? 100 + Math.floor(seededRandom(deterministicHash(id))() * 150)
    : 40 + Math.floor(seededRandom(deterministicHash(id))() * 100);
  KARNATAKA_DISTRICTS_MOCK[id] = createRegionStats(id, name, 'state', baseRisk, baseReports, 'karnataka', 'Karnataka');
});

// ─── DELHI DISTRICTS ────────────────────────────────────────────────────────
const DELHI_DISTRICT_NAMES = [
  'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi',
  'New Delhi', 'North East Delhi', 'North West Delhi', 'South East Delhi',
  'South West Delhi', 'Shahdara'
];

export const DELHI_DISTRICTS_MOCK: Record<string, RegionStats> = {};
DELHI_DISTRICT_NAMES.forEach((name, index) => {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const baseRisk = 60 + Math.floor(seededRandom(deterministicHash(id))() * 30);
  const baseReports = 200 + Math.floor(seededRandom(deterministicHash(id))() * 300);
  DELHI_DISTRICTS_MOCK[id] = createRegionStats(id, name, 'state', baseRisk, baseReports, 'delhi', 'Delhi');
});

// ─── MUMBAI SUBDISTRICTS (WARDS) ────────────────────────────────────────────
const MUMBAI_WARD_NAMES = [
  'Colaba', 'Fort', 'Churchgate', 'Marine Lines', 'Girgaon', 'Malabar Hill',
  'Grant Road', 'Tardeo', 'Byculla', 'Mazgaon', 'Parel', 'Dadar',
  'Mahim', 'Matunga', 'Sion', 'Wadala', 'Kurla', 'Chembur',
  'Govandi', 'Mankhurd', 'Andheri', 'Jogeshwari', 'Goregaon', 'Borivali'
];

export const MUMBAI_SUBDISTRICTS_MOCK: Record<string, RegionStats> = {};
MUMBAI_WARD_NAMES.forEach((name, index) => {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const baseRisk = index < 6 ? 70 + Math.floor(seededRandom(deterministicHash(id))() * 25)
    : index < 14 ? 45 + Math.floor(seededRandom(deterministicHash(id))() * 30)
    : 25 + Math.floor(seededRandom(deterministicHash(id))() * 30);
  const baseReports = index < 6 ? 60 + Math.floor(seededRandom(deterministicHash(id))() * 40)
    : index < 14 ? 30 + Math.floor(seededRandom(deterministicHash(id))() * 30)
    : 15 + Math.floor(seededRandom(deterministicHash(id))() * 20);
  MUMBAI_SUBDISTRICTS_MOCK[id] = createRegionStats(id, name, 'district', baseRisk, baseReports, 'mumbai-city', 'Mumbai City');
});

// ─── PUNE SUBDISTRICTS ──────────────────────────────────────────────────────
const PUNE_SUBDISTRICT_NAMES = [
  'Shivajinagar', 'Kothrud', 'Deccan', 'Hadapsar', 'Hinjewadi',
  'Wakad', 'Baner', 'Viman Nagar', 'Koregaon Park', 'Camp',
  'Swargate', 'Katraj', 'Bibwewadi', 'Warje', 'Pimpri-Chinchwad'
];

export const PUNE_SUBDISTRICTS_MOCK: Record<string, RegionStats> = {};
PUNE_SUBDISTRICT_NAMES.forEach((name, index) => {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const baseRisk = index < 4 ? 65 + Math.floor(seededRandom(deterministicHash(id))() * 25)
    : index < 10 ? 40 + Math.floor(seededRandom(deterministicHash(id))() * 25)
    : 20 + Math.floor(seededRandom(deterministicHash(id))() * 25);
  const baseReports = index < 4 ? 50 + Math.floor(seededRandom(deterministicHash(id))() * 30)
    : index < 10 ? 25 + Math.floor(seededRandom(deterministicHash(id))() * 25)
    : 10 + Math.floor(seededRandom(deterministicHash(id))() * 20);
  PUNE_SUBDISTRICTS_MOCK[id] = createRegionStats(id, name, 'district', baseRisk, baseReports, 'pune', 'Pune');
});

// ─── NAGPUR SUBDISTRICTS ────────────────────────────────────────────────────
const NAGPUR_SUBDISTRICT_NAMES = [
  'Dharampeth', 'Sitabuldi', 'Sadar', 'Civil Lines', 'Itwari',
  'Gandhibagh', 'Lakadganj', 'Nehru Nagar', 'Hanuman Nagar',
  'Manewada', 'Nandanvan', 'Wadi', 'Hingna'
];

export const NAGPUR_SUBDISTRICTS_MOCK: Record<string, RegionStats> = {};
NAGPUR_SUBDISTRICT_NAMES.forEach((name, index) => {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const baseRisk = index < 3 ? 60 + Math.floor(seededRandom(deterministicHash(id))() * 25)
    : index < 8 ? 35 + Math.floor(seededRandom(deterministicHash(id))() * 25)
    : 15 + Math.floor(seededRandom(deterministicHash(id))() * 25);
  const baseReports = index < 3 ? 45 + Math.floor(seededRandom(deterministicHash(id))() * 25)
    : index < 8 ? 20 + Math.floor(seededRandom(deterministicHash(id))() * 20)
    : 8 + Math.floor(seededRandom(deterministicHash(id))() * 15);
  NAGPUR_SUBDISTRICTS_MOCK[id] = createRegionStats(id, name, 'district', baseRisk, baseReports, 'nagpur', 'Nagpur');
});

// ─── SYNTHETIC DATA GENERATOR ───────────────────────────────────────────────
export function generateSyntheticRegions(
  parentName: string,
  count: number,
  parentRiskLevel: string
): Record<string, RegionStats> {
  const result: Record<string, RegionStats> = {};
  const hash = deterministicHash(parentName);
  const rand = seededRandom(hash);

  const baseRisk = parentRiskLevel === 'very_high' ? 60
    : parentRiskLevel === 'high' ? 45
    : parentRiskLevel === 'medium' ? 30
    : 15;

  const suffixes = [
    'North', 'South', 'East', 'West', 'Central',
    'Upper', 'Lower', 'Inner', 'Outer', 'Old',
    'New', 'Greater', 'Lesser', 'Main', 'Sub',
    'Ward-1', 'Ward-2', 'Ward-3', 'Ward-4', 'Ward-5'
  ];

  for (let i = 0; i < count; i++) {
    const suffix = suffixes[i % suffixes.length];
    const name = `${parentName} ${suffix}`;
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const riskScore = Math.min(95, Math.max(5, baseRisk + Math.floor(rand() * 35 - 10)));
    const totalReports = Math.floor(30 + rand() * 200);
    result[id] = createRegionStats(id, name, 'district', riskScore, totalReports, parentName.toLowerCase().replace(/\s+/g, '-'), parentName);
  }

  return result;
}

// ─── MAIN LOOKUP FUNCTION ───────────────────────────────────────────────────
export function getMockDataForRegion(level: MapLevel, parentId?: string): Record<string, RegionStats> {
  if (level === 'national') return INDIA_STATES_MOCK;

  if (level === 'state') {
    switch (parentId) {
      case 'maharashtra': return MAHARASHTRA_DISTRICTS_MOCK;
      case 'uttar-pradesh': return UTTAR_PRADESH_DISTRICTS_MOCK;
      case 'karnataka': return KARNATAKA_DISTRICTS_MOCK;
      case 'delhi': return DELHI_DISTRICTS_MOCK;
      default: {
        const stateData = INDIA_STATES_MOCK[parentId || ''];
        const count = 5 + Math.floor(seededRandom(deterministicHash(parentId || 'default'))() * 15);
        const parentName = stateData?.name || (parentId || 'Region').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const parentRisk = stateData?.riskLevel || 'medium';
        return generateSyntheticRegions(parentName, count, parentRisk);
      }
    }
  }

  if (level === 'district') {
    switch (parentId) {
      case 'mumbai-city': return MUMBAI_SUBDISTRICTS_MOCK;
      case 'pune': return PUNE_SUBDISTRICTS_MOCK;
      case 'nagpur': return NAGPUR_SUBDISTRICTS_MOCK;
      default: {
        const count = 3 + Math.floor(seededRandom(deterministicHash(parentId || 'default'))() * 5);
        const parentName = (parentId || 'Region').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return generateSyntheticRegions(parentName, count, 'medium');
      }
    }
  }

  return {};
}

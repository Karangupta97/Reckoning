// ─── Leaderboard Mock Data ─────────────────────────────────────────────────────

export type { LeaderboardView, LeaderboardScope, TimeFilter, CitizenEntry, AdminEntry, AnyEntry } from "@/types/leaderboard";
import type { CitizenEntry, AdminEntry, GlobalStats, Challenge, StreakData, RankProgress } from "@/types/leaderboard";

// ─── Helper: avatar color palette ─────────────────────────────────────────────

const AVATAR_COLORS = [
  "#F59E0B", "#3B82F6", "#8B5CF6", "#22C55E", "#EC4899",
  "#06B6D4", "#F97316", "#10B981", "#EF4444", "#6366F1",
  "#14B8A6", "#F43F5E", "#84CC16", "#0EA5E9", "#A855F7",
  "#FB923C", "#34D399", "#60A5FA", "#E879F9", "#4ADE80",
];
const DISTRICTS = ["Mumbai", "Pune", "Nashik", "Nagpur", "Aurangabad", "Thane"];
const SUB_DISTRICTS = [
  "Andheri", "Bandra", "Dadar", "Kurla", "Mulund", "Borivali",
  "Vile Parle", "Kandivali", "Malad", "Goregaon", "Chembur", "Wadala",
];
const BADGES_POOL = [
  "Road Guardian", "Evidence Expert", "Hazard Hunter", "Top Contributor",
  "Community Protector", "Quick Reporter", "Flood Watcher", "Signal Guardian",
  "Streak Master", "Video Witness",
];
const ACHIEVEMENTS_POOL = [
  { name: "Road Guardian Level 2", timeAgo: "2 days ago", icon: "shield" },
  { name: "Streak Master: 18 Days", timeAgo: "Today", icon: "flame" },
  { name: "Evidence Expert", timeAgo: "1 week ago", icon: "camera" },
  { name: "Top Contributor", timeAgo: "2 weeks ago", icon: "award" },
  { name: "Hazard Hunter x50", timeAgo: "3 days ago", icon: "construction" },
  { name: "Signal Guardian", timeAgo: "5 days ago", icon: "traffic-cone" },
  { name: "Community Protector", timeAgo: "1 month ago", icon: "shield-check" },
  { name: "Quick Reporter", timeAgo: "Yesterday", icon: "zap" },
];

function pick<T>(arr: T[], count: number, seed: number): T[] {
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(arr[(seed * (i + 1) * 7) % arr.length]);
  }
  return [...new Set(result)];
}

function getAvatarColor(seed: number) {
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

// ─── Citizen Names Pool ────────────────────────────────────────────────────────

const CITIZEN_NAMES = [
  "Arjun Verma", "Priya", "Sneha Iyer", "Ajay Sharma", "Suresh Patil",
  "Neha Joshi", "Karan Verma", "Riya Kapoor", "Aditya Singh", "Vikram Rao",
  "Anjali Deshmukh", "Rahul Mehta", "Pooja Mehta", "Manish Yadav", "Sneha Iyer",
  "Rohit Chauhan", "Deepika Jain", "Amit Kulkarni", "Sunita Bhatt", "Vijay Nair",
  "Kavya Pillai", "Arjun Tiwari", "Meera Saxena", "Gaurav Pandey", "Ritu Mishra",
  "Sachin Kumar", "Preethi Menon", "Harsh Gupta", "Nisha Rawat", "Dinesh Choudhary",
  "Lakshmi Venkat", "Pratik Joshi", "Swati Deshpande", "Sanjay Mane", "Aarti Singh",
  "Kunal Banerjee", "Farah Khan", "Tarun Mathur", "Divya Nambiar", "Nikhil Shetty",
  "Puja Sharma", "Rajesh Bhandari", "Archana Patil", "Sunil Ahuja", "Monali Desai",
  "Yash Parekh", "Isha Trivedi", "Vivek Soni", "Smita Wagh", "Hemant Shirke",
  "Bharti Iyer", "Rajan Pillai", "Chandani Mehta", "Shreyas Naik", "Kanchan Rao",
  "Milind Kulkarni", "Pallavi Shah", "Rohan Tendulkar", "Tina Fernandes", "Varun Kamat",
  "Sushma Hegde", "Girish Pawar", "Nalini Krishnan", "Omkar Rane", "Priya Gaikwad",
  "Sandeep Jadhav", "Amrita Chavan", "Raghav Sinha", "Neeta Bhalerao", "Arun Thakur",
  "Manasi Deshpande", "Siddharth More", "Poornima Nair", "Kiran Salunke", "Digvijay Patil",
  "Lata Ambhore", "Yusuf Shaikh", "Pooja Desai", "Ramesh Teli", "Anita Kher",
  "Parag Vaidya", "Shweta Chitale", "Bhavesh Dalvi", "Sarika Dhuri", "Milind Gokhale",
  "Vandana Hawaldar", "Akash Jog", "Rekha Kadlag", "Sudhir Limaye", "Madhuri Majumdar",
  "Prashant Nagarkar", "Smita Oak", "Balaji Pande", "Rashmi Quazi", "Harish Raut",
  "Sadhana Sawant", "Tejashri Udane", "Bhushan Vaze", "Ketki Wadekar", "Amol Yeole",
];

const ADMIN_NAMES = [
  "Collector Rajiv Mehta", "ACP Sunita Deshpande", "DM Arvind Kumar", "SDM Priya Iyer",
  "Inspector Ramesh Patil", "Coordinator Sneha Shah", "DM Karan Singh", "SDM Monika Rao",
  "Admin Deepak Nair", "Officer Leela Krishnan", "Head Suresh Verma", "Lead Asha Kadam",
  "Chief Prakash Bhat", "Lead Savita Ghosh", "Officer Ravi Dubey", "Head Smita Joshi",
  "Admin Vivek Thakkar", "Coord Nalini Pawar", "Insp Dilip Mane", "Head Jayashri Kulkarni",
  "DM Ashok Chavan", "SDM Meena Shinde", "Admin Anand Tawde", "Officer Jayant Gadge",
  "Lead Prabha Bhosle", "Chief Sanjiv Jagtap", "Coord Ranjana Kale", "Head Mahesh Mandal",
  "Admin Varsha Nimkar", "Officer Omkar Patne", "Lead Prachi Qadir", "Insp Sunil Rankambe",
  "Head Manjushree Salvi", "DM Baban Thorat", "SDM Urmila Utekar", "Admin Chetan Vibhute",
  "Coord Ashwini Wagh", "Lead Yogesh Xalxo", "Chief Sushma Yadav", "Head Balasaheb Zende",
  "Admin Anita Abhang", "Officer Dinkar Bhave", "Lead Vijaya Chitnis", "DM Ganesh Dhole",
  "SDM Hema Ekhande", "Head Jagdish Fulpagare", "Chief Kamla Gawde", "Coord Lata Hatkar",
  "Admin Madhukar Ingale", "Officer Nanda Jambhale", "Lead Pandurang Kuchekar", "Insp Radha Lokre",
  "Head Sadashiv Mahajan", "DM Tarala Nikam", "SDM Uma Ovhal", "Admin Pradip Paunikar",
  "Officer Qasim Rahimkar", "Lead Raosaheb Sanas", "Chief Savitri Tambe", "Coord Triloknath Umare",
  "Head Veena Vanve", "Admin Waman Wakde", "SDM Yamini Yadav", "DM Zankar Zore",
  "Lead Amruta Avhad", "Insp Baburao Barve", "Head Chandrakant Chakote", "Admin Devaki Dhami",
  "Officer Eknath Ekale", "Coord Fatima Farooqi", "DM Ganpat Gavhane", "SDM Hirabai Hule",
  "Head Indumati Ingale", "Admin Janabai Jadhav", "Officer Kalpana Kamble", "Lead Laxman Lad",
  "Chief Malti Mhaskar", "Coord Namdeo Navale", "Insp Pramila Phad", "Head Rajani Rakshe",
  "Admin Suman Sanas", "Officer Tulsi Thorat", "DM Usha Ubale", "Lead Vasant Vaidya",
  "SDM Wimal Wakchaure", "Head Asha Yadav", "Admin Bhiku Zende", "Coord Chanda Ambhore",
  "Officer Dagdu Bhalerao", "Lead Esha Chitale", "Chief Fakira Dalvi", "Insp Gita Deshpande",
  "DM Hari Ekoskar", "SDM Indira Fulse", "Head Janaki Gadekar", "Admin Kedar Hamde",
  "Officer Lalita Idrekar", "Lead Maruti Jagtap", "Coord Namita Khemnar", "Head Onkar Lagade",
];

// ─── Generate Citizens ─────────────────────────────────────────────────────────

function generateCitizens(): CitizenEntry[] {
  const entries: CitizenEntry[] = [];
  const pointsTable = [
    8450, 6250, 4930, 4560, 4210, 3980, 3450, 3210, 2980, 2760,
    2540, 2450, 2310, 2100, 1980, 1870, 1760, 1650, 1540, 1120,
  ];

  for (let i = 0; i < 100; i++) {
    const rank = i + 1;
    const name = CITIZEN_NAMES[i] ?? `Citizen ${rank}`;
    const basePoints = i < 20 ? pointsTable[i] : Math.max(1080 - (i - 20) * 10, 50 + (100 - i) * 3);
    const reports = Math.floor(basePoints / 33);
    const verified = Math.floor(reports * (0.7 + (i % 3) * 0.08));
    const resolved = Math.floor(verified * 0.6);
    const reputation = Math.min(99, 60 + Math.floor((basePoints / 8450) * 38) + (i % 5));
    const prevRank = Math.max(1, rank + (i % 3 === 0 ? -(1 + (i % 4)) : i % 4 === 0 ? 0 : (1 + (i % 3))));
    const deltaWeek = Math.floor(basePoints * 0.04) + (i % 7) * 15;

    let avatarUrl: string | undefined = undefined;
    if (rank === 1) {
      avatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80";
    } else if (rank === 2) {
      avatarUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80";
    } else if (rank === 3) {
      avatarUrl = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80";
    }

    entries.push({
      rank,
      prevRank,
      name,
      points: basePoints,
      pointsDeltaWeek: deltaWeek,
      reports,
      verified,
      reputation,
      isCurrentUser: name === "Rahul Mehta",
      avatarColor: getAvatarColor(i),
      avatarUrl,
      initial: getInitial(name),
      isVerifiedUser: reputation >= 85,
      district: DISTRICTS[i % DISTRICTS.length],
      subDistrict: SUB_DISTRICTS[i % SUB_DISTRICTS.length],
      badges: pick(BADGES_POOL, 2 + (i % 3), i),
      totalReports: reports + Math.floor(reports * 0.1),
      validationCount: verified + Math.floor(verified * 0.05),
      resolvedCount: resolved,
      streak: 5 + (i % 20),
      impactScore: Math.min(100, Math.floor((reputation + (basePoints / 8450) * 30))),
      livesImpacted: Math.floor(basePoints / 3.5),
      roadsImproved: Math.floor(reports * 0.15),
      authoritiesNotified: Math.floor(reports * 0.7),
      highRiskReports: Math.floor(reports * 0.1),
      rejections: Math.floor(reports * 0.03),
      authorityActionsTriggered: Math.floor(reports * 0.12),
      recentAchievements: pick(ACHIEVEMENTS_POOL, 3, i + rank),
    });
  }

  return entries;
}

function generateAdmins(): AdminEntry[] {
  const entries: AdminEntry[] = [];

  for (let i = 0; i < 100; i++) {
    const rank = i + 1;
    const name = ADMIN_NAMES[i] ?? `Admin ${rank}`;
    const isDistrictAdmin = i % 3 === 0;
    const issuesResolved = Math.max(10, 320 - i * 3 + (i % 7));
    const avgDays = (1.2 + i * 0.03 + (i % 5) * 0.1).toFixed(1);
    const validationAccuracy = Math.max(60, Math.min(99, 99 - Math.floor(i * 0.35) + (i % 4)));
    const prevRank = Math.max(1, rank + (i % 3 === 0 ? -(1 + (i % 4)) : i % 4 === 0 ? 0 : (1 + (i % 3))));

    entries.push({
      rank,
      prevRank,
      name,
      role: isDistrictAdmin ? "District Admin" : "Sub-District Admin",
      issuesResolved,
      pointsDeltaWeek: Math.floor(issuesResolved * 0.12) + (i % 5) * 3,
      avgResolutionTime: `${avgDays} days`,
      validationAccuracy,
      isCurrentUser: false,
      avatarColor: getAvatarColor(i + 20),
      initial: getInitial(name),
      district: DISTRICTS[i % DISTRICTS.length],
      subDistrict: isDistrictAdmin ? undefined : SUB_DISTRICTS[i % SUB_DISTRICTS.length],
      totalTickets: issuesResolved + Math.floor(issuesResolved * 0.2),
      escalations: Math.floor(issuesResolved * 0.05),
      citizenRating: Math.min(5, 3.5 + (validationAccuracy - 70) / 60),
      responseRate: Math.min(100, validationAccuracy + 2),
    });
  }

  return entries;
}

export const CITIZEN_LEADERBOARD: CitizenEntry[] = generateCitizens();
export const ADMIN_LEADERBOARD: AdminEntry[] = generateAdmins();

export const GLOBAL_STATS: GlobalStats = {
  citizensActive: "12,430",
  reportsSubmitted: "124,578",
  hazardsResolved: "43,210",
  livesImpacted: "1.2M+",
};

export const LEADERBOARD_CHALLENGES: Challenge[] = [
  { id: "lc1", title: "Report 5 Verified Hazards", progress: 3, total: 5, reward: 250, endsAt: "12d 06h" },
  { id: "lc2", title: "Help Verify 10 Reports", progress: 7, total: 10, reward: 300, endsAt: "12d 06h" },
  { id: "lc3", title: "Maintain Daily Streak", progress: 18, total: 30, reward: 100, endsAt: "Ongoing" },
];

export const STREAK_DATA: StreakData = {
  currentStreak: 18,
  longestStreak: 23,
  weekActivity: [true, true, true, true, false, true, false],
};

export const RANK_PROGRESS: RankProgress = {
  currentRank: "Road Guardian",
  currentXP: 2450,
  nextRank: "Hazard Hunter",
  nextRankXP: 3000,
  badgeColor: "#F59E0B",
};

// ─── withMockFallback ──────────────────────────────────────────────────────────
// Wraps an async API call and falls back to mock data on failure.

export async function withMockFallback<T>(
  apiFn: () => Promise<T>,
  mockData: T,
): Promise<T> {
  try {
    return await apiFn();
  } catch {
    return mockData;
  }
}

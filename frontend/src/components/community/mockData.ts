import type { ReportFeedItem, CommentItem, StoryItem, ScopeOption } from "./types";

// ─── Media URLs — Unsplash (free, no attribution required) ───────────────────
// All images: object-cover ready, 800×600 crop
// Videos: autoplay muted loop playsInline

export const MOCK_FEED: ReportFeedItem[] = [
  {
    id: "r1",
    userName: "Rahul M.",
    userInitial: "R",
    userColor: "#3B82F6",
    isAnonymous: false,
    isVerified: true,
    isFollowing: false,
    location: "Andheri West, Mumbai",
    road: "SV Road near Flyover",
    timeAgo: "2h ago",
    hazardType: "pothole",
    hazardEmoji: "🕳",
    severity: "critical",
    title: "Large pothole causing accidents near Andheri Station flyover",
    description:
      "This pothole is 2ft wide, 8 inches deep. Two bikes fell here this week. Municipality unresponsive for 3 weeks. Depth increases every rain.",

    // ── Media ──────────────────────────────────────────────────────
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=70",

    // ── Intelligence Scores ────────────────────────────────────────
    riskScore: 91,
    trustScore: 87,
    verificationPercent: 94,
    authorityStatus: "Assigned — BMC Mumbai",
    verifiedCitizensCount: 38,

    status: "in_progress",
    statusStep: 3,
    upvotes: 247,
    hasUpvoted: false,
    comments: 43,
    shares: 255,
    saves: 2487,
    views: 12400,
    isSaved: false,
    officialResponse: true,
    coordinates: { lat: 19.1197, lng: 72.8464 },
  },

  {
    id: "r2",
    userName: "Sneha D.",
    userInitial: "S",
    userColor: "#22C55E",
    isAnonymous: false,
    isVerified: true,
    isFollowing: true,
    location: "Bandra West, Mumbai",
    road: "Hill Road near Lucky Junction",
    timeAgo: "4h ago",
    hazardType: "flooding",
    hazardEmoji: "🌊",
    severity: "high",
    title: "Severe waterlogging blocking entire road after heavy rain",
    description:
      "Water level rose 3 feet in just 2 hours. Multiple vehicles stranded. Drainage completely blocked by garbage. Kids unable to reach school.",

    // ── Media ──────────────────────────────────────────────────────
    mediaType: "video",
    mediaUrl:
      "https://cdn.pixabay.com/video/2020/07/31/46404-446298818_large.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=400&q=70",

    // ── Intelligence Scores ────────────────────────────────────────
    riskScore: 78,
    trustScore: 92,
    verificationPercent: 89,
    authorityStatus: "In Review — BMC Ward Office",
    verifiedCitizensCount: 61,

    status: "verified",
    statusStep: 2,
    upvotes: 589,
    hasUpvoted: true,
    comments: 78,
    shares: 412,
    saves: 1890,
    views: 23500,
    isSaved: true,
    officialResponse: true,
    coordinates: { lat: 19.0544, lng: 72.8277 },
  },

  {
    id: "r3",
    userName: "Amit P.",
    userInitial: "A",
    userColor: "#F59E0B",
    isAnonymous: false,
    isVerified: false,
    isFollowing: false,
    location: "Dadar East, Mumbai",
    road: "Tulsi Pipe Road",
    timeAgo: "6h ago",
    hazardType: "broken-signal",
    hazardEmoji: "🚦",
    severity: "medium",
    title: "Traffic signal completely non-functional at major junction",
    description:
      "Signal has been dead for 48 hours. No traffic police present during peak hours. Multiple near-misses observed. Evening rush hour is chaos.",

    // ── Media ──────────────────────────────────────────────────────
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=800&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=400&q=70",

    // ── Intelligence Scores ────────────────────────────────────────
    riskScore: 64,
    trustScore: 71,
    verificationPercent: 68,
    authorityStatus: "Pending — Traffic Police HQ",
    verifiedCitizensCount: 14,

    status: "submitted",
    statusStep: 1,
    upvotes: 134,
    hasUpvoted: false,
    comments: 21,
    shares: 67,
    saves: 445,
    views: 5600,
    isSaved: false,
    officialResponse: false,
    coordinates: { lat: 19.0178, lng: 72.8478 },
  },

  {
    id: "r4",
    userName: "Kavita N.",
    userInitial: "K",
    userColor: "#8B5CF6",
    isAnonymous: false,
    isVerified: true,
    isFollowing: true,
    location: "Borivali West, Mumbai",
    road: "S.V. Road near Rajendra Nagar",
    timeAgo: "12h ago",
    hazardType: "debris",
    hazardEmoji: "🪨",
    severity: "low",
    title: "Construction debris dumped on footpath blocking pedestrian access",
    description:
      "Builder has dumped rubble from construction site on the main footpath. Pedestrians forced to walk on road. Elderly & wheelchair users most affected.",

    // ── Media ──────────────────────────────────────────────────────
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=70",

    // ── Intelligence Scores ────────────────────────────────────────
    riskScore: 42,
    trustScore: 88,
    verificationPercent: 100,
    authorityStatus: "Resolved — BMC Borivali",
    verifiedCitizensCount: 9,

    status: "resolved",
    statusStep: 5,
    upvotes: 89,
    hasUpvoted: false,
    comments: 12,
    shares: 34,
    saves: 156,
    views: 3200,
    isSaved: false,
    officialResponse: true,
    coordinates: { lat: 19.2307, lng: 72.8567 },
  },

  {
    id: "r5",
    userName: "Anonymous",
    userInitial: "?",
    userColor: "#6B7280",
    isAnonymous: true,
    isVerified: false,
    isFollowing: false,
    location: "Kurla West, Mumbai",
    road: "LBS Marg near Kurla Station",
    timeAgo: "1h ago",
    hazardType: "accident",
    hazardEmoji: "💥",
    severity: "critical",
    title: "Major accident zone — broken divider causing head-on collisions",
    description:
      "Divider broken since last week. 3 accidents in 2 days. Nobody from BMC has come to repair. Extremely dangerous at night with no street lighting.",

    // ── Media ──────────────────────────────────────────────────────
    mediaType: "video",
    mediaUrl:
      "https://cdn.pixabay.com/video/2016/09/08/5068-182856752_large.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=400&q=70",

    // ── Intelligence Scores ────────────────────────────────────────
    riskScore: 96,
    trustScore: 79,
    verificationPercent: 82,
    authorityStatus: "Escalated — Mumbai Police + BMC",
    verifiedCitizensCount: 104,

    status: "in_progress",
    statusStep: 3,
    upvotes: 712,
    hasUpvoted: false,
    comments: 156,
    shares: 890,
    saves: 4200,
    views: 45000,
    isSaved: false,
    officialResponse: true,
    coordinates: { lat: 19.0726, lng: 72.8794 },
  },

  {
    id: "r6",
    userName: "Priya S.",
    userInitial: "P",
    userColor: "#EC4899",
    isAnonymous: false,
    isVerified: true,
    isFollowing: false,
    location: "Kothrud, Pune",
    road: "Karve Road near MIT College",
    timeAgo: "3h ago",
    hazardType: "pothole",
    hazardEmoji: "🕳",
    severity: "high",
    title: "Deep pothole near MIT College gate causing daily accidents",
    description:
      "Students are getting injured daily. Pothole appeared after last monsoon and keeps growing. PMC has ignored 5 complaints over 3 months.",

    // ── Media ──────────────────────────────────────────────────────
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1560782205-4dd83ceb0270?auto=format&fit=crop&w=800&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1560782205-4dd83ceb0270?auto=format&fit=crop&w=400&q=70",

    // ── Intelligence Scores ────────────────────────────────────────
    riskScore: 74,
    trustScore: 85,
    verificationPercent: 77,
    authorityStatus: "Pending — PMC Kothrud Division",
    verifiedCitizensCount: 29,

    status: "verified",
    statusStep: 2,
    upvotes: 345,
    hasUpvoted: false,
    comments: 67,
    shares: 234,
    saves: 1200,
    views: 18000,
    isSaved: false,
    officialResponse: false,
    coordinates: { lat: 18.5074, lng: 73.8077 },
  },

  {
    id: "r7",
    userName: "Vikram R.",
    userInitial: "V",
    userColor: "#06B6D4",
    isAnonymous: false,
    isVerified: false,
    isFollowing: false,
    location: "Dharampeth, Nagpur",
    road: "Central Avenue Road",
    timeAgo: "8h ago",
    hazardType: "waterlogging",
    hazardEmoji: "💧",
    severity: "high",
    title: "Chronic waterlogging at central avenue — sewage overflow",
    description:
      "Every rain causes sewage to overflow here. Stench is unbearable. Health hazard for nearby residents and shopkeepers. Reported thrice this year.",

    // ── Media ──────────────────────────────────────────────────────
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1601128533718-374ffcca299b?auto=format&fit=crop&w=800&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1601128533718-374ffcca299b?auto=format&fit=crop&w=400&q=70",

    // ── Intelligence Scores ────────────────────────────────────────
    riskScore: 69,
    trustScore: 66,
    verificationPercent: 58,
    authorityStatus: "Pending — Nagpur Municipal Corporation",
    verifiedCitizensCount: 17,

    status: "submitted",
    statusStep: 1,
    upvotes: 167,
    hasUpvoted: false,
    comments: 34,
    shares: 78,
    saves: 560,
    views: 7800,
    isSaved: false,
    officialResponse: false,
    coordinates: { lat: 21.1458, lng: 79.0882 },
  },

  {
    id: "r8",
    userName: "Deepak T.",
    userInitial: "D",
    userColor: "#EF4444",
    isAnonymous: false,
    isVerified: true,
    isFollowing: true,
    location: "NH-48, Vasai",
    road: "Mumbai-Ahmedabad Highway",
    timeAgo: "5h ago",
    hazardType: "guardrail",
    hazardEmoji: "🛡️",
    severity: "critical",
    title: "Broken guardrail on highway — vehicles going off road at night",
    description:
      "50m section of guardrail missing after truck crash. No warning signs installed. 2 cars went off road last night. Immediate NHAI action needed.",

    // ── Media ──────────────────────────────────────────────────────
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=400&q=70",

    // ── Intelligence Scores ────────────────────────────────────────
    riskScore: 88,
    trustScore: 91,
    verificationPercent: 86,
    authorityStatus: "Assigned — NHAI Vasai Division",
    verifiedCitizensCount: 47,

    status: "in_progress",
    statusStep: 3,
    upvotes: 423,
    hasUpvoted: false,
    comments: 89,
    shares: 567,
    saves: 3100,
    views: 34000,
    isSaved: false,
    officialResponse: true,
    coordinates: { lat: 19.3607, lng: 72.8397 },
  },

  {
    id: "r9",
    userName: "Neha J.",
    userInitial: "N",
    userColor: "#10B981",
    isAnonymous: false,
    isVerified: false,
    isFollowing: false,
    location: "Andheri East, Mumbai",
    road: "MIDC Road near Chakala",
    timeAgo: "1d ago",
    hazardType: "street-light",
    hazardEmoji: "💡",
    severity: "low",
    title: "8 consecutive street lights non-functional — pitch dark after 7pm",
    description:
      "Entire stretch is completely dark after sunset. Women feel unsafe walking here. Two chain-snatching incidents reported this week. Reported thrice.",

    // ── Media ──────────────────────────────────────────────────────
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=800&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=400&q=70",

    // ── Intelligence Scores ────────────────────────────────────────
    riskScore: 55,
    trustScore: 73,
    verificationPercent: 61,
    authorityStatus: "Pending — MSEDCL Andheri",
    verifiedCitizensCount: 22,

    status: "verified",
    statusStep: 2,
    upvotes: 198,
    hasUpvoted: false,
    comments: 28,
    shares: 89,
    saves: 670,
    views: 9200,
    isSaved: false,
    officialResponse: false,
    coordinates: { lat: 19.1136, lng: 72.8697 },
  },

  {
    id: "r10",
    userName: "Suresh K.",
    userInitial: "S",
    userColor: "#F97316",
    isAnonymous: false,
    isVerified: true,
    isFollowing: false,
    location: "Thane West, Mumbai",
    road: "Ghodbunder Road",
    timeAgo: "30m ago",
    hazardType: "cave-in",
    hazardEmoji: "🕳",
    severity: "critical",
    title: "Road cave-in on Ghodbunder Road — entire lane collapsed",
    description:
      "Major cave-in 10ft wide. Underground pipe burst caused the collapse. Traffic diverted but no barricades placed. I heard the collapse from my apartment at 3 AM.",

    // ── Media ──────────────────────────────────────────────────────
    mediaType: "video",
    mediaUrl:
      "https://cdn.pixabay.com/video/2020/03/25/34444-402088612_large.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?auto=format&fit=crop&w=400&q=70",

    // ── Intelligence Scores ────────────────────────────────────────
    riskScore: 98,
    trustScore: 95,
    verificationPercent: 97,
    authorityStatus: "Emergency — Thane MC + PWD On-Site",
    verifiedCitizensCount: 183,

    status: "in_progress",
    statusStep: 4,
    upvotes: 891,
    hasUpvoted: false,
    comments: 234,
    shares: 1200,
    saves: 5600,
    views: 67000,
    isSaved: false,
    officialResponse: true,
    coordinates: { lat: 19.2183, lng: 72.9781 },
  },
];

// ─── Comments (unchanged — realistic already) ────────────────────────────────

export const MOCK_COMMENTS: Record<string, CommentItem[]> = {
  r1: [
    { id: "c1", userName: "Priya K.", initial: "P", color: "#22C55E", text: "Confirmed! Almost damaged my scooter here yesterday evening 😔", likes: 34, timeAgo: "2h", isOfficial: false, isPinned: false, replies: [] },
    { id: "c2", userName: "BMC Mumbai", initial: "B", color: "#3B82F6", text: "We have logged this (Ref: BMC-2026-4821). Repair team assigned, ETA 48 hours.", likes: 89, timeAgo: "1h", isOfficial: true, isPinned: true, replies: [
      { id: "r1", userName: "Rahul M.", text: "Thank you! Please prioritize this 🙏", likes: 12, timeAgo: "45m" },
      { id: "r2", userName: "Priya K.", text: "Finally some response. Hope they actually fix it this time.", likes: 8, timeAgo: "30m" },
    ] },
    { id: "c3", userName: "Amit S.", initial: "A", color: "#F59E0B", text: "I reported this 2 weeks ago too. Nothing happened then. Glad it is getting attention now.", likes: 56, timeAgo: "3h", isOfficial: false, isPinned: false, replies: [] },
    { id: "c4", userName: "Meera R.", initial: "M", color: "#EC4899", text: "Same pothole caused a rickshaw to tip over yesterday. Driver got injured 😢", likes: 45, timeAgo: "4h", isOfficial: false, isPinned: false, replies: [] },
    { id: "c5", userName: "Deepak V.", initial: "D", color: "#8B5CF6", text: "This entire stretch is horrible. Not just this one pothole.", likes: 23, timeAgo: "5h", isOfficial: false, isPinned: false, replies: [] },
    { id: "c6", userName: "Sanjay P.", initial: "S", color: "#06B6D4", text: "I use this road daily. Have to zigzag like crazy. Total nightmare.", likes: 19, timeAgo: "5h", isOfficial: false, isPinned: false, replies: [] },
    { id: "c7", userName: "Nisha T.", initial: "N", color: "#10B981", text: "Put a barricade at least! Someone will die here.", likes: 67, timeAgo: "6h", isOfficial: false, isPinned: false, replies: [] },
    { id: "c8", userName: "Rajesh B.", initial: "R", color: "#F97316", text: "Shared this on WhatsApp groups. Let us make this viral 🔥", likes: 28, timeAgo: "6h", isOfficial: false, isPinned: false, replies: [] },
    { id: "c9", userName: "Traffic Police", initial: "TP", color: "#3B82F6", text: "We are aware of the situation. Advisory issued for commuters to use alternate route.", likes: 43, timeAgo: "7h", isOfficial: true, isPinned: false, replies: [] },
    { id: "c10", userName: "Kishore M.", initial: "K", color: "#EF4444", text: "Third time this year same spot collapses. Quality of repair work is terrible.", likes: 78, timeAgo: "8h", isOfficial: false, isPinned: false, replies: [] },
  ],
  r2: [
    { id: "c11", userName: "Rohan G.", initial: "R", color: "#3B82F6", text: "My car engine got hydrolocked here last monsoon. Insurance did not cover it 😤", likes: 67, timeAgo: "3h", isOfficial: false, isPinned: false, replies: [] },
    { id: "c12", userName: "BMC Ward Office", initial: "B", color: "#3B82F6", text: "Emergency pumps deployed. Drainage cleaning scheduled for tomorrow 6 AM.", likes: 112, timeAgo: "2h", isOfficial: true, isPinned: true, replies: [
      { id: "r3", userName: "Sneha D.", text: "Thank you for quick response! 🙏", likes: 15, timeAgo: "1h" },
    ] },
    { id: "c13", userName: "Pooja M.", initial: "P", color: "#EC4899", text: "Kids could not go to school today because of this. Happens every monsoon! 😢", likes: 45, timeAgo: "4h", isOfficial: false, isPinned: false, replies: [] },
    { id: "c14", userName: "Vikram S.", initial: "V", color: "#F59E0B", text: "The garbage in drains is the root cause. Need regular cleaning before monsoon.", likes: 89, timeAgo: "4h", isOfficial: false, isPinned: false, replies: [] },
  ],
  r3: [
    { id: "c15", userName: "Sagar K.", initial: "S", color: "#22C55E", text: "I nearly got into an accident here yesterday. Chaos during evening rush hour.", likes: 23, timeAgo: "5h", isOfficial: false, isPinned: false, replies: [] },
    { id: "c16", userName: "Anita R.", initial: "A", color: "#8B5CF6", text: "Traffic police should at least station someone here temporarily.", likes: 34, timeAgo: "6h", isOfficial: false, isPinned: false, replies: [] },
  ],
  r5: [
    { id: "c17", userName: "Mumbai Police", initial: "MP", color: "#3B82F6", text: "Highway patrol alerted. Temporary barricades being set up. Use caution.", likes: 156, timeAgo: "30m", isOfficial: true, isPinned: true, replies: [
      { id: "r4", userName: "Anonymous", text: "About time! People are risking lives here.", likes: 34, timeAgo: "20m" },
    ] },
    { id: "c18", userName: "Manoj D.", initial: "M", color: "#EF4444", text: "I saw the accident last night. Horrifying. This needs immediate repair.", likes: 89, timeAgo: "1h", isOfficial: false, isPinned: false, replies: [] },
  ],
  r10: [
    { id: "c19", userName: "Thane MC", initial: "T", color: "#3B82F6", text: "Emergency team on site. Road closed for repairs. Expected completion: 72 hours.", likes: 234, timeAgo: "15m", isOfficial: true, isPinned: true, replies: [
      { id: "r5", userName: "Suresh K.", text: "72 hours?! This is a main road! Please expedite.", likes: 56, timeAgo: "10m" },
    ] },
    { id: "c20", userName: "Ganesh R.", initial: "G", color: "#F97316", text: "I could hear the road collapse from my apartment. Terrifying sound at 3 AM.", likes: 123, timeAgo: "25m", isOfficial: false, isPinned: false, replies: [] },
  ],
};

// ─── Stories ─────────────────────────────────────────────────────────────────

export const MOCK_STORIES: StoryItem[] = [
  { id: "s1", type: "new", label: "Report" },
  { id: "s2", type: "report", emoji: "🕳", location: "Andheri W", severity: "critical", reportId: "r1",
    thumbnailUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=120&q=60" },
  { id: "s3", type: "report", emoji: "🌊", location: "Bandra", severity: "high", reportId: "r2",
    thumbnailUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=120&q=60" },
  { id: "s4", type: "report", emoji: "🚦", location: "Dadar", severity: "medium", reportId: "r3",
    thumbnailUrl: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=120&q=60" },
  { id: "s5", type: "report", emoji: "💥", location: "Kurla", severity: "critical", reportId: "r5",
    thumbnailUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=120&q=60" },
  { id: "s6", type: "report", emoji: "🪨", location: "Borivali", severity: "low", reportId: "r4",
    thumbnailUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=120&q=60" },
  { id: "s7", type: "report", emoji: "🕳", location: "Pune", severity: "high", reportId: "r6",
    thumbnailUrl: "https://images.unsplash.com/photo-1560782205-4dd83ceb0270?auto=format&fit=crop&w=120&q=60" },
  { id: "s8", type: "report", emoji: "💧", location: "Nagpur", severity: "high", reportId: "r7",
    thumbnailUrl: "https://images.unsplash.com/photo-1601128533718-374ffcca299b?auto=format&fit=crop&w=120&q=60" },
];

// ─── Scope Options ────────────────────────────────────────────────────────────

export const SCOPE_OPTIONS: ScopeOption[] = [
  { key: "sub-district", icon: "📍", label: "My Sub-district", sublabel: "Andheri West", count: "247 reports" },
  { key: "district",     icon: "🏙", label: "My District",     sublabel: "Mumbai City",  count: "1.2K reports" },
  { key: "state",        icon: "🏛", label: "My State",        sublabel: "Maharashtra",  count: "8.4K reports" },
  { key: "national",     icon: "🇮🇳", label: "National",       sublabel: "All India",    count: "52K reports" },
];

// ─── Status Steps ─────────────────────────────────────────────────────────────

export const STATUS_STEPS = [
  "Submitted",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolved",
] as const;

// ─── Severity Config ──────────────────────────────────────────────────────────

export const SEVERITY_COLORS: Record<string, string> = {
  low:      "#22C55E",
  medium:   "#F59E0B",
  high:     "#F97316",
  critical: "#EF4444",
};

export const SEVERITY_LABELS: Record<string, string> = {
  low:      "Low",
  medium:   "Medium",
  high:     "High",
  critical: "Critical",
};

// ─── Risk Score Colors (for UI badge rendering) ───────────────────────────────

export const RISK_SCORE_COLOR = (score: number): string => {
  if (score >= 85) return "#EF4444"; // Critical — red
  if (score >= 65) return "#F97316"; // High — orange
  if (score >= 45) return "#F59E0B"; // Medium — amber
  return "#22C55E";                  // Low — green
};

// ─── Media Renderer Helper (use in component) ─────────────────────────────────
//
//  if (item.mediaType === "image") {
//    return <img src={item.mediaUrl} className="w-full h-full object-cover" />
//  }
//
//  if (item.mediaType === "video") {
//    return (
//      <video
//        src={item.mediaUrl}
//        poster={item.thumbnailUrl}
//        autoPlay
//        muted
//        loop
//        playsInline
//        className="w-full h-full object-cover"
//      />
//    )
//  }
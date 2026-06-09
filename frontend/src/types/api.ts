export interface WeeklyActivity {
  day: string;
  reports: number;
  resolved: number;
}

export interface DashboardSummary {
  totalReports: number;
  openReports: number;
  resolvedReports: number;
  criticalReports: number;
  resolutionRate: number;
  rankPercentile: number;
  rankArea: string;
  streakDays: number;
  impactScore: number;
  weeklyActivity: WeeklyActivity[];
}

export interface DistrictBreakdown {
  district: string;
  open: number;
  resolved: number;
  escalated: number;
  slaBreached: number;
}

export interface AdminOverview {
  totalComplaints: number;
  pendingComplaints: number;
  resolvedToday: number;
  escalatedComplaints: number;
  averageResolutionDays: number;
  slaBreachCount: number;
  districtBreakdown: DistrictBreakdown[];
}
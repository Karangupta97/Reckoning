/**
 * xp-dispatcher.ts
 *
 * Central XP dispatcher — call from any store action to:
 * 1. Add XP to the relevant portal's achievement profile
 * 2. Check and unlock badges
 * 3. Update streak
 * 4. Log achievement event
 *
 * This replaces hardcoded scores with activity-driven metrics.
 */

import { useAchievementStore, DISTRICT_XP_RULES, SUBDISTRICT_XP_RULES, type AdminPortalType } from "@/store/achievementStore";

type XPAction =
  | "complaint_resolved"
  | "escalation_closed"
  | "escalation_assigned"
  | "evidence_verified"
  | "evidence_submitted"
  | "sla_achieved"
  | "sla_maintained"
  | "governance_processed"
  | "budget_approved"
  | "ticket_completed"
  | "escalation_handled"
  | "resolution_approved"
  | "field_inspection"
  | "complaint_rejected"
  | "streak_daily"
  | "streak_weekly"
  | "streak_monthly";

/**
 * Award XP for a specific action in a specific portal.
 * Automatically checks badge unlock conditions.
 */
export function awardXP(portal: AdminPortalType, action: XPAction, context?: string): void {
  const rules = portal === "district" ? DISTRICT_XP_RULES : SUBDISTRICT_XP_RULES;
  const xp = rules[action];
  if (!xp) return;

  const store = useAchievementStore.getState();
  store.addXP(portal, action, xp);

  // Log achievement event
  store.addEvent(portal, {
    title: `+${xp} XP — ${formatActionLabel(action)}`,
    description: context ?? `Earned from ${formatActionLabel(action).toLowerCase()}`,
    icon: getActionIcon(action),
    timeAgo: "Just now",
    type: xp >= 50 ? "points" : "action",
    xpGained: xp,
  });

  // Check badge unlocks
  checkBadgeUnlocks(portal);
}

/**
 * Check if any badges should be unlocked based on current profile state.
 */
function checkBadgeUnlocks(portal: AdminPortalType): void {
  const store = useAchievementStore.getState();
  const key = portal === "district" ? "district" : "subDistrict";
  const profile = store[key];

  for (const badge of profile.badges) {
    if (badge.unlocked) continue;
    if (badge.progress !== undefined && badge.total && badge.progress >= badge.total) {
      store.unlockBadge(portal, badge.id);
    }
  }
}

/**
 * Increment badge progress for a specific badge.
 */
export function incrementBadgeProgress(portal: AdminPortalType, badgeId: string, amount = 1): void {
  const store = useAchievementStore.getState();
  const key = portal === "district" ? "district" : "subDistrict";
  const profile = store[key];
  const badge = profile.badges.find(b => b.id === badgeId);
  if (!badge || badge.unlocked) return;

  const newProgress = (badge.progress ?? 0) + amount;
  // Update the badge progress in store
  const updatedBadges = profile.badges.map(b =>
    b.id === badgeId ? { ...b, progress: Math.min(newProgress, b.total ?? newProgress) } : b
  );

  // Direct state update for badge progress
  useAchievementStore.setState({
    [key]: { ...profile, badges: updatedBadges },
  });

  // Check if unlocked
  if (badge.total && newProgress >= badge.total) {
    store.unlockBadge(portal, badgeId);
  }
}

function formatActionLabel(action: XPAction): string {
  const map: Record<string, string> = {
    complaint_resolved: "Complaint Resolved",
    escalation_closed: "Escalation Closed",
    escalation_assigned: "Escalation Assigned",
    evidence_verified: "Evidence Verified",
    evidence_submitted: "Evidence Submitted",
    sla_achieved: "SLA Achieved",
    sla_maintained: "SLA Maintained",
    governance_processed: "Governance Processed",
    budget_approved: "Budget Approved",
    ticket_completed: "Ticket Completed",
    escalation_handled: "Escalation Handled",
    resolution_approved: "Resolution Approved",
    field_inspection: "Field Inspection",
    complaint_rejected: "Complaint Rejected",
    streak_daily: "Daily Streak",
    streak_weekly: "Weekly Streak Bonus",
    streak_monthly: "Monthly Streak Bonus",
  };
  return map[action] ?? action;
}

function getActionIcon(action: XPAction): string {
  const map: Record<string, string> = {
    complaint_resolved: "check-circle",
    escalation_closed: "shield-check",
    escalation_assigned: "shield",
    evidence_verified: "camera",
    evidence_submitted: "camera",
    sla_achieved: "trophy",
    sla_maintained: "shield-check",
    governance_processed: "landmark",
    budget_approved: "trophy",
    ticket_completed: "check-circle",
    escalation_handled: "zap",
    resolution_approved: "check-circle",
    field_inspection: "shield",
    complaint_rejected: "zap",
    streak_daily: "flame",
    streak_weekly: "flame",
    streak_monthly: "trophy",
  };
  return map[action] ?? "star";
}

/**
 * demo-reset.ts — Clears all persisted Zustand stores and reloads.
 * Used by judges/demo to replay the full workflow from scratch.
 */

const STORE_KEYS = [
  "reckoning-complaints",
  "reckoning-escalation",
  "reckoning-evidence",
  "reckoning-budget-approval",
  "reckoning-governance-requests",
  "reckoning-complaint-workflow",
  "reckoning-audit-log",
  "reckoning-achievements",
  "reckoning-leaderboard",
  "reckoning-admin-notifications",
  "reckoning-admin-users",
  "reckoning-date-range",
];

/**
 * Clear all Zustand persisted stores and reload the page.
 * This reseeds all data back to initial state.
 */
export function resetDemoData(): void {
  if (typeof window === "undefined") return;

  for (const key of STORE_KEYS) {
    localStorage.removeItem(key);
  }

  // Also clear any partially matching keys
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith("reckoning-")) {
      localStorage.removeItem(key);
    }
  }

  // Reload to reseed from store defaults
  window.location.reload();
}

/**
 * Check if stores have been modified from defaults.
 */
export function hasModifiedData(): boolean {
  if (typeof window === "undefined") return false;
  return STORE_KEYS.some((key) => localStorage.getItem(key) !== null);
}

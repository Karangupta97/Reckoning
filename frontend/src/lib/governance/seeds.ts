/**
 * Centralized governance mock-data exports — single source for all admin stores.
 */

import { buildGovernanceDataset } from "@/lib/governance/seed-generator";

const dataset = buildGovernanceDataset();

export const GOVERNANCE_COMPLAINTS = dataset.complaints;
export const GOVERNANCE_ESCALATIONS = dataset.escalations;
export const GOVERNANCE_EVIDENCE = dataset.evidence;
export const GOVERNANCE_BUDGETS = dataset.budgets;
export const GOVERNANCE_ADMIN_USERS = dataset.adminUsers;

export { buildGovernanceDataset } from "@/lib/governance/seed-generator";
export * from "@/lib/governance/district-structure";
export * from "@/lib/governance/date-range";

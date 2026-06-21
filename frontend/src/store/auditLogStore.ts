/**
 * auditLogStore.ts — Super Admin unified audit trail (frontend only).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adminPersistOptions } from "@/lib/store-persist";

export type AuditCategory =
  | "User Actions"
  | "Approval Actions"
  | "Escalations"
  | "Budget Decisions"
  | "Evidence Decisions"
  | "Governance";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userRole: string;
  actor: string;
  action: string;
  entityId: string;
  previousStatus: string;
  newStatus: string;
  category: AuditCategory;
  ip?: string;
}

function nowTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())} ${d.toLocaleString("en", { month: "short" })} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const SEED: AuditLogEntry[] = [
  { id: "LOG-8821", timestamp: "04 Jun 2026 11:42", userRole: "Super Admin", actor: "Super Admin", action: "Approved contractor verification", entityId: "CTR-203", previousStatus: "Pending", newStatus: "Verified", category: "Approval Actions", ip: "192.168.1.10" },
  { id: "LOG-8820", timestamp: "04 Jun 2026 11:18", userRole: "System", actor: "System", action: "AI anomaly detected — NH-48 budget spike", entityId: "ALT-001", previousStatus: "—", newStatus: "Flagged", category: "Budget Decisions", ip: "—" },
  { id: "LOG-8819", timestamp: "04 Jun 2026 10:55", userRole: "Super Admin", actor: "Super Admin", action: "User role updated", entityId: "USR-441", previousStatus: "District Admin", newStatus: "Auditor", category: "User Actions", ip: "192.168.1.10" },
  { id: "LOG-8818", timestamp: "04 Jun 2026 10:30", userRole: "District Admin", actor: "District Admin", action: "Escalation assigned to officer", entityId: "ESC-4021", previousStatus: "Pending Review", newStatus: "Assigned", category: "Escalations", ip: "10.0.0.42" },
  { id: "LOG-8817", timestamp: "04 Jun 2026 09:15", userRole: "Super Admin", actor: "Super Admin", action: "Budget approved with modified amount", entityId: "BUD-2026-003", previousStatus: "Pending Approval", newStatus: "Approved", category: "Budget Decisions", ip: "192.168.1.10" },
  { id: "LOG-8816", timestamp: "04 Jun 2026 08:47", userRole: "System", actor: "System", action: "Failed login attempt — 3 retries", entityId: "AUTH-991", previousStatus: "—", newStatus: "Blocked", category: "User Actions", ip: "203.0.113.99" },
  { id: "LOG-8815", timestamp: "03 Jun 2026 17:30", userRole: "Super Admin", actor: "Super Admin", action: "Access control matrix updated", entityId: "ACL-MAIN", previousStatus: "v2.1", newStatus: "v2.2", category: "User Actions", ip: "192.168.1.10" },
  { id: "LOG-8814", timestamp: "03 Jun 2026 16:22", userRole: "Audit Officer", actor: "Audit Officer", action: "Downloaded contractor risk report", entityId: "CTR-118", previousStatus: "—", newStatus: "—", category: "Approval Actions", ip: "10.0.0.55" },
  { id: "LOG-8813", timestamp: "03 Jun 2026 14:10", userRole: "System", actor: "System", action: "SLA breach auto-escalation triggered", entityId: "ESC-4024", previousStatus: "At Risk", newStatus: "Breached", category: "Escalations", ip: "—" },
  { id: "LOG-8812", timestamp: "03 Jun 2026 12:00", userRole: "Super Admin", actor: "Super Admin", action: "New district admin onboarded", entityId: "USR-512", previousStatus: "—", newStatus: "Active", category: "User Actions", ip: "192.168.1.10" },
  { id: "LOG-8811", timestamp: "03 Jun 2026 11:20", userRole: "Super Admin", actor: "Super Admin", action: "Budget request rejected", entityId: "BUD-2026-004", previousStatus: "Pending Approval", newStatus: "Rejected", category: "Budget Decisions", ip: "192.168.1.10" },
  { id: "LOG-8810", timestamp: "03 Jun 2026 10:05", userRole: "District Officer", actor: "District Officer", action: "Evidence submitted for review", entityId: "EV-2026-002", previousStatus: "—", newStatus: "Pending Review", category: "Evidence Decisions", ip: "10.0.0.18" },
  { id: "LOG-8809", timestamp: "02 Jun 2026 15:40", userRole: "Super Admin", actor: "Super Admin", action: "Evidence flagged for investigation", entityId: "EV-2026-004", previousStatus: "Pending Review", newStatus: "Flagged", category: "Evidence Decisions", ip: "192.168.1.10" },
  { id: "LOG-8808", timestamp: "02 Jun 2026 14:00", userRole: "Super Admin", actor: "Super Admin", action: "Escalation approved for investigation", entityId: "ESC-4030", previousStatus: "Pending Review", newStatus: "Investigating", category: "Escalations", ip: "192.168.1.10" },
  { id: "LOG-8807", timestamp: "01 Jun 2026 16:45", userRole: "Super Admin", actor: "Super Admin", action: "Evidence approved", entityId: "EV-2026-003", previousStatus: "Pending Review", newStatus: "Approved", category: "Evidence Decisions", ip: "192.168.1.10" },
];

interface AuditLogState {
  entries: AuditLogEntry[];
  nextId: number;
  addEntry: (entry: Omit<AuditLogEntry, "id" | "timestamp"> & { timestamp?: string }) => void;
}

export const useAuditLogStore = create<AuditLogState>()(
  persist(
    (set, get) => ({
  entries: SEED,
  nextId: 8832,

  addEntry: (entry) => {
    const id = `LOG-${get().nextId}`;
    set({ nextId: get().nextId + 1 });
    const timestamp = entry.timestamp ?? nowTimestamp();
    const { timestamp: _t, ...rest } = entry;
    set({
      entries: [{ id, timestamp, ...rest }, ...get().entries],
    });
  },
}),
    adminPersistOptions("audit-log", (s) => ({ entries: s.entries, nextId: s.nextId }))
  )
);

export const AUDIT_CATEGORIES: AuditCategory[] = [
  "User Actions",
  "Approval Actions",
  "Escalations",
  "Budget Decisions",
  "Evidence Decisions",
  "Governance",
];

export const AUDIT_CATEGORY_CLS: Record<AuditCategory, string> = {
  "User Actions": "dashboard-table-badge-status-review",
  "Approval Actions": "dashboard-table-badge-status-resolved",
  Escalations: "dashboard-table-badge-status-escalated",
  "Budget Decisions": "dashboard-table-badge-status-open",
  "Evidence Decisions": "dashboard-table-badge-status-review",
  Governance: "dashboard-table-badge-status-resolved",
};

export const AUDIT_CATEGORY_COLOR: Record<AuditCategory, string> = {
  "User Actions": "text-cyan-400",
  "Approval Actions": "text-emerald-400",
  Escalations: "text-orange-400",
  "Budget Decisions": "text-amber-400",
  "Evidence Decisions": "text-purple-400",
  Governance: "text-teal-400",
};

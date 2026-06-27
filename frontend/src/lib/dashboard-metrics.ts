import { SUB_DISTRICT_CONFIG } from "@/lib/sub-district-config";
import { filterByDistrictScope } from "@/lib/district-scope";
import type { ComplaintRecord } from "@/store/complaintStore";
import type { Escalation } from "@/store/escalationStore";
import type { ResolutionRequest, WorkTicket } from "@/store/complaintWorkflowStore";
import type { EvidenceRecord } from "@/store/evidenceStore";

const OPEN_COMPLAINT_STATUSES = new Set(["Open", "Assigned", "In Progress", "Escalated"]);

/**
 * Filter complaints to those belonging to a specific sub-district.
 *
 * @param complaints  Full complaint list from the store.
 * @param subDistrictName  The sub-district to scope to (e.g. "Velachery Taluk").
 *                         Falls back to the static SUB_DISTRICT_CONFIG.name when omitted
 *                         so existing call-sites that don't pass a name keep working.
 */
export function filterSubDistrictComplaints(
  complaints: ComplaintRecord[],
  subDistrictName?: string,
): ComplaintRecord[] {
  const name = subDistrictName ?? SUB_DISTRICT_CONFIG.name;
  return complaints.filter((c) => c.subDistrict === name);
}

export function countOpenComplaints(complaints: ComplaintRecord[]): number {
  return complaints.filter((c) => OPEN_COMPLAINT_STATUSES.has(c.status)).length;
}

export function countResolvedComplaints(complaints: ComplaintRecord[]): number {
  return complaints.filter((c) => c.status === "Resolved").length;
}

export function countEscalatedCases(complaints: ComplaintRecord[], escalations: Escalation[], subDistrictName?: string): number {
  const subEsc = filterSubDistrictEscalations(escalations, subDistrictName);
  const active = subEsc.filter((e) => e.status !== "Resolved" && e.status !== "Closed");
  const fromComplaints = complaints.filter(
    (c) => c.status === "Escalated" || !!c.escalationId
  ).length;
  return Math.max(active.length, fromComplaints);
}

/**
 * Filter escalations to those belonging to a specific sub-district.
 *
 * @param escalations      Full escalation list.
 * @param subDistrictName  Falls back to SUB_DISTRICT_CONFIG.name when omitted.
 */
export function filterSubDistrictEscalations(escalations: Escalation[], subDistrictName?: string): Escalation[] {
  const name = subDistrictName ?? SUB_DISTRICT_CONFIG.name;
  const short = name.replace(" Taluka", "").replace(" Taluk", "");
  return escalations.filter(
    (e) =>
      e.subDistrict === name ||
      e.subDistrict === short ||
      e.subDistrict.includes(short)
  );
}

export function countPendingResolutions(resolutions: ResolutionRequest[]): number {
  return resolutions.filter((r) => r.status === "Pending District Review").length;
}

export function slaBuckets(complaints: ComplaintRecord[]) {
  const active = complaints.filter(
    (c) => c.status !== "Resolved" && c.status !== "Rejected"
  );
  const critical = active.filter((c) => c.slaStatus === "Breached").length;
  const warning = active.filter((c) => c.slaStatus === "At Risk").length;
  const healthy = active.filter((c) => c.slaStatus === "On Track").length;
  return { critical, warning, healthy, total: active.length };
}

export function countSlaWarnings(
  complaints: ComplaintRecord[],
  escalations: Escalation[] = [],
  subDistrictName?: string,
): number {
  const complaintWarnings = complaints.filter(
    (c) =>
      OPEN_COMPLAINT_STATUSES.has(c.status) &&
      (c.slaStatus === "Breached" || c.slaStatus === "At Risk")
  ).length;
  const escWarnings = filterSubDistrictEscalations(escalations, subDistrictName).filter(
    (e) =>
      e.status !== "Resolved" &&
      e.status !== "Closed" &&
      (e.slaStatus === "Breached" || e.slaStatus === "At Risk")
  ).length;
  return complaintWarnings + escWarnings;
}

export function countActiveTickets(tickets: WorkTicket[]): number {
  return tickets.filter((t) => t.status !== "Completed").length;
}

export function countOpenTickets(tickets: WorkTicket[]): number {
  return tickets.filter((t) => t.status === "Open").length;
}

export function countOverdueTickets(tickets: WorkTicket[]): number {
  return tickets.filter((t) => t.status === "Overdue").length;
}

export function workloadStats(complaints: ComplaintRecord[], resolutions: ResolutionRequest[]) {
  return {
    pending: complaints.filter((c) => c.status === "Open").length,
    inProgress: complaints.filter((c) => c.status === "In Progress").length,
    awaiting: countPendingResolutions(resolutions),
    doneToday: complaints.filter((c) => c.status === "Resolved").length,
  };
}

export function urgentComplaints(complaints: ComplaintRecord[], limit = 5) {
  const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return [...complaints]
    .filter((c) => OPEN_COMPLAINT_STATUSES.has(c.status))
    .sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 9;
      const pb = priorityOrder[b.priority] ?? 9;
      if (pa !== pb) return pa - pb;
      if (a.slaStatus === "Breached" && b.slaStatus !== "Breached") return -1;
      if (b.slaStatus === "Breached" && a.slaStatus !== "Breached") return 1;
      return a.slaHours - b.slaHours;
    })
    .slice(0, limit);
}

export function upcomingSlaBreaches(complaints: ComplaintRecord[], limit = 5) {
  return [...complaints]
    .filter(
      (c) =>
        OPEN_COMPLAINT_STATUSES.has(c.status) &&
        (c.slaStatus === "At Risk" || c.slaStatus === "Breached")
    )
    .sort((a, b) => a.slaHours - b.slaHours)
    .slice(0, limit);
}

export function recentResolutions(complaints: ComplaintRecord[], limit = 5) {
  return complaints.filter((c) => c.status === "Resolved").slice(0, limit);
}

export function officerWorkload(complaints: ComplaintRecord[]) {
  const map = new Map<string, { cases: number; slaRiskSum: number }>();
  for (const c of complaints) {
    if (!OPEN_COMPLAINT_STATUSES.has(c.status) || !c.officer || c.officer === "Unassigned") continue;
    const cur = map.get(c.officer) ?? { cases: 0, slaRiskSum: 0 };
    const risk =
      c.slaStatus === "Breached" ? 90 : c.slaStatus === "At Risk" ? 60 : 25;
    map.set(c.officer, { cases: cur.cases + 1, slaRiskSum: cur.slaRiskSum + risk });
  }
  return [...map.entries()]
    .map(([name, { cases, slaRiskSum }]) => ({
      name,
      cases,
      slaRisk: Math.round(slaRiskSum / cases),
      status: cases >= 10 ? "Overloaded" : "Active",
    }))
    .sort((a, b) => b.cases - a.cases);
}

export function zoneHealthScore(complaints: ComplaintRecord[]): number {
  const active = complaints.filter(
    (c) => c.status !== "Resolved" && c.status !== "Rejected"
  );
  if (active.length === 0) return 100;
  const onTrack = active.filter((c) => c.slaStatus === "On Track").length;
  return Math.round((onTrack / active.length) * 100);
}

/* ─── District scope ─────────────────────────────────────────── */

export function filterDistrictEscalations(escalations: Escalation[]): Escalation[] {
  return filterByDistrictScope(escalations, (e) => e.district, (e) => e.state).filter(
    (e) => e.tier !== "super"
  );
}

export function countIncomingEscalations(escalations: Escalation[]): number {
  return filterDistrictEscalations(escalations).filter(
    (e) => e.status === "Pending Review"
  ).length;
}

export function countDistrictOpenEscalations(escalations: Escalation[]): number {
  return filterDistrictEscalations(escalations).filter(
    (e) => e.status !== "Resolved" && e.status !== "Closed"
  ).length;
}

export function countCriticalEscalations(escalations: Escalation[]): number {
  return filterDistrictEscalations(escalations).filter(
    (e) =>
      e.priority === "Critical" &&
      e.status !== "Resolved" &&
      e.status !== "Closed"
  ).length;
}

export function districtSlaCompliance(
  escalations: Escalation[],
  complaints: ComplaintRecord[]
): number {
  const esc = filterDistrictEscalations(escalations).filter(
    (e) => e.status !== "Resolved" && e.status !== "Closed"
  );
  const activeComplaints = complaints.filter(
    (c) => c.status !== "Resolved" && c.status !== "Rejected"
  );
  const total = esc.length + activeComplaints.length;
  if (total === 0) return 100;
  const onTrack =
    esc.filter((e) => e.slaStatus === "On Track").length +
    activeComplaints.filter((c) => c.slaStatus === "On Track").length;
  return Math.round((onTrack / total) * 100);
}

export function countEvidencePendingReview(records: EvidenceRecord[]): number {
  return filterByDistrictScope(records, (r) => r.district, (r) => r.state).filter(
    (r) => r.status === "Pending Review" || r.status === "Additional Requested"
  ).length;
}

export function formatSlaLabel(c: ComplaintRecord): string {
  if (c.slaStatus === "Breached") return "BREACHED";
  return c.slaLabel;
}

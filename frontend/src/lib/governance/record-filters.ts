import type { DateRangePeriod } from "@/lib/governance/date-range";
import { filterByDateRange } from "@/lib/governance/date-range";
import type { ComplaintRecord } from "@/store/complaintStore";
import type { Escalation } from "@/store/escalationStore";
import type { EvidenceRecord } from "@/store/evidenceStore";
import type { BudgetRequest } from "@/store/budgetApprovalStore";
import type { GovernanceRequest } from "@/store/governanceRequestStore";

export function filterComplaintsByPeriod(
  complaints: ComplaintRecord[],
  period: DateRangePeriod
): ComplaintRecord[] {
  return filterByDateRange(
    complaints,
    period,
    (c) => c.date,
    (c) => c.createdDate
  );
}

export function filterEscalationsByPeriod(
  escalations: Escalation[],
  period: DateRangePeriod
): Escalation[] {
  return filterByDateRange(escalations, period, (e) => e.escalatedOn);
}

export function filterEvidenceByPeriod(
  records: EvidenceRecord[],
  period: DateRangePeriod
): EvidenceRecord[] {
  return filterByDateRange(records, period, (r) => r.uploadedAt);
}

export function filterBudgetsByPeriod(
  requests: BudgetRequest[],
  period: DateRangePeriod
): BudgetRequest[] {
  return filterByDateRange(requests, period, (r) => r.submittedOn);
}

export function filterGovernanceByPeriod(
  requests: GovernanceRequest[],
  period: DateRangePeriod
): GovernanceRequest[] {
  return filterByDateRange(requests, period, (r) => r.submittedOn);
}

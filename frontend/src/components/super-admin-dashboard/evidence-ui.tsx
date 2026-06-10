import type { EvidenceRecord, EvidenceStatus } from "@/store/evidenceStore";

export const EVIDENCE_STATUS_CLS: Record<EvidenceStatus, string> = {
  "Pending Review": "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  Rejected: "bg-red-500/15 text-red-400 border border-red-500/30",
  Flagged: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  "Additional Requested": "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
};

export type EvidenceQueueTab = "pending" | "approved" | "rejected" | "flagged";

export const EVIDENCE_TABS: { id: EvidenceQueueTab; label: string }[] = [
  { id: "pending", label: "Pending Evidence Review" },
  { id: "approved", label: "Approved Evidence" },
  { id: "rejected", label: "Rejected Evidence" },
  { id: "flagged", label: "Flagged Evidence" },
];

export function filterEvidenceByTab(tab: EvidenceQueueTab, records: EvidenceRecord[]) {
  switch (tab) {
    case "pending":
      return records.filter((r) => r.status === "Pending Review" || r.status === "Additional Requested");
    case "approved":
      return records.filter((r) => r.status === "Approved");
    case "rejected":
      return records.filter((r) => r.status === "Rejected");
    case "flagged":
      return records.filter((r) => r.status === "Flagged");
    default:
      return records;
  }
}

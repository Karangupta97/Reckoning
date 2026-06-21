/**
 * Deterministic governance mock-data generator — all records are linked and explainable.
 */

import type { ComplaintRecord, ComplaintPriority, ComplaintStatus, ComplaintSLAStatus } from "@/store/complaintStore";
import type { Escalation, EscalationCategory, EscalationPriority, EscalationStatus } from "@/store/escalationStore";
import type { BudgetRequest, BudgetRequestStatus } from "@/store/budgetApprovalStore";
import type { EvidenceRecord, EvidenceStatus } from "@/store/evidenceStore";
import type { AdminUser } from "@/store/adminUserStore";
import { DETAILED_COMPLAINT_SEED } from "@/lib/governance/detailed-complaints";
import { RAIGAD_DISTRICT, RAIGAD_SUB_DISTRICTS, type SubDistrictDefinition } from "@/lib/governance/district-structure";

const REFERENCE = new Date(2026, 5, 9);
const DISTRICT_LABEL = `${RAIGAD_DISTRICT.name} District`;

const COMPLAINT_CATEGORIES = [
  "Road Damage",
  "Waterlogging",
  "Sanitation",
  "Infrastructure",
  "Utilities",
  "Civic",
  "Safety",
] as const;

const COMPLAINT_STATUSES: ComplaintStatus[] = [
  "Open",
  "Assigned",
  "In Progress",
  "Resolved",
  "Escalated",
];

const COMPLAINT_PRIORITIES: ComplaintPriority[] = ["Critical", "High", "Medium", "Low"];
const SLA_STATUSES: ComplaintSLAStatus[] = ["On Track", "At Risk", "Breached"];

function formatIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(d: Date, hours = 9, minutes = 0): string {
  const h = hours % 12 || 12;
  const meridiem = hours >= 12 ? "PM" : "AM";
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} ${d.getFullYear()}, ${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}

function formatShort(d: Date): string {
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} ${d.getFullYear()}`;
}

function dateDaysAgo(days: number): Date {
  const d = new Date(REFERENCE);
  d.setDate(d.getDate() - days);
  return d;
}

function buildComplaint(
  idNum: number,
  sub: SubDistrictDefinition,
  daysAgo: number,
  status: ComplaintStatus,
  priority: ComplaintPriority,
  category: string
): ComplaintRecord {
  const created = dateDaysAgo(daysAgo);
  const officer = sub.officers[idNum % sub.officers.length];
  const slaStatus = SLA_STATUSES[idNum % SLA_STATUSES.length];
  const slaHours = slaStatus === "Breached" ? -6 - (idNum % 20) : slaStatus === "At Risk" ? 2 + (idNum % 8) : 24 + (idNum % 30);

  return {
    id: `CMP-${idNum}`,
    title: `${category} — ${sub.name} Ward ${(idNum % 12) + 1}`,
    description: `${category} reported in ${sub.name}. Field verification and corrective action required under district SLA policy.`,
    category,
    priority,
    status,
    location: `Ward ${(idNum % 12) + 1}, ${sub.name}`,
    coordinates: `${(18.9 + (idNum % 10) * 0.01).toFixed(4)}° N, ${(73.1 + (idNum % 10) * 0.01).toFixed(4)}° E`,
    subDistrict: sub.taluka,
    zone: sub.zone,
    date: formatIso(created),
    createdDate: formatDisplay(created, 8 + (idNum % 10), idNum % 60),
    updatedDate: formatDisplay(dateDaysAgo(Math.max(0, daysAgo - 1)), 10 + (idNum % 6), 15 + (idNum % 45)),
    officer,
    officerAssignedDate: formatShort(created),
    expectedVisit: formatShort(dateDaysAgo(Math.max(0, daysAgo - 2))),
    slaRisk: priority === "Critical" ? "High" : priority === "High" ? "Medium" : "Low",
    supervisor: "District Officer K. Patil",
    slaStatus,
    slaLabel:
      slaStatus === "Breached"
        ? "BREACHED"
        : slaStatus === "At Risk"
          ? `${slaHours}h Left`
          : "On Track",
    slaHours,
    slaTargetHours: 48,
    resolutionTarget: formatShort(dateDaysAgo(Math.max(0, daysAgo - 5))),
    reportCount: 1 + (idNum % 4),
    nearbyCount: idNum % 3,
    resolutionStatus: status === "Resolved" ? "Approved" : "None",
    notes: "",
    evidenceCount: idNum % 4,
    timeline: [
      { label: "Complaint Created", date: formatDisplay(created), done: true, note: "Received via mobile app" },
      { label: "Assigned to Officer", date: formatDisplay(created, 10), done: status !== "Open", note: status !== "Open" ? `Assigned to ${officer}` : "" },
      { label: "Resolution", date: status === "Resolved" ? formatShort(dateDaysAgo(Math.max(0, daysAgo - 3))) : "Pending", done: status === "Resolved", note: "" },
    ],
    activityLog: [
      { time: formatDisplay(created).replace(",", ""), actor: "System", action: "Complaint received and registered" },
    ],
    evidence: { citizen: [], inspection: [], resolution: [] },
  };
}

export function generateExtendedComplaints(): ComplaintRecord[] {
  const out: ComplaintRecord[] = [];
  let idNum = 900;

  for (const sub of RAIGAD_SUB_DISTRICTS) {
    for (let i = 0; i < 11; i++) {
      const daysAgo = 3 + i * 9 + RAIGAD_SUB_DISTRICTS.indexOf(sub) * 2;
      const status = COMPLAINT_STATUSES[(idNum + i) % COMPLAINT_STATUSES.length];
      const priority = COMPLAINT_PRIORITIES[(idNum + i) % COMPLAINT_PRIORITIES.length];
      const category = COMPLAINT_CATEGORIES[(idNum + i) % COMPLAINT_CATEGORIES.length];
      out.push(buildComplaint(idNum, sub, daysAgo, status, priority, category));
      idNum++;
    }
  }

  return out;
}

export function normalizeDetailedComplaints(): ComplaintRecord[] {
  return DETAILED_COMPLAINT_SEED.map((c, index) => {
    const created = dateDaysAgo(5 + index * 4);
    return {
      ...c,
      subDistrict: c.subDistrict.includes("Taluka") ? c.subDistrict : `${c.subDistrict} Taluka`,
      date: formatIso(created),
      createdDate: formatDisplay(created, 8 + (index % 8), 10 + index),
      updatedDate: formatDisplay(dateDaysAgo(Math.max(0, 5 + index * 4 - 1)), 11, 20),
    };
  });
}

export function generateGovernanceComplaints(): ComplaintRecord[] {
  const detailedIds = new Set(normalizeDetailedComplaints().map((c) => c.id));
  const generated = generateExtendedComplaints().filter((c) => !detailedIds.has(c.id));
  return [...normalizeDetailedComplaints(), ...generated];
}

const ESC_TITLES: Record<EscalationCategory, string> = {
  Sanitation: "Sewage overflow — main road",
  Infrastructure: "Structural damage report",
  Flooding: "Waterlogging — low-lying sector",
  "Road Damage": "Pothole cluster — state highway",
  Utilities: "Street light outage",
  Civic: "Illegal encroachment complaint",
  Safety: "Accident black spot",
};

export function generateGovernanceEscalations(complaints: ComplaintRecord[]): Escalation[] {
  const escalatedComplaints = complaints.filter(
    (c) => c.status === "Escalated" || c.priority === "Critical" || c.slaStatus === "Breached"
  );

  const base: Escalation[] = escalatedComplaints.slice(0, 28).map((c, index) => {
    const category = (COMPLAINT_CATEGORIES.includes(c.category as (typeof COMPLAINT_CATEGORIES)[number])
      ? c.category
      : "Infrastructure") as EscalationCategory;
    const priority = c.priority as EscalationPriority;
    const status: EscalationStatus =
      index % 5 === 0
        ? "Pending Review"
        : index % 5 === 1
          ? "Investigating"
          : index % 5 === 2
            ? "Assigned"
            : index % 5 === 3
              ? "Resolved"
              : "Closed";

    return {
      id: `ESC-${4021 + index}`,
      sourceComplaintId: c.id,
      title: ESC_TITLES[category] ?? c.title,
      subDistrict: c.subDistrict.replace(" Taluka", ""),
      district: DISTRICT_LABEL,
      state: RAIGAD_DISTRICT.state,
      category,
      priority,
      status,
      slaStatus: c.slaStatus,
      slaLabel: c.slaLabel,
      slaHours: c.slaHours,
      assignedTo: c.officer,
      escalatedOn: c.createdDate.split(",")[0] ?? formatShort(dateDaysAgo(10 + index)),
      daysOpen: Math.max(0, 10 - (index % 10)),
      tier: index % 7 === 0 ? "super" : "district",
      submittedBy: index % 7 === 0 ? "District Admin" : "Sub-District Officer",
      activityLog: [
        {
          time: formatShort(dateDaysAgo(10 + index)),
          actor: "Sub-District Officer",
          action: `Escalated from ${c.id}`,
        },
      ],
    };
  });

  if (base.length > 3) {
    base[base.length - 1] = {
      ...base[base.length - 1],
      id: "ESC-4035",
      parentEscalationId: base[0]?.id,
      tier: "super",
      status: "Pending Review",
      submittedBy: "District Admin",
      reason: "Requires state-level intervention",
    };
  }

  return base;
}

export function linkComplaintsToEscalations(
  complaints: ComplaintRecord[],
  escalations: Escalation[]
): ComplaintRecord[] {
  const bySource = new Map(
    escalations.filter((e) => e.sourceComplaintId).map((e) => [e.sourceComplaintId!, e.id])
  );
  return complaints.map((c) => {
    const escalationId = bySource.get(c.id);
    if (!escalationId) return c;
    return {
      ...c,
      status: c.status === "Open" ? "Escalated" : c.status,
      escalationId,
    };
  });
}

const EVIDENCE_TYPES = [
  "Photos",
  "Dashcam",
  "Inspection Report",
  "Road Survey",
  "Contractor Submission",
  "Drone Survey",
] as const;

export function generateGovernanceEvidence(
  complaints: ComplaintRecord[],
  escalations: Escalation[]
): EvidenceRecord[] {
  const records: EvidenceRecord[] = [];
  let evIndex = 1;

  for (const c of complaints.filter((x) => x.evidenceCount > 0).slice(0, 18)) {
    const type = EVIDENCE_TYPES[evIndex % EVIDENCE_TYPES.length];
    const status: EvidenceStatus =
      evIndex % 4 === 0
        ? "Approved"
        : evIndex % 4 === 1
          ? "Pending Review"
          : evIndex % 4 === 2
            ? "Additional Requested"
            : "Rejected";

    records.push({
      id: `EV-2026-${String(evIndex).padStart(3, "0")}`,
      relatedEntityId: c.id,
      relatedEntityType: "Complaint",
      title: `${type} — ${c.title}`,
      district: DISTRICT_LABEL,
      state: RAIGAD_DISTRICT.state,
      uploadedBy: c.officer,
      uploadedAt: c.updatedDate,
      status,
      notes: `${type} submitted for ${c.id} in ${c.subDistrict}.`,
      files: [{ id: `f${evIndex}`, label: `${type} bundle`, type: type.includes("Report") ? "pdf" : "image", size: "2.4 MB" }],
      timeline: [
        { label: "Evidence Uploaded", date: c.updatedDate, done: true, note: c.officer },
        { label: "Review", date: status === "Pending Review" ? "Pending" : c.updatedDate, done: status !== "Pending Review", note: "" },
        { label: "Decision", date: status === "Pending Review" ? "Pending" : c.updatedDate, done: status !== "Pending Review", note: status },
      ],
      activityLog: [{ time: c.updatedDate, actor: c.officer, action: `Uploaded ${type} for ${c.id}` }],
    });
    evIndex++;
  }

  for (const e of escalations.slice(0, 8)) {
    const type = EVIDENCE_TYPES[evIndex % EVIDENCE_TYPES.length];
    records.push({
      id: `EV-2026-${String(evIndex).padStart(3, "0")}`,
      relatedEntityId: e.id,
      relatedEntityType: "Escalation",
      title: `${type} — ${e.title}`,
      district: DISTRICT_LABEL,
      state: RAIGAD_DISTRICT.state,
      uploadedBy: e.assignedTo,
      uploadedAt: e.escalatedOn,
      status: evIndex % 2 === 0 ? "Approved" : "Pending Review",
      notes: `Field evidence for ${e.id} linked to ${e.sourceComplaintId ?? "case"}.`,
      files: [{ id: `f${evIndex}`, label: `${type}`, type: "image", size: "1.9 MB" }],
      timeline: [
        { label: "Evidence Uploaded", date: e.escalatedOn, done: true, note: e.assignedTo },
        { label: "Review", date: "Pending", done: false, note: "" },
        { label: "Decision", date: "Pending", done: false, note: "" },
      ],
      activityLog: [{ time: e.escalatedOn, actor: e.assignedTo, action: `Uploaded ${type} for ${e.id}` }],
    });
    evIndex++;
  }

  return records;
}

export function generateGovernanceBudgets(escalations: Escalation[]): BudgetRequest[] {
  const statuses: BudgetRequestStatus[] = [
    "Pending Approval",
    "Approved",
    "Clarification Requested",
    "Rejected",
    "Under Audit",
  ];

  return escalations.slice(0, 18).map((e, index) => {
    const status = statuses[index % statuses.length];
    const requestedAmount = 12 + (index % 8) * 7.5;
    const submittedOn = e.escalatedOn;

    return {
      id: `BUD-2026-${String(index + 1).padStart(3, "0")}`,
      district: DISTRICT_LABEL,
      state: RAIGAD_DISTRICT.state,
      project: `${e.category} remediation — ${e.subDistrict}`,
      requestedAmount,
      approvedAmount: status === "Approved" ? requestedAmount * 0.92 : undefined,
      status,
      priority: e.priority,
      requestType: e.priority === "Critical" ? "Emergency" : "Standard",
      submittedOn,
      submittedBy: "District Officer K. Patil",
      fiscalYear: "2025-26",
      justification: `Budget required for ${e.id} originating from ${e.sourceComplaintId ?? "district operations"}.`,
      notes: status === "Clarification Requested" ? "Awaiting supporting clearance documents." : "",
      linkedEscalationIds: [e.id],
      documents: [{ name: "Cost Estimate", size: "1.2 MB", type: "pdf" }],
      timeline: [
        { label: "Request Submitted", date: submittedOn, done: true, note: "District admin submitted" },
        { label: "Super Admin Review", date: status === "Pending Approval" ? "Pending" : submittedOn, done: status !== "Pending Approval", note: "" },
        { label: "Decision", date: status === "Pending Approval" ? "Pending" : submittedOn, done: status !== "Pending Approval", note: status },
        { label: "Funds Disbursed", date: status === "Approved" ? "Pending" : "—", done: false, note: "" },
      ],
      activityLog: [{ time: submittedOn, actor: "District Officer K. Patil", action: `Submitted budget for ${e.id}` }],
      approvalHistory: [],
      auditTrail: [{ time: submittedOn, actor: "System", event: "Request Created" }],
    };
  });
}

export function generateGovernanceAdminUsers(): AdminUser[] {
  const users: AdminUser[] = [
    {
      id: "USR-1001",
      email: "super.admin@reckoning.gov.in",
      role: "Super Admin",
      designation: "Infrastructure Governance Authority",
      department: "National Infrastructure Governance",
      district: "National",
      status: "Active",
      passwordChanged: true,
      createdBy: "System",
      createdDate: "01 Jan 2026",
      lastLogin: "09 Jun 2026",
      parentAuthority: "System",
    },
    {
      id: "USR-2001",
      email: "district.raigad@gov.in",
      role: "District Admin",
      designation: "District Infrastructure Commissioner",
      department: "Revenue & Public Works",
      district: RAIGAD_DISTRICT.name,
      status: "Active",
      passwordChanged: true,
      createdBy: "USR-1001",
      createdDate: "15 Jan 2026",
      lastLogin: "09 Jun 2026",
      parentAuthority: "Infrastructure Governance Authority",
    },
  ];

  RAIGAD_SUB_DISTRICTS.forEach((sub, index) => {
    users.push({
      id: `USR-300${index + 1}`,
      email: `${sub.id}.operations@gov.in`,
      role: "Sub-District Admin",
      designation: "Sub-District Infrastructure Officer",
      department: "Public Works",
      district: RAIGAD_DISTRICT.name,
      subDistrict: sub.name,
      status: index === 6 ? "Inactive" : "Active",
      passwordChanged: true,
      createdBy: "USR-2001",
      createdDate: formatShort(dateDaysAgo(120 - index * 10)),
      lastLogin: formatShort(dateDaysAgo(index * 2)),
      parentAuthority: "District Infrastructure Commissioner",
    });
  });

  return users;
}

export function buildGovernanceDataset() {
  const complaintsRaw = generateGovernanceComplaints();
  const escalations = generateGovernanceEscalations(complaintsRaw);
  const complaints = linkComplaintsToEscalations(complaintsRaw, escalations);
  const evidence = generateGovernanceEvidence(complaints, escalations);
  const budgets = generateGovernanceBudgets(escalations);
  const adminUsers = generateGovernanceAdminUsers();

  return { complaints, escalations, evidence, budgets, adminUsers };
}

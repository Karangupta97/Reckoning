/**
 * Super-Admin shared mock data.
 * Single source of truth for all super-admin complaint and escalation mock records.
 * Import from here — do NOT duplicate inline in pages.
 */

export type SAPriority = "High" | "Medium" | "Low";
export type SAStatus   = "Open" | "Escalated" | "Under Review" | "Resolved" | "Closed";
export type SASLAStatus = "On Track" | "At Risk" | "Breached";

export interface SAComplaint {
  id: string;
  title: string;
  project: string;
  state: string;
  district: string;
  category: string;
  priority: SAPriority;
  status: SAStatus;
  slaStatus: SASLAStatus;
  slaLabel: string;
  reportedOn: string;
  updatedOn: string;
  reportedBy: string;
  assignedTo: string;
  location: string;
  coordinates: string;
  description: string;
  timeline: { label: string; date: string; done: boolean; note: string }[];
  activityLog: { time: string; actor: string; action: string }[];
  evidence: { label: string; by: string; time: string }[];
}

export const SA_COMPLAINTS: SAComplaint[] = [
  {
    id: "CMP-1024",
    title: "Road Damage — NH-48 Highway Expansion",
    project: "NH-48 Highway Expansion",
    state: "Maharashtra", district: "Pune", category: "Road Damage",
    priority: "High", status: "Open", slaStatus: "At Risk", slaLabel: "6h Left",
    reportedOn: "14 Jun 2026", updatedOn: "14 Jun 2026",
    reportedBy: "Citizen via App", assignedTo: "District Officer Pune",
    location: "NH-48, Pune Bypass, Maharashtra", coordinates: "18.5204° N, 73.8567° E",
    description: "Major road damage on NH-48 near Pune Bypass. Large potholes spanning multiple lanes causing vehicle damage and traffic disruption. Heavy vehicles frequently use this route. Immediate resurfacing required.",
    timeline: [
      { label: "Complaint Filed",      date: "14 Jun, 09:00 AM", done: true,  note: "Via mobile app" },
      { label: "Routed to District",   date: "14 Jun, 09:30 AM", done: true,  note: "Auto-routed by system" },
      { label: "Under Review",         date: "Pending",          done: false, note: "" },
    ],
    activityLog: [
      { time: "14 Jun 09:30", actor: "System",      action: "Complaint routed to Pune District Admin" },
      { time: "14 Jun 09:00", actor: "System",      action: "Complaint received and registered" },
    ],
    evidence: [
      { label: "Road damage photo — front", by: "Citizen", time: "14 Jun 08:58" },
    ],
  },
  {
    id: "CMP-1025",
    title: "Budget Leak — Smart Road Initiative",
    project: "Smart Road Initiative", state: "Karnataka", district: "Bengaluru",
    category: "Budget Leak", priority: "High", status: "Escalated",
    slaStatus: "Breached", slaLabel: "BREACHED",
    reportedOn: "12 Jun 2026", updatedOn: "14 Jun 2026",
    reportedBy: "Audit Officer", assignedTo: "Super Admin Review",
    location: "Outer Ring Road, Bengaluru, Karnataka", coordinates: "12.9716° N, 77.5946° E",
    description: "Significant budget discrepancy detected in Smart Road Initiative project. Expenditure exceeds approved allocation by 28% with no corresponding work completion. Requires immediate financial audit and contractor action.",
    timeline: [
      { label: "Complaint Filed",       date: "12 Jun, 10:00 AM", done: true,  note: "Audit officer report" },
      { label: "Escalated to District", date: "12 Jun, 11:30 AM", done: true,  note: "District admin escalated" },
      { label: "Escalated to Super",    date: "13 Jun, 09:00 AM", done: true,  note: "Budget anomaly confirmed" },
      { label: "Pending Review",        date: "Overdue",          done: false, note: "" },
    ],
    activityLog: [
      { time: "13 Jun 09:00", actor: "District Admin", action: "Escalated to Super Admin — budget anomaly confirmed" },
      { time: "12 Jun 11:30", actor: "District Admin", action: "Initial review flagged discrepancy" },
      { time: "12 Jun 10:00", actor: "Audit Officer",  action: "Budget leak complaint filed" },
    ],
    evidence: [
      { label: "Audit report — Q2",       by: "Audit Officer", time: "12 Jun 10:05" },
      { label: "Expenditure breakdown",   by: "Audit Officer", time: "12 Jun 10:10" },
    ],
  },
  {
    id: "CMP-1026",
    title: "Quality Issue — Urban Road Repair",
    project: "Urban Road Repair", state: "Delhi", district: "New Delhi",
    category: "Quality Issue", priority: "Medium", status: "Under Review",
    slaStatus: "On Track", slaLabel: "20h Left",
    reportedOn: "13 Jun 2026", updatedOn: "14 Jun 2026",
    reportedBy: "Citizen via Portal", assignedTo: "QA Officer Delhi",
    location: "Connaught Place, New Delhi", coordinates: "28.6315° N, 77.2167° E",
    description: "Substandard material used in Urban Road Repair project near Connaught Place. Road resurfacing shows cracks within 2 weeks of completion. Quality standards not met as per NHAI specification.",
    timeline: [
      { label: "Complaint Filed",    date: "13 Jun, 02:00 PM", done: true,  note: "Citizen portal" },
      { label: "Assigned to QA",     date: "13 Jun, 04:00 PM", done: true,  note: "Routed to QA Officer" },
      { label: "Under Review",       date: "14 Jun, 10:00 AM", done: true,  note: "Site inspection scheduled" },
      { label: "Resolution Pending", date: "Pending",          done: false, note: "" },
    ],
    activityLog: [
      { time: "14 Jun 10:00", actor: "QA Officer",   action: "Site inspection scheduled for 15 Jun" },
      { time: "13 Jun 16:00", actor: "System",       action: "Routed to QA Officer Delhi" },
      { time: "13 Jun 14:00", actor: "System",       action: "Complaint received via portal" },
    ],
    evidence: [
      { label: "Road crack — close-up", by: "Citizen", time: "13 Jun 13:55" },
    ],
  },
  {
    id: "CMP-1027",
    title: "Project Delay — State Highway Upgrade",
    project: "State Highway Upgrade", state: "Tamil Nadu", district: "Chennai",
    category: "Delay", priority: "Low", status: "Resolved",
    slaStatus: "On Track", slaLabel: "Resolved",
    reportedOn: "01 Jun 2026", updatedOn: "10 Jun 2026",
    reportedBy: "District Admin", assignedTo: "Contractor Team B",
    location: "SH-49, Chennai Outskirts, Tamil Nadu", coordinates: "13.0827° N, 80.2707° E",
    description: "State Highway Upgrade project delayed by 45 days due to material supply chain issues. Project has now resumed and is on track for completion.",
    timeline: [
      { label: "Delay Reported",     date: "01 Jun, 09:00 AM", done: true, note: "District admin report" },
      { label: "Contractor Notified",date: "01 Jun, 11:00 AM", done: true, note: "Formal notice issued" },
      { label: "Work Resumed",       date: "08 Jun, 08:00 AM", done: true, note: "Materials delivered" },
      { label: "Resolved",           date: "10 Jun, 05:00 PM", done: true, note: "Delay accepted, schedule updated" },
    ],
    activityLog: [
      { time: "10 Jun 17:00", actor: "District Admin", action: "Complaint resolved — project back on schedule" },
      { time: "08 Jun 08:00", actor: "Contractor",     action: "Work resumed after material delivery" },
      { time: "01 Jun 11:00", actor: "System",         action: "Formal delay notice issued to contractor" },
      { time: "01 Jun 09:00", actor: "District Admin", action: "Delay complaint filed" },
    ],
    evidence: [
      { label: "Completion certificate", by: "District Admin", time: "10 Jun 17:05" },
    ],
  },
  {
    id: "CMP-1028",
    title: "Safety Concern — Bridge Connectivity Project",
    project: "Bridge Connectivity Project", state: "Gujarat", district: "Ahmedabad",
    category: "Safety Concern", priority: "High", status: "Open",
    slaStatus: "At Risk", slaLabel: "4h Left",
    reportedOn: "14 Jun 2026", updatedOn: "14 Jun 2026",
    reportedBy: "Site Inspector", assignedTo: "Safety Officer Gujarat",
    location: "River Bridge — Ahmedabad Bypass, Gujarat", coordinates: "23.0225° N, 72.5714° E",
    description: "Structural safety concerns identified in Bridge Connectivity Project. Cracks visible in support pillars. Bridge load capacity may be compromised. Immediate structural audit required before public use.",
    timeline: [
      { label: "Safety Flag Raised", date: "14 Jun, 07:00 AM", done: true,  note: "Site inspector report" },
      { label: "Routed to Safety",   date: "14 Jun, 07:30 AM", done: true,  note: "Auto-routed" },
      { label: "Pending Inspection", date: "Urgent",           done: false, note: "" },
    ],
    activityLog: [
      { time: "14 Jun 07:30", actor: "System",         action: "Complaint routed to Safety Officer Gujarat" },
      { time: "14 Jun 07:00", actor: "Site Inspector", action: "Safety flag raised — structural crack identified" },
    ],
    evidence: [
      { label: "Pillar crack — Zone A", by: "Site Inspector", time: "14 Jun 06:58" },
      { label: "Structural diagram",    by: "Site Inspector", time: "14 Jun 07:02" },
    ],
  },
  {
    id: "CMP-1029",
    title: "Road Damage — PMGSY Bihar Package-22",
    project: "PMGSY Bihar Package-22", state: "Bihar", district: "Patna",
    category: "Road Damage", priority: "High", status: "Escalated",
    slaStatus: "Breached", slaLabel: "BREACHED",
    reportedOn: "10 Jun 2026", updatedOn: "14 Jun 2026",
    reportedBy: "Citizen Group", assignedTo: "Super Admin Review",
    location: "PMGSY Road, Patna Rural, Bihar", coordinates: "25.5941° N, 85.1376° E",
    description: "Multiple PMGSY roads in Package-22 showing severe deterioration within 6 months of construction. Suspected substandard material. Multiple citizen complaints received. Contractor accountability required.",
    timeline: [
      { label: "Complaint Filed",        date: "10 Jun, 08:00 AM", done: true,  note: "Citizen group petition" },
      { label: "District Escalated",     date: "11 Jun, 10:00 AM", done: true,  note: "Beyond district capacity" },
      { label: "Super Admin Escalated",  date: "12 Jun, 09:00 AM", done: true,  note: "Pattern detected across Package-22" },
      { label: "Pending Review",         date: "Overdue",          done: false, note: "" },
    ],
    activityLog: [
      { time: "12 Jun 09:00", actor: "District Admin", action: "Escalated — systematic quality failure detected" },
      { time: "11 Jun 10:00", actor: "District Admin", action: "Beyond local resolution capacity" },
      { time: "10 Jun 08:00", actor: "System",         action: "Citizen group complaint registered" },
    ],
    evidence: [
      { label: "Road condition survey", by: "District Admin", time: "11 Jun 09:00" },
    ],
  },
  {
    id: "CMP-1030",
    title: "Project Delay — Rural Connectivity UP-31",
    project: "Rural Connectivity UP-31", state: "Uttar Pradesh", district: "Lucknow",
    category: "Delay", priority: "Medium", status: "Open",
    slaStatus: "On Track", slaLabel: "48h Left",
    reportedOn: "13 Jun 2026", updatedOn: "13 Jun 2026",
    reportedBy: "District Admin", assignedTo: "Project Manager UP-31",
    location: "Rural Road Network, Lucknow District, UP", coordinates: "26.8467° N, 80.9462° E",
    description: "Rural Connectivity UP-31 project delayed by 60 days. Monsoon preparedness window closing. Delayed completion will leave 12 villages without all-weather road access before monsoon season.",
    timeline: [
      { label: "Delay Reported", date: "13 Jun, 10:00 AM", done: true,  note: "District admin" },
      { label: "Review Pending", date: "Pending",          done: false, note: "" },
    ],
    activityLog: [
      { time: "13 Jun 10:00", actor: "District Admin", action: "Delay complaint filed — monsoon risk flagged" },
    ],
    evidence: [],
  },
  {
    id: "CMP-1031",
    title: "Quality Issue — SH-17 Rehabilitation",
    project: "SH-17 Rehabilitation", state: "Karnataka", district: "Mysuru",
    category: "Quality Issue", priority: "Medium", status: "Under Review",
    slaStatus: "On Track", slaLabel: "12h Left",
    reportedOn: "12 Jun 2026", updatedOn: "14 Jun 2026",
    reportedBy: "QA Officer", assignedTo: "QA Director Karnataka",
    location: "SH-17, Mysuru Region, Karnataka", coordinates: "12.2958° N, 76.6394° E",
    description: "Rehabilitation work on SH-17 failing quality benchmarks. Bitumen mix does not conform to MORTH specifications. Independent lab tests commissioned.",
    timeline: [
      { label: "QA Complaint Filed", date: "12 Jun, 11:00 AM", done: true,  note: "QA officer field report" },
      { label: "Lab Test Ordered",   date: "13 Jun, 09:00 AM", done: true,  note: "Independent lab engaged" },
      { label: "Review Ongoing",     date: "Pending",          done: false, note: "" },
    ],
    activityLog: [
      { time: "13 Jun 09:00", actor: "QA Director",  action: "Independent lab test ordered" },
      { time: "12 Jun 11:00", actor: "QA Officer",   action: "Quality complaint filed with lab evidence" },
    ],
    evidence: [
      { label: "Field quality report", by: "QA Officer",  time: "12 Jun 10:55" },
      { label: "Bitumen sample test",  by: "QA Director", time: "13 Jun 09:05" },
    ],
  },
  {
    id: "CMP-1032",
    title: "Safety Concern — ODR Phase-III",
    project: "ODR Phase-III", state: "Odisha", district: "Bhubaneswar",
    category: "Safety Concern", priority: "High", status: "Open",
    slaStatus: "At Risk", slaLabel: "3h Left",
    reportedOn: "14 Jun 2026", updatedOn: "14 Jun 2026",
    reportedBy: "Site Inspector", assignedTo: "Safety Officer Odisha",
    location: "ODR Phase-III, Bhubaneswar Periphery, Odisha", coordinates: "20.2961° N, 85.8245° E",
    description: "Safety barriers missing on ODR Phase-III elevated section. 2.4 km stretch without crash barriers poses severe risk. Work completion certificate was issued incorrectly.",
    timeline: [
      { label: "Safety Flag",     date: "14 Jun, 08:00 AM", done: true,  note: "Inspector field visit" },
      { label: "Review Pending",  date: "Urgent",           done: false, note: "" },
    ],
    activityLog: [
      { time: "14 Jun 08:00", actor: "Site Inspector", action: "Missing safety barriers flagged on 2.4km stretch" },
    ],
    evidence: [
      { label: "Missing barrier photo — km 3.2", by: "Site Inspector", time: "14 Jun 07:58" },
    ],
  },
  {
    id: "CMP-1033",
    title: "Budget Leak — District Road Network",
    project: "District Road Network", state: "Rajasthan", district: "Jaipur",
    category: "Budget Leak", priority: "Low", status: "Resolved",
    slaStatus: "On Track", slaLabel: "Resolved",
    reportedOn: "05 Jun 2026", updatedOn: "12 Jun 2026",
    reportedBy: "Audit Cell", assignedTo: "Finance Officer Rajasthan",
    location: "District Roads, Jaipur Region, Rajasthan", coordinates: "26.9124° N, 75.7873° E",
    description: "Minor budget discrepancy in District Road Network project resolved after audit. Clerical error in billing confirmed. Amount recovered from contractor.",
    timeline: [
      { label: "Complaint Filed",  date: "05 Jun, 10:00 AM", done: true, note: "Audit cell review" },
      { label: "Investigation",    date: "07 Jun, 09:00 AM", done: true, note: "Finance team review" },
      { label: "Resolved",         date: "12 Jun, 03:00 PM", done: true, note: "Clerical error — amount recovered" },
    ],
    activityLog: [
      { time: "12 Jun 15:00", actor: "Finance Officer", action: "Resolved — clerical billing error, amount recovered" },
      { time: "07 Jun 09:00", actor: "Finance Team",    action: "Investigation initiated" },
      { time: "05 Jun 10:00", actor: "Audit Cell",      action: "Budget discrepancy complaint filed" },
    ],
    evidence: [
      { label: "Audit report",       by: "Audit Cell",     time: "05 Jun 10:05" },
      { label: "Recovery receipt",   by: "Finance Officer",time: "12 Jun 15:05" },
    ],
  },
];

export const SA_COMPLAINT_MAP = Object.fromEntries(SA_COMPLAINTS.map(c => [c.id, c]));

export const priorityBadge: Record<SAPriority, string> = {
  High:   "dashboard-table-badge-priority-high",
  Medium: "dashboard-table-badge-priority-medium",
  Low:    "dashboard-table-badge-priority-low",
};

export const statusBadge: Record<SAStatus, string> = {
  Open:           "dashboard-table-badge-status-open",
  Escalated:      "dashboard-table-badge-status-escalated",
  "Under Review": "dashboard-table-badge-status-review",
  Resolved:       "dashboard-table-badge-status-resolved",
  Closed:         "dashboard-table-badge-status-resolved",
};

export const slaBadgeColor: Record<string, string> = {
  Breached:   "#ef4444",
  "At Risk":  "#f59e0b",
  "On Track": "#10b981",
};

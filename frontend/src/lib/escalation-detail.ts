import { DISTRICT_CONFIG } from "@/lib/district-config";
import type { Escalation } from "@/store/escalationStore";

export interface EscalationDetailView {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: Escalation["priority"];
  status: Escalation["status"];
  slaStatus: Escalation["slaStatus"];
  slaLabel: string;
  slaHours: number;
  subDistrict: string;
  location: string;
  coordinates: string;
  zone: string;
  assignedTo: string;
  assignedDate: string;
  expectedResolution: string;
  supervisor: string;
  escalatedOn: string;
  daysOpen: number;
  timeline: { label: string; date: string; done: boolean; note: string }[];
  activityLog: { time: string; actor: string; action: string }[];
}

export function buildEscalationDetail(esc: Escalation): EscalationDetailView {
  const district = esc.district ?? `${DISTRICT_CONFIG.name} District`;
  const activity = esc.activityLog ?? [];
  const timeline = [
    {
      label: "Escalation Received",
      date: esc.escalatedOn,
      done: true,
      note: esc.tier === "super" ? "Escalated from district admin" : "Received from sub-district",
    },
    {
      label: "Assigned",
      date: esc.assignedTo !== "Unassigned" ? esc.escalatedOn : "Pending",
      done: esc.assignedTo !== "Unassigned",
      note: esc.assignedTo !== "Unassigned" ? esc.assignedTo : "",
    },
    {
      label: "Investigation",
      date: ["Investigating", "Resolved", "Closed"].includes(esc.status) ? esc.escalatedOn : "Pending",
      done: ["Investigating", "Resolved", "Closed"].includes(esc.status),
      note: "",
    },
    {
      label: "Resolution",
      date: ["Resolved", "Closed"].includes(esc.status) ? "Completed" : "Pending",
      done: ["Resolved", "Closed"].includes(esc.status),
      note: esc.status,
    },
  ];

  return {
    id: esc.id,
    title: esc.title,
    description:
      esc.reason ??
      esc.notes ??
      `Escalation regarding ${esc.title} in ${esc.subDistrict}, ${district}.`,
    category: esc.category,
    priority: esc.priority,
    status: esc.status,
    slaStatus: esc.slaStatus,
    slaLabel: esc.slaLabel,
    slaHours: esc.slaHours,
    subDistrict: esc.subDistrict,
    location: `${esc.subDistrict}, ${district}`,
    coordinates: "18.752° N, 73.323° E",
    zone: esc.subDistrict,
    assignedTo: esc.assignedTo,
    assignedDate: esc.escalatedOn,
    expectedResolution: esc.slaLabel === "Resolved" || esc.slaLabel === "Closed" ? "—" : "Per SLA",
    supervisor: esc.submittedBy ?? "District Officer",
    escalatedOn: esc.escalatedOn,
    daysOpen: esc.daysOpen,
    timeline,
    activityLog: activity,
  };
}

export function fallbackEscalationDetail(id: string): EscalationDetailView {
  return buildEscalationDetail({
    id,
    title: `Escalation ${id}`,
    subDistrict: "Unknown",
    category: "Civic",
    priority: "High",
    status: "Pending Review",
    slaStatus: "At Risk",
    slaLabel: "Unknown",
    slaHours: 0,
    assignedTo: "Unassigned",
    escalatedOn: "—",
    daysOpen: 0,
  });
}

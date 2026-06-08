/**
 * escalationStore.ts
 *
 * Single source of truth for all escalation records.
 * Both district-admin and sub-district-admin read and write from here,
 * so an escalation created from sub-district-admin appears immediately
 * in the district-admin Escalation Management Center — no backend needed.
 */

import { create } from "zustand";

export type EscalationPriority = "Critical" | "High" | "Medium" | "Low";
export type EscalationStatus   = "Pending Review" | "Assigned" | "Investigating" | "Resolved" | "Closed";
export type EscalationCategory =
  | "Sanitation" | "Infrastructure" | "Flooding" | "Road Damage"
  | "Utilities"  | "Civic"          | "Safety";
export type EscalationSLAStatus = "On Track" | "At Risk" | "Breached";

export interface Escalation {
  id: string;
  /** Original complaint ID that triggered this escalation (e.g. CMP-1024) */
  sourceComplaintId?: string;
  title: string;
  subDistrict: string;
  category: EscalationCategory;
  priority: EscalationPriority;
  status: EscalationStatus;
  slaStatus: EscalationSLAStatus;
  slaLabel: string;
  slaHours: number;
  assignedTo: string;
  escalatedOn: string;
  daysOpen: number;
  /** Free-text reason supplied when escalating from sub-district */
  reason?: string;
  notes?: string;
}

/* ─── Seed data (previously hard-coded in escalation/page.tsx) ── */
const SEED: Escalation[] = [
  { id:"ESC-4021", title:"Sewage overflow — Main Road",         subDistrict:"Mehrauli",    category:"Sanitation",     priority:"Critical", status:"Pending Review", slaStatus:"Breached",  slaLabel:"BREACHED",  slaHours:-18, assignedTo:"R. Sharma", escalatedOn:"28 May 2026", daysOpen:7  },
  { id:"ESC-4022", title:"Bridge structural crack report",       subDistrict:"Dwarka",      category:"Infrastructure", priority:"Critical", status:"Investigating",  slaStatus:"At Risk",   slaLabel:"2h Left",   slaHours:2,   assignedTo:"A. Singh",  escalatedOn:"01 Jun 2026", daysOpen:3  },
  { id:"ESC-4023", title:"Waterlogging — Sector 8",              subDistrict:"Rohini",      category:"Flooding",       priority:"High",     status:"Assigned",       slaStatus:"At Risk",   slaLabel:"6h Left",   slaHours:6,   assignedTo:"S. Gupta",  escalatedOn:"30 May 2026", daysOpen:5  },
  { id:"ESC-4024", title:"Road pothole cluster — NH-48",         subDistrict:"Vasant Kunj", category:"Road Damage",    priority:"High",     status:"Pending Review", slaStatus:"Breached",  slaLabel:"BREACHED",  slaHours:-30, assignedTo:"P. Iyer",   escalatedOn:"26 May 2026", daysOpen:9  },
  { id:"ESC-4025", title:"Street light outage — Block C",        subDistrict:"Shahdara",    category:"Utilities",      priority:"Medium",   status:"Investigating",  slaStatus:"On Track",  slaLabel:"14h Left",  slaHours:14,  assignedTo:"M. Khan",   escalatedOn:"03 Jun 2026", daysOpen:2  },
  { id:"ESC-4026", title:"Illegal construction complaint",       subDistrict:"Najafgarh",   category:"Civic",          priority:"Low",      status:"Resolved",       slaStatus:"On Track",  slaLabel:"Resolved",  slaHours:99,  assignedTo:"T. Verma",  escalatedOn:"02 Jun 2026", daysOpen:0  },
  { id:"ESC-4027", title:"Broken water main — Ward 4",           subDistrict:"Mehrauli",    category:"Infrastructure", priority:"Critical", status:"Investigating",  slaStatus:"At Risk",   slaLabel:"4h Left",   slaHours:4,   assignedTo:"R. Sharma", escalatedOn:"31 May 2026", daysOpen:4  },
  { id:"ESC-4028", title:"Garbage dump — Market area",           subDistrict:"Shahdara",    category:"Sanitation",     priority:"High",     status:"Assigned",       slaStatus:"Breached",  slaLabel:"BREACHED",  slaHours:-6,  assignedTo:"M. Khan",   escalatedOn:"29 May 2026", daysOpen:6  },
  { id:"ESC-4029", title:"Footpath encroachment report",         subDistrict:"Vasant Kunj", category:"Civic",          priority:"Medium",   status:"Closed",         slaStatus:"On Track",  slaLabel:"Closed",    slaHours:99,  assignedTo:"P. Iyer",   escalatedOn:"04 Jun 2026", daysOpen:0  },
  { id:"ESC-4030", title:"Road accident black spot",             subDistrict:"Dwarka",      category:"Safety",         priority:"Critical", status:"Pending Review", slaStatus:"At Risk",   slaLabel:"1h Left",   slaHours:1,   assignedTo:"A. Singh",  escalatedOn:"03 Jun 2026", daysOpen:2  },
  { id:"ESC-4031", title:"Collapsed boundary wall — Park",       subDistrict:"Rohini",      category:"Infrastructure", priority:"High",     status:"Pending Review", slaStatus:"On Track",  slaLabel:"20h Left",  slaHours:20,  assignedTo:"S. Gupta",  escalatedOn:"04 Jun 2026", daysOpen:1  },
  { id:"ESC-4032", title:"Open drain near school",               subDistrict:"Mehrauli",    category:"Sanitation",     priority:"Critical", status:"Assigned",       slaStatus:"At Risk",   slaLabel:"3h Left",   slaHours:3,   assignedTo:"R. Sharma", escalatedOn:"04 Jun 2026", daysOpen:1  },
];

/* ─── Counter to generate new ESC IDs deterministically ───── */
let _nextId = 4033;
function nextEscId(): string {
  return `ESC-${_nextId++}`;
}

/* ─── Store ─────────────────────────────────────────────────── */
interface EscalationState {
  escalations: Escalation[];
  /** Add a new escalation (called from sub-district-admin complaint details) */
  addEscalation: (entry: Omit<Escalation, "id" | "status" | "slaStatus" | "slaLabel" | "slaHours" | "assignedTo" | "daysOpen" | "escalatedOn">) => string;
}

export const useEscalationStore = create<EscalationState>((set) => ({
  escalations: SEED,

  addEscalation: (entry) => {
    const id = nextEscId();
    const today = new Date();
    const escalatedOn = today.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(",", "");

    const newEscalation: Escalation = {
      ...entry,
      id,
      status: "Pending Review",
      slaStatus: entry.priority === "Critical" ? "At Risk" : "On Track",
      slaLabel: entry.priority === "Critical" ? "24h Left" : entry.priority === "High" ? "48h Left" : "72h Left",
      slaHours: entry.priority === "Critical" ? 24 : entry.priority === "High" ? 48 : 72,
      assignedTo: "Unassigned",
      daysOpen: 0,
      escalatedOn,
    };

    set((state) => ({ escalations: [newEscalation, ...state.escalations] }));
    return id;
  },
}));

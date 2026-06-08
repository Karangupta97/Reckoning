"use client";

import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

type Priority = "Critical" | "High" | "Medium" | "Low";
type Status = "Open" | "Escalated" | "Under Review" | "Resolved";

interface Escalation {
  id: string;
  title: string;
  subDistrict: string;
  category: string;
  priority: Priority;
  status: Status;
  daysOpen: number;
}

const escalations: Escalation[] = [
  {
    id: "ESC-4021",
    title: "Sewage overflow — Main Road",
    subDistrict: "Mehrauli",
    category: "Sanitation",
    priority: "Critical",
    status: "Open",
    daysOpen: 7,
  },
  {
    id: "ESC-4022",
    title: "Bridge structural crack report",
    subDistrict: "Dwarka",
    category: "Infrastructure",
    priority: "Critical",
    status: "Escalated",
    daysOpen: 3,
  },
  {
    id: "ESC-4023",
    title: "Waterlogging — Sector 8",
    subDistrict: "Rohini",
    category: "Flooding",
    priority: "High",
    status: "Under Review",
    daysOpen: 5,
  },
  {
    id: "ESC-4024",
    title: "Road pothole cluster — NH-48",
    subDistrict: "Vasant Kunj",
    category: "Road Damage",
    priority: "High",
    status: "Open",
    daysOpen: 9,
  },
  {
    id: "ESC-4025",
    title: "Street light outage — Block C",
    subDistrict: "Shahdara",
    category: "Utilities",
    priority: "Medium",
    status: "Under Review",
    daysOpen: 2,
  },
  {
    id: "ESC-4026",
    title: "Illegal construction complaint",
    subDistrict: "Najafgarh",
    category: "Civic",
    priority: "Low",
    status: "Resolved",
    daysOpen: 0,
  },
  {
    id: "ESC-4027",
    title: "Broken water main — Ward 4",
    subDistrict: "Mehrauli",
    category: "Infrastructure",
    priority: "Critical",
    status: "Escalated",
    daysOpen: 4,
  },
  {
    id: "ESC-4028",
    title: "Garbage dump — Market area",
    subDistrict: "Shahdara",
    category: "Sanitation",
    priority: "High",
    status: "Open",
    daysOpen: 6,
  },
  {
    id: "ESC-4029",
    title: "Road accident black spot",
    subDistrict: "Dwarka",
    category: "Safety",
    priority: "Critical",
    status: "Open",
    daysOpen: 2,
  },
];

const priorityBadgeClass: Record<Priority, string> = {
  Critical: "dashboard-table-badge-risk-critical",
  High: "dashboard-table-badge-priority-high",
  Medium: "dashboard-table-badge-priority-medium",
  Low: "dashboard-table-badge-priority-low",
};

const statusBadgeClass: Record<Status, string> = {
  Open: "dashboard-table-badge-status-open",
  Escalated: "dashboard-table-badge-status-escalated",
  "Under Review": "dashboard-table-badge-status-review",
  Resolved: "dashboard-table-badge-status-resolved",
};

export default function EscalationsTable() {
  return (
    <DashboardCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col p-5"
    >
      <div className="dashboard-table-header">
        <div>
          <h3 className="text-primary text-sm font-semibold lg:text-base">
            Recent Escalations
          </h3>
          <p className="text-muted mt-1 text-xs">
            Active & pending district escalations
          </p>
        </div>
        <button type="button" className="da-btn-secondary shrink-0 !h-9 !px-3 !text-xs">
          View All
        </button>
      </div>

      <div className="dashboard-table-scroll flex-1" style={{ maxHeight: "22rem" }}>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th className="dashboard-table-th">Escalation ID</th>
              <th className="dashboard-table-th">Title</th>
              <th className="dashboard-table-th">Sub-District</th>
              <th className="dashboard-table-th">Category</th>
              <th className="dashboard-table-th">Priority</th>
              <th className="dashboard-table-th">Status</th>
              <th className="dashboard-table-th">Days Open</th>
            </tr>
          </thead>
          <tbody>
            {escalations.map((e, index) => (
              <motion.tr
                key={e.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.04 }}
                className="dashboard-table-row da-table-row"
              >
                <td className="dashboard-table-td">
                  <div className="flex min-w-0 items-center gap-2">
                    <ShieldAlert
                      size={14}
                      className="shrink-0 text-teal-400"
                      aria-hidden
                    />
                    <span className="dashboard-table-td-mono truncate" style={{ color: "var(--da-teal)" }}>
                      {e.id}
                    </span>
                  </div>
                </td>
                <td className="dashboard-table-td dashboard-table-td-primary max-w-[12rem] truncate sm:max-w-[14rem]">
                  {e.title}
                </td>
                <td className="dashboard-table-td whitespace-nowrap">
                  {e.subDistrict}
                </td>
                <td className="dashboard-table-td whitespace-nowrap">
                  {e.category}
                </td>
                <td className="dashboard-table-td">
                  <span className={`dashboard-table-badge ${priorityBadgeClass[e.priority]}`}>
                    {e.priority}
                  </span>
                </td>
                <td className="dashboard-table-td">
                  <span className={`dashboard-table-badge ${statusBadgeClass[e.status]}`}>
                    {e.status}
                  </span>
                </td>
                <td className="dashboard-table-td tabular-nums">
                  <span
                    className={`text-xs font-semibold ${
                      e.daysOpen >= 7
                        ? "text-red-400"
                        : e.daysOpen >= 4
                        ? "text-amber-400"
                        : "text-teal-400"
                    }`}
                  >
                    {e.daysOpen === 0 ? "—" : `${e.daysOpen}d`}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}

"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

type Priority = "High" | "Medium" | "Low";
type Status = "Open" | "Escalated" | "Under Review" | "Resolved";

interface Complaint {
  id: string;
  project: string;
  state: string;
  category: string;
  priority: Priority;
  status: Status;
}

const complaints: Complaint[] = [
  {
    id: "CMP-1024",
    project: "NH-48 Highway Expansion",
    state: "Maharashtra",
    category: "Road Damage",
    priority: "High",
    status: "Open",
  },
  {
    id: "CMP-1025",
    project: "Smart Road Initiative",
    state: "Karnataka",
    category: "Budget Leak",
    priority: "High",
    status: "Escalated",
  },
  {
    id: "CMP-1026",
    project: "Urban Road Repair",
    state: "Delhi",
    category: "Quality Issue",
    priority: "Medium",
    status: "Under Review",
  },
  {
    id: "CMP-1027",
    project: "State Highway Upgrade",
    state: "Tamil Nadu",
    category: "Delay",
    priority: "Low",
    status: "Resolved",
  },
  {
    id: "CMP-1028",
    project: "Bridge Connectivity Project",
    state: "Gujarat",
    category: "Safety Concern",
    priority: "High",
    status: "Open",
  },
];

const priorityBadgeClass: Record<Priority, string> = {
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

export default function ComplaintsTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="dashboard-table-section"
    >
      <div className="dashboard-table-header">
        <div>
          <h3 className="text-primary text-sm font-semibold lg:text-base">
            Recent Complaints
          </h3>
          <p className="text-muted mt-1 text-xs">
            Citizen complaints & escalations
          </p>
        </div>
        <button type="button" className="btn-secondary shrink-0 !h-9 !px-3 !text-xs">
          View All
        </button>
      </div>

      <div className="dashboard-table-scroll">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th className="dashboard-table-th">Complaint ID</th>
              <th className="dashboard-table-th">Project</th>
              <th className="dashboard-table-th">State</th>
              <th className="dashboard-table-th">Category</th>
              <th className="dashboard-table-th">Priority</th>
              <th className="dashboard-table-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint, index) => (
              <motion.tr
                key={complaint.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.04 }}
                className="dashboard-table-row"
              >
                <td className="dashboard-table-td">
                  <div className="flex min-w-0 items-center gap-2">
                    <AlertTriangle
                      size={14}
                      className="shrink-0 text-[var(--color-danger)]"
                      aria-hidden
                    />
                    <span className="dashboard-table-td-mono truncate">
                      {complaint.id}
                    </span>
                  </div>
                </td>
                <td className="dashboard-table-td dashboard-table-td-primary max-w-[14rem] truncate">
                  {complaint.project}
                </td>
                <td className="dashboard-table-td whitespace-nowrap">
                  {complaint.state}
                </td>
                <td className="dashboard-table-td whitespace-nowrap">
                  {complaint.category}
                </td>
                <td className="dashboard-table-td">
                  <span
                    className={`dashboard-table-badge ${priorityBadgeClass[complaint.priority]}`}
                  >
                    {complaint.priority}
                  </span>
                </td>
                <td className="dashboard-table-td">
                  <span
                    className={`dashboard-table-badge ${statusBadgeClass[complaint.status]}`}
                  >
                    {complaint.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

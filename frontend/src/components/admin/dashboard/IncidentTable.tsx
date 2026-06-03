"use client";

import { memo } from "react";

const INCIDENTS = [
  {
    id: "RW-4821",
    location: "Sinhagad Road",
    area: "Ward 12, Pune",
    type: "Pothole Cluster",
    severity: "critical",
    status: "open",
    reported: "2h ago",
    aiConf: "94%",
  },
  {
    id: "RW-4819",
    location: "FC Road Junction",
    area: "Ward 8, Pune",
    type: "Surface Crack",
    severity: "high",
    status: "in-progress",
    reported: "4h ago",
    aiConf: "87%",
  },
  {
    id: "RW-4817",
    location: "Hinjewadi Phase 1",
    area: "Ward 3, Pune",
    type: "Waterlogging",
    severity: "high",
    status: "open",
    reported: "6h ago",
    aiConf: "91%",
  },
  {
    id: "RW-4815",
    location: "Katraj Tunnel Exit",
    area: "Ward 15, Pune",
    type: "Road Collapse",
    severity: "critical",
    status: "in-progress",
    reported: "8h ago",
    aiConf: "96%",
  },
  {
    id: "RW-4812",
    location: "Baner Link Road",
    area: "Ward 5, Pune",
    type: "Pothole",
    severity: "medium",
    status: "open",
    reported: "12h ago",
    aiConf: "82%",
  },
  {
    id: "RW-4808",
    location: "Kharadi Bypass",
    area: "Ward 9, Pune",
    type: "Drain Overflow",
    severity: "low",
    status: "resolved",
    reported: "1d ago",
    aiConf: "89%",
  },
];

function IncidentTable() {
  return (
    <div className="dash-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-title-dot"></span>
          Recent Incidents
        </div>
        <div className="panel-actions">
          <button className="btn-outline" style={{ height: 28, fontSize: 11, padding: "0 10px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filter
          </button>
        </div>
      </div>
      <div className="panel-body-compact">
        <table className="dash-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Location</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Status</th>
              <th>AI Conf.</th>
              <th>Reported</th>
            </tr>
          </thead>
          <tbody>
            {INCIDENTS.map((inc) => (
              <tr key={inc.id}>
                <td>
                  <span className="table-id">{inc.id}</span>
                </td>
                <td>
                  <div className="table-location">
                    <span className="table-location-main">{inc.location}</span>
                    <span className="table-location-sub">{inc.area}</span>
                  </div>
                </td>
                <td style={{ fontSize: 12, color: "var(--dash-text-secondary)" }}>
                  {inc.type}
                </td>
                <td>
                  <span className={`table-severity ${inc.severity}`}>
                    {inc.severity}
                  </span>
                </td>
                <td>
                  <span className={`table-status-badge ${inc.status}`}>
                    <span className="dot"></span>
                    {inc.status === "in-progress" ? "In Progress" : inc.status.charAt(0).toUpperCase() + inc.status.slice(1)}
                  </span>
                </td>
                <td>
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: Number(inc.aiConf.replace("%", "")) >= 90
                      ? "var(--dash-success)"
                      : "var(--dash-text-secondary)",
                  }}>
                    {inc.aiConf}
                  </span>
                </td>
                <td>
                  <span className="table-time">{inc.reported}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default memo(IncidentTable);

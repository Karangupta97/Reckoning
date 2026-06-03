"use client";

import { memo, useState } from "react";
import MetricsRow from "@/components/admin/dashboard/MetricsRow";
import GISMap from "@/components/admin/dashboard/GISMap";
import IncidentTable from "@/components/admin/dashboard/IncidentTable";
import SeverityDonut from "@/components/admin/dashboard/SeverityDonut";
import ActivityFeed from "@/components/admin/dashboard/ActivityFeed";
import TrendChart from "@/components/admin/dashboard/TrendChart";
import BudgetPanel from "@/components/admin/dashboard/BudgetPanel";

const FILTERS = ["All Incidents", "Critical", "In Progress", "Resolved"] as const;

function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("All Incidents");

  return (
    <>
      <div className="page-title-row dash-animate">
        <div>
          <h1 className="page-title">Operations Overview</h1>
          <p className="page-title-sub">
            Pune District · Real-time road infrastructure monitoring · Ward-level accountability
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn-outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          <button type="button" className="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            New Incident
          </button>
        </div>
      </div>

      <div className="status-strip dash-animate dash-animate-delay-1">
        <div className="status-strip-item">
          <span className="status-dot live" />
          System Online
        </div>
        <div className="status-strip-divider" />
        <div className="status-strip-item">
          AI Detection: <span className="status-strip-value">Active</span>
        </div>
        <div className="status-strip-divider" />
        <div className="status-strip-item">
          Cameras: <span className="status-strip-value">142 / 148</span>
        </div>
        <div className="status-strip-divider" />
        <div className="status-strip-item">
          Last Sync: <span className="status-strip-value">12s ago</span>
        </div>
        <div className="status-strip-divider" />
        <div className="status-strip-item">
          Uptime: <span className="status-strip-value">99.97%</span>
        </div>
      </div>

      <div className="command-toolbar dash-animate dash-animate-delay-1">
        <div className="command-filters" role="tablist" aria-label="Incident filters">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              role="tab"
              aria-selected={activeFilter === filter}
              className={`command-filter ${activeFilter === filter ? "active" : ""}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="command-meta">
          Data window: <span>Last 30 days</span>
          · Refresh: <span>Auto · 30s</span>
        </div>
      </div>

      <MetricsRow />

      <div className="dash-grid dash-grid-main dash-animate dash-animate-delay-3">
        <GISMap />
        <SeverityDonut />
      </div>

      <div className="dash-grid dash-grid-3 dash-animate dash-animate-delay-4">
        <IncidentTable />
        <TrendChart />
      </div>

      <div className="dash-grid dash-grid-2 dash-animate dash-animate-delay-4">
        <ActivityFeed />
        <BudgetPanel />
      </div>
    </>
  );
}

export default memo(DashboardPage);

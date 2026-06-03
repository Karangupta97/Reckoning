"use client";

import { memo } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const REPORTED = [42, 58, 35, 72, 65, 88, 54, 95, 78, 62, 83, 70];
const RESOLVED = [28, 45, 30, 55, 52, 68, 48, 72, 65, 58, 70, 62];

function TrendChart() {
  const maxVal = Math.max(...REPORTED);
  const yLabels = [0, 25, 50, 75, 100];

  return (
    <div className="dash-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-title-dot"></span>
          Monthly Trend
        </div>
        <div className="panel-actions">
          <div className="kpi-row" style={{ gap: 6 }}>
            <span className="kpi-chip" style={{ padding: "3px 6px", fontSize: 10 }}>
              <span style={{ width: 8, height: 3, borderRadius: 2, background: "var(--dash-accent)", display: "inline-block" }}></span>
              Reported
            </span>
            <span className="kpi-chip" style={{ padding: "3px 6px", fontSize: 10 }}>
              <span style={{ width: 8, height: 3, borderRadius: 2, background: "var(--dash-cyan)", opacity: 0.5, display: "inline-block" }}></span>
              Resolved
            </span>
          </div>
        </div>
      </div>
      <div className="panel-body">
        <div className="chart-area">
          {/* Grid lines */}
          <div className="chart-grid-lines">
            {yLabels.map((_, i) => (
              <div key={i} className="chart-grid-line" />
            ))}
          </div>

          {/* Y-axis labels */}
          <div className="chart-y-axis">
            {[...yLabels].reverse().map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          {/* Bars */}
          <div className="chart-bars" style={{ paddingLeft: 28 }}>
            {MONTHS.map((month, i) => (
              <div key={month} className="chart-bar-group">
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: "100%" }}>
                  <div
                    className="chart-bar"
                    style={{ height: `${(REPORTED[i] / maxVal) * 100}%` }}
                  />
                  <div
                    className="chart-bar secondary"
                    style={{ height: `${(RESOLVED[i] / maxVal) * 100}%` }}
                  />
                </div>
                <span className="chart-bar-label">{month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TrendChart);

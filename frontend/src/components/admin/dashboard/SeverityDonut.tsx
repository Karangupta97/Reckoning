"use client";

import { memo } from "react";

const SEGMENTS = [
  { label: "Critical", value: 18, color: "#EF4444", pct: 14 },
  { label: "High", value: 34, color: "#F59E0B", pct: 27 },
  { label: "Medium", value: 52, color: "#6366F1", pct: 41 },
  { label: "Low", value: 23, color: "#10B981", pct: 18 },
];

function SeverityDonut() {
  const total = SEGMENTS.reduce((a, s) => a + s.value, 0);
  const size = 140;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="dash-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-title-dot"></span>
          Severity Distribution
        </div>
        <div className="panel-actions">
          <button className="panel-action-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>
      </div>
      <div className="panel-body">
        <div className="ring-chart">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {SEGMENTS.map((seg) => {
              const dash = (seg.value / total) * circumference;
              const gap = circumference - dash;
              const currentOffset = offset;
              offset += dash;
              return (
                <circle
                  key={seg.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-currentOffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
              );
            })}
          </svg>
          <div className="ring-chart-center">
            <div className="ring-chart-value">{total}</div>
            <div className="ring-chart-unit">Total</div>
          </div>
        </div>

        {/* Severity bar */}
        <div className="severity-bar">
          {SEGMENTS.map((seg) => (
            <div
              key={seg.label}
              className="severity-segment"
              style={{ flex: seg.pct, background: seg.color }}
            />
          ))}
        </div>
      </div>

      <div className="ring-legend">
        {SEGMENTS.map((seg) => (
          <div key={seg.label} className="ring-legend-item">
            <span className="ring-legend-label">
              <span className="ring-legend-dot" style={{ background: seg.color }} />
              {seg.label}
            </span>
            <span className="ring-legend-value">
              {seg.value} ({seg.pct}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(SeverityDonut);

"use client";

import { memo } from "react";

const METRICS = [
  {
    label: "Active Incidents",
    value: "1,247",
    trend: "+12%",
    trendDir: "up" as const,
    iconClass: "danger",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    sparkline: [30, 40, 35, 50, 49, 60, 70, 65, 72],
  },
  {
    label: "Roads Monitored",
    value: "3,842",
    trend: "+8%",
    trendDir: "up" as const,
    iconClass: "accent",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 17l4-8 4 5 4-9 6 12" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 20h20" strokeLinecap="round" />
      </svg>
    ),
    sparkline: [20, 25, 35, 30, 45, 50, 48, 55, 60],
  },
  {
    label: "Resolved (30d)",
    value: "892",
    trend: "+23%",
    trendDir: "up" as const,
    iconClass: "success",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    sparkline: [10, 20, 18, 35, 42, 38, 50, 55, 65],
  },
  {
    label: "Avg Response",
    value: "4.2d",
    trend: "-18%",
    trendDir: "down" as const,
    iconClass: "warning",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    sparkline: [60, 55, 50, 48, 42, 45, 38, 35, 32],
  },
];

function Sparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200;
  const h = 40;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="metric-sparkline">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        <polygon
          points={`0,${h} ${points} ${w},${h}`}
          fill={color}
          opacity="0.3"
        />
      </svg>
    </div>
  );
}

function MetricsRow() {
  const colorMap: Record<string, string> = {
    accent: "#00BFFF",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
  };

  return (
    <div className="metrics-grid dash-animate dash-animate-delay-2">
      {METRICS.map((m) => (
        <div key={m.label} className="metric-card">
          <div className="metric-card-header">
            <div className={`metric-card-icon ${m.iconClass}`}>
              {m.icon}
            </div>
            <div
              className={`metric-card-trend ${m.trendDir === "up" ? "up" : "down"}`}
            >
              {m.trendDir === "up" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
              {m.trend}
            </div>
          </div>
          <div className="metric-card-value">{m.value}</div>
          <div className="metric-card-label">{m.label}</div>
          <Sparkline
            data={m.sparkline}
            color={colorMap[m.iconClass] ?? "#00BFFF"}
          />
        </div>
      ))}
    </div>
  );
}

export default memo(MetricsRow);

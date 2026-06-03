"use client";

import { memo } from "react";

const DETECTIONS = [
  {
    id: "pothole",
    label: "Pothole Detection",
    icon: "circle",
    count: 3,
    severity: "critical" as const,
    confidence: 94,
    detail: "Cluster detected near lane divider with depth estimate 8–12 cm",
  },
  {
    id: "crack",
    label: "Road Cracks",
    icon: "zigzag",
    count: 12,
    severity: "medium" as const,
    confidence: 88,
    detail: "Longitudinal and alligator cracking across 14 m segment",
  },
  {
    id: "material",
    label: "Material Issues",
    icon: "layers",
    count: 1,
    severity: "medium" as const,
    confidence: 76,
    detail: "Low-quality cement patch, poor compaction visible",
  },
  {
    id: "rain",
    label: "Rain Damage",
    icon: "cloud-rain",
    count: 2,
    severity: "high" as const,
    confidence: 91,
    detail: "Water pooling and surface erosion from monsoon exposure",
  },
  {
    id: "pipeline",
    label: "Pipeline Dug-up",
    icon: "tool",
    count: 1,
    severity: "high" as const,
    confidence: 85,
    detail: "Unrestored trench from water pipeline work, 6 weeks old",
  },
];

function DetectionIcon({ name }: { name: string }) {
  const props = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 };
  switch (name) {
    case "circle":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" strokeDasharray="4 3" />
        </svg>
      );
    case "zigzag":
      return (
        <svg {...props}>
          <polyline points="4 16 8 8 12 16 16 8 20 16" />
        </svg>
      );
    case "layers":
      return (
        <svg {...props}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case "cloud-rain":
      return (
        <svg {...props}>
          <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
          <line x1="8" y1="19" x2="8" y2="21" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="16" y1="19" x2="16" y2="21" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
      );
  }
}

function SmartReport() {
  const overallSeverity = "Critical";

  return (
    <section className="rk-smart-report" aria-labelledby="smartreport-heading">
      <div className="rk-section-head">
        <div>
          <h2 id="smartreport-heading" className="rk-section-title">
            SmartReport
          </h2>
          <p className="rk-section-sub">AI road quality detection results</p>
        </div>
        <div className="rk-severity-pill critical">
          Overall: {overallSeverity}
        </div>
      </div>

      <div className="rk-detection-grid">
        {DETECTIONS.map((d) => (
          <article key={d.id} className="rk-detection-card">
            <div className="rk-detection-icon">
              <DetectionIcon name={d.icon} />
            </div>
            <h3 className="rk-detection-label">{d.label}</h3>
            <div className="rk-detection-stats">
              <span className="rk-detection-count">{d.count} found</span>
              <span className={`rk-chip rk-chip-${d.severity === "high" ? "high" : d.severity}`}>
                {d.severity}
              </span>
            </div>
            <p className="rk-detection-detail">{d.detail}</p>
            <div className="rk-confidence-bar">
              <div className="rk-confidence-fill" style={{ width: `${d.confidence}%` }} />
            </div>
            <span className="rk-confidence-label">{d.confidence}% confidence</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default memo(SmartReport);

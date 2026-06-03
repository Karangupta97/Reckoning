"use client";

import { memo, useState } from "react";
import PageHeader from "@/components/user/PageHeader";

const FILTERS = ["All", "Open", "In Progress", "Escalated", "Resolved"] as const;

const STEPS = [
  "Submitted",
  "Assigned",
  "In Review",
  "In Progress",
  "Escalated",
  "Resolved",
] as const;

const REPORTS = [
  {
    id: "RK-2841",
    road: "FC Road Junction",
    severity: "high",
    confidence: "91%",
    sla: "18h left",
    activeStep: 3,
  },
  {
    id: "RK-2836",
    road: "Baner Link Road",
    severity: "medium",
    confidence: "84%",
    sla: "2d left",
    activeStep: 1,
  },
  {
    id: "RK-2829",
    road: "Katraj Tunnel Exit",
    severity: "critical",
    confidence: "96%",
    sla: "4h left",
    activeStep: 4,
  },
];

function StatusPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  return (
    <>
      <PageHeader
        title="Complaint Status"
        subtitle="Track every report with AI confidence scores, SLA countdowns, and full resolution timelines."
      />

      <div className="rk-filter-tabs" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            className={`rk-filter-tab ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {REPORTS.map((r) => (
        <article key={r.id} className="rk-report-card">
          <div className="rk-report-card-head">
            <div>
              <div className="rk-report-id">{r.id}</div>
              <h3
                style={{
                  margin: "6px 0 0",
                  fontFamily: "var(--font-display)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--rk-text)",
                }}
              >
                {r.road}
              </h3>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className={`rk-chip rk-chip-${r.severity}`}>{r.severity}</span>
              <div className="rk-sla" style={{ marginTop: 8 }}>
                SLA: {r.sla}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              fontSize: 12,
              color: "var(--rk-text-secondary)",
              marginBottom: 14,
            }}
          >
            <span>
              AI confidence:{" "}
              <strong style={{ fontFamily: "var(--font-mono)", color: "var(--rk-success)" }}>
                {r.confidence}
              </strong>
            </span>
          </div>

          <div className="rk-timeline-h">
            {STEPS.map((step, i) => (
              <div
                key={step}
                className={`rk-timeline-step ${
                  i < r.activeStep ? "done" : i === r.activeStep ? "active" : ""
                }`}
              >
                <div className="rk-timeline-dot" />
                <div className="rk-timeline-label">{step}</div>
              </div>
            ))}
          </div>
        </article>
      ))}
    </>
  );
}

export default memo(StatusPage);

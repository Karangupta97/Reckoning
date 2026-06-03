"use client";

import { memo } from "react";

const CONTRACTORS = [
  {
    id: "c1",
    name: "Maharashtra RoadWorks Pvt Ltd",
    segment: "FC Road · Ward 8",
    contractDate: "2024-08-15",
    budget: "₹2.4 Cr",
    timelineOfficial: "90 days",
    timelineActual: "142 days",
    status: "delayed" as const,
    delayDays: 52,
    linkedComplaints: 14,
  },
  {
    id: "c2",
    name: "Urban Infra Solutions",
    segment: "Baner Link · Ward 12",
    contractDate: "2025-01-10",
    budget: "₹1.1 Cr",
    timelineOfficial: "60 days",
    timelineActual: "58 days",
    status: "ontime" as const,
    delayDays: 0,
    linkedComplaints: 2,
  },
];

function SpendTracker() {
  return (
    <section className="rk-spend-tracker" aria-labelledby="spend-heading">
      <div className="rk-section-head">
        <div>
          <h2 id="spend-heading" className="rk-section-title">
            SpendTracker
          </h2>
          <p className="rk-section-sub">Contractor transparency for this subdistrict</p>
        </div>
      </div>

      <div className="rk-contractor-list">
        {CONTRACTORS.map((c) => (
          <article key={c.id} className="rk-pin-card rk-contractor-card">
            <div className="rk-contractor-head">
              <div>
                <h3 className="rk-contractor-name">{c.name}</h3>
                <p className="rk-contractor-segment">{c.segment}</p>
              </div>
              <span className={`rk-contractor-status ${c.status}`}>
                {c.status === "delayed" ? `${c.delayDays}d delay` : "On time"}
              </span>
            </div>

            <div className="rk-contractor-grid">
              <div className="rk-contractor-stat">
                <span className="rk-stat-label">Contract date</span>
                <strong>{c.contractDate}</strong>
              </div>
              <div className="rk-contractor-stat">
                <span className="rk-stat-label">Budget assigned</span>
                <strong>{c.budget}</strong>
              </div>
              <div className="rk-contractor-stat">
                <span className="rk-stat-label">Official timeline</span>
                <strong>{c.timelineOfficial}</strong>
              </div>
              <div className="rk-contractor-stat">
                <span className="rk-stat-label">Actual completion</span>
                <strong className={c.status === "delayed" ? "delayed" : ""}>{c.timelineActual}</strong>
              </div>
            </div>

            <div className="rk-timeline-bar">
              <div
                className="rk-timeline-official"
                style={{ width: c.status === "delayed" ? "63%" : "97%" }}
              />
              <div
                className="rk-timeline-actual"
                style={{ width: c.status === "delayed" ? "100%" : "97%" }}
              />
            </div>
            <div className="rk-timeline-legend">
              <span><i className="official" /> Official</span>
              <span><i className="actual" /> Actual</span>
            </div>

            <div className="rk-linked-complaints">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>
                <strong>{c.linkedComplaints}</strong> linked citizen complaints on this segment
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default memo(SpendTracker);

"use client";

import { memo } from "react";

function CommunityImpact() {
  const total = 847;
  const resolved = 612;
  const pending = total - resolved;
  const resolvedPct = Math.round((resolved / total) * 100);

  return (
    <section className="rk-pin-card rk-community-impact" aria-labelledby="impact-heading">
      <div className="rk-pin-card-head">
        <div>
          <h2 id="impact-heading" className="rk-pin-title">
            Community Impact
          </h2>
          <p className="rk-pin-sub">Pune Subdistrict · Collective accountability</p>
        </div>
      </div>

      <div className="rk-pin-card-body">
        <div className="rk-impact-hero">
          <div className="rk-impact-stat primary">
            <span className="rk-impact-number">{total.toLocaleString("en-IN")}</span>
            <span className="rk-impact-label">Reports this quarter</span>
          </div>
          <div className="rk-impact-divider" aria-hidden="true" />
          <div className="rk-impact-stat success">
            <span className="rk-impact-number">{resolved.toLocaleString("en-IN")}</span>
            <span className="rk-impact-label">Resolved</span>
          </div>
          <div className="rk-impact-divider" aria-hidden="true" />
          <div className="rk-impact-stat warning">
            <span className="rk-impact-number">{pending.toLocaleString("en-IN")}</span>
            <span className="rk-impact-label">Pending</span>
          </div>
        </div>

        <div className="rk-impact-progress">
          <div className="rk-impact-progress-head">
            <span>Resolution rate</span>
            <strong>{resolvedPct}%</strong>
          </div>
          <div className="rk-impact-bar">
            <div className="rk-impact-bar-fill" style={{ width: `${resolvedPct}%` }} />
          </div>
        </div>

        <div className="rk-impact-privacy">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p>
            All participation is anonymous. We show community totals only — no individual profiles
            or personal data are stored or displayed.
          </p>
        </div>

        <div className="rk-impact-cta">
          <p>Every report strengthens road accountability in your subdistrict.</p>
          <a href="#upload-heading" className="rk-btn rk-btn-outline">
            Report an issue now
          </a>
        </div>
      </div>
    </section>
  );
}

export default memo(CommunityImpact);

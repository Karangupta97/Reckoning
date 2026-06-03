"use client";

import { memo } from "react";

const CONTRACTORS = [
  {
    rank: 1,
    name: "Urban Infra Solutions",
    score: 92,
    badge: "On-Time Hero" as const,
    projects: 8,
    onTime: 94,
  },
  {
    rank: 2,
    name: "GreenPath Constructions",
    score: 87,
    badge: "Quality Guardian" as const,
    projects: 12,
    onTime: 83,
  },
  {
    rank: 3,
    name: "Maharashtra RoadWorks",
    score: 41,
    badge: "Delay Magnet" as const,
    projects: 6,
    onTime: 33,
  },
  {
    rank: 4,
    name: "QuickFix Roads Ltd",
    score: 18,
    badge: "Blacklisted" as const,
    projects: 3,
    onTime: 0,
  },
];

const BADGE_CLASS: Record<string, string> = {
  "On-Time Hero": "hero",
  "Quality Guardian": "guardian",
  "Delay Magnet": "delay",
  Blacklisted: "blacklist",
};

function ContractorLeaderboard() {
  return (
    <section className="rk-pin-card rk-leaderboard" aria-labelledby="leaderboard-heading">
      <div className="rk-pin-card-head">
        <div>
          <h2 id="leaderboard-heading" className="rk-pin-title">
            Contractor Leaderboard
          </h2>
          <p className="rk-pin-sub">Public reputation · Subdistrict rankings</p>
        </div>
      </div>

      <div className="rk-pin-card-body rk-leaderboard-body">
        {CONTRACTORS.map((c) => (
          <div key={c.rank} className="rk-leader-row">
            <span className={`rk-leader-rank${c.rank <= 3 ? " top" : ""}`}>#{c.rank}</span>
            <div className="rk-leader-info">
              <strong>{c.name}</strong>
              <span className="rk-leader-meta">
                {c.projects} projects · {c.onTime}% on-time
              </span>
            </div>
            <span className={`rk-badge rk-badge-${BADGE_CLASS[c.badge]}`}>{c.badge}</span>
            <div className="rk-reputation-score">
              <span className="rk-rep-value">{c.score}</span>
              <span className="rk-rep-label">Rep score</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(ContractorLeaderboard);

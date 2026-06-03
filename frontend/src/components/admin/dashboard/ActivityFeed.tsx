"use client";

import { memo } from "react";

const ACTIVITIES = [
  {
    type: "alert",
    text: "<strong>Critical pothole</strong> detected on Sinhagad Road via AI camera #C-142",
    time: "2 min ago",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    type: "resolve",
    text: "<strong>RW-4802</strong> resolved — Kharadi Bypass drain overflow patched",
    time: "18 min ago",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    type: "upload",
    text: "Field team uploaded <strong>12 photos</strong> for Katraj Tunnel inspection",
    time: "45 min ago",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    type: "budget",
    text: "Budget release <strong>₹4.2L</strong> approved for Ward 12 repairs",
    time: "1h ago",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    type: "alert",
    text: "AI flagged <strong>road collapse risk</strong> at Hadapsar bridge approach",
    time: "2h ago",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    type: "resolve",
    text: "<strong>RW-4798</strong> verified — SB Road pothole repair completed",
    time: "3h ago",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
];

function ActivityFeed() {
  return (
    <div className="dash-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-title-dot"></span>
          Live Activity
        </div>
        <div className="panel-actions">
          <button className="btn-outline" style={{ height: 28, fontSize: 11, padding: "0 10px" }}>
            View All
          </button>
        </div>
      </div>
      <div className="panel-body-compact">
        <div className="activity-feed">
          {ACTIVITIES.map((a, i) => (
            <div key={i} className="activity-item">
              <div className={`activity-icon ${a.type}`}>
                {a.icon}
              </div>
              <div className="activity-content">
                <div
                  className="activity-text"
                  dangerouslySetInnerHTML={{ __html: a.text }}
                />
                <div className="activity-time">{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(ActivityFeed);

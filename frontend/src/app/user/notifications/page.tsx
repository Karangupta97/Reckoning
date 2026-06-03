"use client";

import { memo, useState } from "react";
import PageHeader from "@/components/user/PageHeader";

const FILTERS = ["All", "Status", "Escalation", "Resolution"] as const;

const NOTIFS = [
  {
    type: "Status",
    title: "RK-2841 moved to In Progress",
    body: "Repair crew PMC-442 assigned to FC Road Junction.",
    time: "12 min ago",
    unread: true,
  },
  {
    type: "Escalation",
    title: "RK-2829 escalated to district engineer",
    body: "Critical road collapse risk — SLA breach imminent.",
    time: "2h ago",
    unread: true,
  },
  {
    type: "Resolution",
    title: "RK-2810 marked resolved",
    body: "Kharadi Bypass drain repair verified by AI inspection.",
    time: "1d ago",
    unread: false,
  },
  {
    type: "Status",
    title: "Budget update published",
    body: "Q2 ward allocation now visible in Budget Transparency.",
    time: "2d ago",
    unread: false,
  },
];

function NotificationsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const list = NOTIFS.filter(
    (n) => filter === "All" || n.type === filter,
  );

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Status updates, escalations, and resolutions for your reports and district activity."
      />

      <div className="rk-filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`rk-filter-tab ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rk-panel">
        <div className="rk-panel-body" style={{ padding: 0 }}>
          {list.map((n, i) => (
            <div
              key={i}
              className={`rk-notif-card ${n.unread ? "unread" : "read"}`}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: n.unread ? "var(--rk-primary)" : "transparent",
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span className="rk-chip rk-chip-medium">{n.type}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--font-mono)",
                      color: "var(--rk-text-muted)",
                    }}
                  >
                    {n.time}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--rk-text)",
                    marginBottom: 4,
                  }}
                >
                  {n.title}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--rk-text-secondary)", lineHeight: 1.5 }}>
                  {n.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default memo(NotificationsPage);

"use client";

import { memo } from "react";
import PageHeader from "@/components/user/PageHeader";

const RANKINGS = [
  { ward: "Ward 12", spent: "₹18.4L", score: 62, flag: true },
  { ward: "Ward 8", spent: "₹14.2L", score: 71, flag: false },
  { ward: "Ward 5", spent: "₹11.8L", score: 78, flag: false },
  { ward: "Ward 15", spent: "₹9.6L", score: 54, flag: true },
];

function BudgetPage() {
  return (
    <>
      <PageHeader
        title="Budget Transparency"
        subtitle="Public allocation, utilization, road quality correlation, and anomaly alerts for civic accountability."
      />

      <div className="rk-grid">
        <div className="rk-col-3">
          <div className="rk-panel">
            <div className="rk-panel-body">
              <div className="rk-stat-value">₹44.3L</div>
              <div className="rk-stat-label">Allocated (FY 25–26)</div>
              <div className="rk-budget-bar" style={{ marginTop: 14 }}>
                <div className="rk-budget-fill" style={{ width: "64.8%" }} />
              </div>
              <p style={{ fontSize: 12, color: "var(--rk-text-secondary)", marginTop: 10 }}>
                <strong style={{ color: "var(--rk-text)" }}>₹28.7L</strong> utilized (64.8%)
              </p>
            </div>
          </div>
        </div>

        <div className="rk-col-3">
          <div className="rk-panel">
            <div className="rk-panel-body">
              <div className="rk-stat-value" style={{ color: "var(--rk-primary)" }}>
                68
              </div>
              <div className="rk-stat-label">Road quality score</div>
              <p style={{ fontSize: 12, color: "var(--rk-text-muted)", marginTop: 10, lineHeight: 1.5 }}>
                Composite index from citizen reports + inspection data
              </p>
            </div>
          </div>
        </div>

        <div className="rk-col-3">
          <div className="rk-panel">
            <div className="rk-panel-body">
              <div className="rk-stat-value" style={{ color: "var(--rk-success)" }}>
                82
              </div>
              <div className="rk-stat-label">Transparency score</div>
              <p style={{ fontSize: 12, color: "var(--rk-text-muted)", marginTop: 10, lineHeight: 1.5 }}>
                Open data compliance · audit trail verified
              </p>
            </div>
          </div>
        </div>

        <div className="rk-col-3">
          <div className="rk-panel">
            <div className="rk-panel-body">
              <span className="rk-chip rk-chip-high">2 anomalies</span>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--rk-text-secondary)",
                  marginTop: 12,
                  lineHeight: 1.5,
                }}
              >
                Ward 12 spend up 34% with declining road score. Review flagged for public audit.
              </p>
            </div>
          </div>
        </div>

        <div className="rk-col-6">
          <div className="rk-panel">
            <div className="rk-panel-head">
              <span className="rk-panel-title">District map</span>
            </div>
            <div className="rk-panel-body">
              <div className="rk-map-mini">
                {[20, 35, 55, 70, 45, 60, 30, 75].map((x, i) => (
                  <span
                    key={i}
                    style={{
                      position: "absolute",
                      left: `${x}%`,
                      top: `${25 + (i % 4) * 18}%`,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: i % 3 === 0 ? "var(--rk-danger)" : "var(--rk-primary)",
                      boxShadow: "var(--rk-glow)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rk-col-6">
          <div className="rk-panel">
            <div className="rk-panel-head">
              <span className="rk-panel-title">Budget vs road condition</span>
            </div>
            <div className="rk-panel-body">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 6,
                  height: 160,
                  paddingTop: 8,
                }}
              >
                {[40, 65, 55, 80, 70, 90, 60, 75, 85, 50, 72, 68].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      height: "100%",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        maxWidth: 20,
                        height: `${h}%`,
                        background: "var(--rk-primary)",
                        opacity: 0.7,
                        borderRadius: "4px 4px 0 0",
                      }}
                    />
                    <div
                      style={{
                        width: "100%",
                        maxWidth: 20,
                        height: `${h * 0.65}%`,
                        background: "var(--rk-secondary)",
                        opacity: 0.35,
                        borderRadius: "4px 4px 0 0",
                        marginTop: -4,
                      }}
                    />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 10, color: "var(--rk-text-muted)", marginTop: 12, textAlign: "center" }}>
                Purple = spend · Lavender = condition index
              </p>
            </div>
          </div>
        </div>

        <div className="rk-col-12">
          <div className="rk-panel">
            <div className="rk-panel-head">
              <span className="rk-panel-title">Ward spending rankings</span>
            </div>
            <div className="rk-panel-body" style={{ paddingTop: 0 }}>
              {RANKINGS.map((w) => (
                <div
                  key={w.ward}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 0",
                    borderBottom: "1px solid var(--rk-border)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--rk-text)" }}>
                      {w.ward}
                      {w.flag && (
                        <span className="rk-chip rk-chip-critical" style={{ marginLeft: 8 }}>
                          anomaly
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--rk-text-muted)", marginTop: 2 }}>
                      Road score: {w.score}/100
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--rk-text)",
                    }}
                  >
                    {w.spent}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default memo(BudgetPage);

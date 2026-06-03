"use client";

import { memo } from "react";

const BUDGET_ITEMS = [
  { label: "Road Resurfacing", sub: "Ward 12, 8, 5", amount: "₹18.4L", pct: 72, variant: "" },
  { label: "Drainage Repair", sub: "Ward 15, 9", amount: "₹8.6L", pct: 45, variant: "" },
  { label: "Bridge Maintenance", sub: "Ward 3", amount: "₹12.1L", pct: 88, variant: "warning" },
  { label: "Emergency Response", sub: "All Wards", amount: "₹5.2L", pct: 34, variant: "" },
];

function BudgetPanel() {
  return (
    <div className="dash-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-title-dot"></span>
          Budget Utilization
        </div>
        <div className="panel-actions">
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--dash-text-secondary)",
          }}>
            FY 2025–26
          </span>
        </div>
      </div>
      <div className="panel-body">
        {/* Total */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid var(--dash-border-subtle)",
        }}>
          <div>
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--dash-text)",
              fontFamily: "var(--font-mono)",
              letterSpacing: -0.5,
            }}>
              ₹44.3L
            </div>
            <div style={{ fontSize: 10, color: "var(--dash-text-muted)", marginTop: 2 }}>
              Total Allocated
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--dash-accent)",
              fontFamily: "var(--font-mono)",
            }}>
              ₹28.7L
            </div>
            <div style={{ fontSize: 10, color: "var(--dash-text-muted)", marginTop: 2 }}>
              Utilized (64.8%)
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="budget-progress" style={{ marginBottom: 20, height: 4 }}>
          <div className="budget-progress-fill" style={{ width: "64.8%" }} />
        </div>

        {/* Items */}
        {BUDGET_ITEMS.map((item) => (
          <div key={item.label} className="budget-row">
            <div className="budget-info">
              <div className="budget-label">{item.label}</div>
              <div className="budget-sub">{item.sub}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="budget-amount">{item.amount}</div>
              <div style={{
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                color: item.pct >= 80 ? "var(--dash-warning)" : "var(--dash-text-muted)",
                marginTop: 2,
              }}>
                {item.pct}% used
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(BudgetPanel);

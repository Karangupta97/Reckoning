"use client";

import { motion } from "framer-motion";
import { Brain, AlertTriangle, CloudRain, ArrowRight } from "lucide-react";

const INSIGHTS = [
  { icon: Brain, label: "AI Risk Score", value: "Medium", color: "var(--color-amber)" },
  { icon: AlertTriangle, label: "Nearby Hazards", value: "4 Active", color: "var(--color-danger)" },
  { icon: CloudRain, label: "Weather Impact", value: "Moderate", color: "var(--color-info)" },
];

const ALERTS = [
  "Heavy rain expected on NH48 — drive carefully.",
  "Community cleanup drive this Saturday.",
  "3 new hazards reported in your area.",
];

export function RightSidebar() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex flex-col gap-4"
    >
      {/* Safety Insights */}
      <div className="neu-card p-4">
        <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wide mb-3">
          Safety Insights
        </h4>
        <div className="space-y-3">
          {INSIGHTS.map((insight) => {
            const Icon = insight.icon;
            return (
              <div key={insight.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${insight.color} 12%, transparent)`,
                      color: insight.color,
                    }}
                  >
                    <Icon size={14} strokeWidth={2} />
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {insight.label}
                  </span>
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: insight.color }}
                >
                  {insight.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community Alerts */}
      <div className="neu-card p-4">
        <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wide mb-3">
          Community Alerts
        </h4>
        <div className="space-y-2.5">
          {ALERTS.map((alert, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-[11px] text-[var(--color-text-secondary)] leading-relaxed"
            >
              <ArrowRight
                size={10}
                className="shrink-0 mt-1 text-[var(--color-amber)]"
              />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Road Conditions */}
      <div className="neu-card p-4">
        <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wide mb-3">
          Road Conditions
        </h4>
        <div className="space-y-2">
          {[
            { road: "NH48", status: "Fair", color: "var(--color-amber)" },
            { road: "Mumbai-Pune Exp", status: "Good", color: "var(--color-success)" },
            { road: "Thane-Belapur Rd", status: "Poor", color: "var(--color-danger)" },
          ].map((road) => (
            <div key={road.road} className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-secondary)]">
                {road.road}
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `color-mix(in srgb, ${road.color} 12%, transparent)`,
                  color: road.color,
                }}
              >
                {road.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

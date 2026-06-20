"use client";

/**
 * CaseJourneyTimeline — Reusable case lifecycle visualization.
 * Shows the complete journey of a case from complaint creation to resolution.
 * Built from actual store data passed as steps.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Circle } from "lucide-react";

export interface CaseJourneyStep {
  label: string;
  entityId?: string;
  timestamp?: string;
  status: "completed" | "active" | "pending";
  note?: string;
}

interface CaseJourneyTimelineProps {
  steps: CaseJourneyStep[];
  title?: string;
  accentColor?: string;
}

export function CaseJourneyTimeline({
  steps,
  title = "Case Journey",
  accentColor = "#14b8a6",
}: CaseJourneyTimelineProps) {
  // Prevent hydration mismatch — store data differs between server and client
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  if (steps.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{title}</h4>

      <div style={{ position: "relative" }}>
        {/* Vertical line */}
        {steps.length > 1 && (
          <div style={{
            position: "absolute",
            left: "11px",
            top: "12px",
            bottom: "12px",
            width: "2px",
            borderRadius: "9999px",
            background: "var(--color-border)",
            zIndex: 0,
          }} />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {steps.map((step, i) => {
            const isCompleted = step.status === "completed";
            const isActive    = step.status === "active";
            const nodeColor   = isCompleted ? "#10b981" : isActive ? accentColor : "var(--color-text-muted)";

            return (
              <motion.div key={i}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "6px 0" }}>

                {/* Node */}
                <div style={{
                  position: "relative",
                  zIndex: 1,
                  flexShrink: 0,
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isCompleted
                    ? "rgba(16,185,129,0.15)"
                    : isActive
                    ? `color-mix(in srgb, ${accentColor} 15%, var(--color-card))`
                    : "var(--color-card)",
                  border: `2px solid ${nodeColor}`,
                  boxShadow: `0 0 0 2px var(--color-card)`,
                  color: nodeColor,
                }}>
                  {isCompleted ? <CheckCircle2 size={12} /> : isActive ? <Clock size={11} /> : <Circle size={8} />}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, paddingTop: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: isCompleted || isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                    }}>
                      {step.label}
                    </span>
                    {step.entityId && (
                      <span style={{
                        fontSize: "9px",
                        fontFamily: "var(--font-dm-mono, monospace)",
                        fontWeight: 700,
                        color: accentColor,
                      }}>
                        {step.entityId}
                      </span>
                    )}
                    {step.timestamp && (
                      <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>
                        {step.timestamp}
                      </span>
                    )}
                  </div>
                  {step.note && (
                    <p style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                      {step.note}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

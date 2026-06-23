"use client";

import type { CSSProperties } from "react";
import { AnalyticsMap } from "@/components/AnalyticsMap";

export function PredictiveMap({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <AnalyticsMap
      compact
      className={className ?? "h-[220px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] shadow-[var(--shadow-neu)]"}
      style={style ?? { height: "220px", minHeight: "220px" }}
      showAttribution={false}
    />
  );
}

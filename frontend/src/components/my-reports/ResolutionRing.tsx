"use client";

import { motion } from "framer-motion";

interface ResolutionRingProps {
  percentage: number;
  resolved: number;
  total: number;
}

export function ResolutionRing({ percentage, resolved, total }: ResolutionRingProps) {
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Track */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          style={{ display: "block" }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-amber)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-bold leading-none"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-amber)" }}
          >
            {percentage}%
          </span>
        </div>
      </div>
      <p
        className="text-xs text-center"
        style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
      >
        {resolved} of {total} resolved
      </p>
    </div>
  );
}

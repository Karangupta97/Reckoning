"use client";

import type { ComponentPropsWithoutRef } from "react";
import { motion } from "framer-motion";

/** Dark infrastructure panel — no neumorphic white highlight shadow */
export const dashboardCardClassName =
  "rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-none";

type DashboardCardProps = ComponentPropsWithoutRef<typeof motion.div>;

export function DashboardCard({
  className = "",
  children,
  ...props
}: DashboardCardProps) {
  return (
    <motion.div
      className={[dashboardCardClassName, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </motion.div>
  );
}

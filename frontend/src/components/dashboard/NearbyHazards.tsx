"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { AlertTriangle, Droplets, Trash2, CircleAlert } from "lucide-react";

type RiskLevel = "high" | "medium" | "low";

const RISK_COLORS: Record<RiskLevel, string> = {
  high: "var(--color-danger)",
  medium: "var(--color-amber)",
  low: "var(--color-success)",
};

const HAZARDS = [
  { icon: AlertTriangle, typeKey: "pothole" as const, km: "0.8", risk: "high" as RiskLevel },
  { icon: Droplets, typeKey: "flooding" as const, km: "2.1", risk: "medium" as RiskLevel },
  { icon: Trash2, typeKey: "roadDebris" as const, km: "1.5", risk: "low" as RiskLevel },
  { icon: CircleAlert, typeKey: "brokenSignal" as const, km: "3.4", risk: "high" as RiskLevel },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function NearbyHazards() {
  const t = useTranslations("dashboard.nearbyHazards");

  return (
    <div className="neu-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {t("title")}
        </h3>
        <button className="text-xs font-medium text-[var(--color-amber)] hover:underline">
          {t("viewMap")}
        </button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {HAZARDS.map((hazard, i) => {
          const Icon = hazard.icon;
          const color = RISK_COLORS[hazard.risk];
          return (
            <motion.div
              key={i}
              variants={itemVariants}
              className="flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                    color,
                  }}
                >
                  <Icon size={15} strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t(`types.${hazard.typeKey}`)}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {t("distance", { km: hazard.km })}
                  </p>
                </div>
              </div>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                  color,
                }}
              >
                {t(`risk.${hazard.risk}`)}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

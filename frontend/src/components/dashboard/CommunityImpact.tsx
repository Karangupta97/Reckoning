"use client";

import { motion } from "framer-motion";
import { Users, AlertTriangle, Globe, Building2 } from "lucide-react";

const STATS = [
  { value: "500K+", label: "Citizens Protected", icon: Users, color: "var(--color-info)" },
  { value: "50K+", label: "Hazards Reported", icon: AlertTriangle, color: "var(--color-amber)" },
  { value: "2K+", label: "Communities Connected", icon: Globe, color: "var(--color-success)" },
  { value: "300+", label: "Authorities Engaged", icon: Building2, color: "var(--color-danger)" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

export function CommunityImpact() {
  return (
    <div className="neu-card p-5">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
        Community Impact
      </h3>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4"
      >
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="flex flex-col items-center text-center gap-2"
            >
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `color-mix(in srgb, ${stat.color} 12%, transparent)`,
                  color: stat.color,
                }}
              >
                <Icon size={18} strokeWidth={2} />
              </span>
              <div>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                  {stat.value}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

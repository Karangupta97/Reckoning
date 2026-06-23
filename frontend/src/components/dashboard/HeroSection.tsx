"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { AlertTriangle, Map, Phone, FileText } from "lucide-react";
import { InstallPWAButton } from "@/components/pwa/InstallPWAButton";
import { useAuthStore } from "@/stores/authStore";

const QUICK_ACTIONS_KEYS = [
  { labelKey: "reportHazard", subKey: "reportHazardSub", icon: AlertTriangle, color: "var(--color-amber)" },
  { labelKey: "openSafetyMap", subKey: "openSafetyMapSub", icon: Map, color: "var(--color-info)" },
  { labelKey: "emergencyContacts", subKey: "emergencyContactsSub", icon: Phone, color: "var(--color-success)" },
  { labelKey: "viewMyReports", subKey: "viewMyReportsSub", icon: FileText, color: "var(--color-text-secondary)" },
] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function HeroSection() {
  const t = useTranslations("dashboard");
  const user = useAuthStore((state) => state.user);
  const firstName = user?.fullName?.split(" ")[0] ?? "Citizen";

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Greeting */}
      <motion.div variants={itemVariants}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text-primary)]">
              {t("greeting", { name: firstName })}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {t("subtitle")}
            </p>
          </div>
          <InstallPWAButton variant="hero" className="hidden sm:inline-flex shrink-0" />
        </div>
      </motion.div>

      {/* Quick Actions - hidden on small/medium screens */}
      <motion.div
        variants={containerVariants}
        className="hidden lg:grid grid-cols-4 gap-3"
      >
        {QUICK_ACTIONS_KEYS.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.labelKey}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 flex flex-col items-start gap-2 text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-shadow"
            >
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `color-mix(in srgb, ${action.color} 15%, transparent)`,
                  color: action.color,
                }}
              >
                <Icon size={18} strokeWidth={2} />
              </span>
              <div>
                <span className="text-sm font-semibold text-[var(--color-text-primary)] block">
                  {t(`quickActions.${action.labelKey}`)}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {t(`quickActions.${action.subKey}`)}
                </span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.section>
  );
}

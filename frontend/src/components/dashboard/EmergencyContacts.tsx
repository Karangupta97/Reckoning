"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Phone, AlertTriangle } from "lucide-react";

const CONTACTS = [
  { labelKey: "trafficPolice" as const, number: "100" },
  { labelKey: "highwayHelpline" as const, number: "1033" },
  { labelKey: "emergencyServices" as const, number: "112" },
  { labelKey: "municipalCorporation" as const, number: "1916" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: 8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export function EmergencyContacts() {
  const t = useTranslations("dashboard.emergencyContacts");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="neu-card p-5"
    >
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
        {t("title")}
      </h3>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2.5"
      >
        {CONTACTS.map((contact) => (
          <motion.button
            key={contact.number}
            variants={itemVariants}
            whileHover={{ x: 2 }}
            className="w-full flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-[var(--color-surface)] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[color-mix(in_srgb,var(--color-info)_10%,transparent)] text-[var(--color-info)]">
                <Phone size={14} strokeWidth={2} />
              </span>
              <span className="text-sm text-[var(--color-text-primary)]">
                {t(contact.labelKey)}
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-[var(--color-text-muted)] group-hover:text-[var(--color-info)] transition-colors">
              {contact.number}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Emergency CTA */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-[var(--color-danger)] text-sm font-semibold hover:bg-[color-mix(in_srgb,var(--color-danger)_18%,transparent)] transition-colors"
      >
        <AlertTriangle size={15} strokeWidth={2} />
        {t("emergencyCta")}
      </motion.button>
    </motion.div>
  );
}

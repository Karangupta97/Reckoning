"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ShieldCheck, Cpu, Globe, Zap, Lock, Cloud } from "lucide-react";

const BADGES = [
  { key: "aiPowered", Icon: Cpu },
  { key: "secure", Icon: Lock },
  { key: "global", Icon: Globe },
  { key: "realtime", Icon: Zap },
  { key: "cloudNative", Icon: Cloud },
  { key: "verified", Icon: ShieldCheck },
] as const;

/**
 * Trust badges ribbon showing platform credentials and tech highlights.
 * Placed between StatsBar and ReportCTA for conversion confidence.
 */
export function TrustBadges() {
  const t = useTranslations("trust");

  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-page)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
        >
          {BADGES.map(({ key, Icon }) => (
            <div
              key={key}
              className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]"
            >
              <Icon size={16} strokeWidth={2} aria-hidden="true" className="text-[var(--color-amber)]" />
              <span>{t(key)}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

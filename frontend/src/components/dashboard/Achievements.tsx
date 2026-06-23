"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Shield, CheckCircle2, Users, Trophy } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { shouldUseMock } from "@/lib/useMock";

const BADGES = [
  { key: "firstReport" as const, icon: Shield, color: "var(--color-amber)", earned: true },
  { key: "verifiedContributor" as const, icon: CheckCircle2, color: "var(--color-info)", earned: true },
  { key: "communityHelper" as const, icon: Users, color: "var(--color-success)", earned: true },
  { key: "safetyChampion" as const, icon: Trophy, color: "var(--color-danger)", earned: false },
];

export function Achievements() {
  const router = useRouter();
  const t = useTranslations("dashboard.achievements");
  const email = useAuthStore((state) => state.user?.email);

  if (!shouldUseMock(email)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="neu-card p-5"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{t("title")}</h3>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">Live achievements data is not available yet.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="neu-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {t("title")}
        </h3>
        <button
          onClick={() => router.push("/dashboard/achievements")}
          className="text-xs font-medium text-[var(--color-amber)] hover:underline"
        >
          {t("viewAll")}
        </button>
      </div>

      {/* Level */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-amber)] to-orange-500 flex items-center justify-center text-white">
          <Shield size={22} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {t("level", { level: 4 })}
            </span>
          </div>
          <p className="text-base font-bold text-[var(--color-text-primary)]">
            {t("roadGuardian")}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-[var(--color-text-muted)]">{t("progress")}</span>
          <span className="text-[11px] font-medium text-[var(--color-info)]">
            {t("toNextLevel", { percent: 72 })}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--color-surface)]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "72%" }}
            transition={{ duration: 1.2, ease: "easeOut" as const, delay: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-info)] to-[var(--color-amber)]"
          />
        </div>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-4 gap-2">
        {BADGES.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.key}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  badge.earned ? "" : "opacity-40 grayscale"
                }`}
                style={{
                  backgroundColor: `color-mix(in srgb, ${badge.color} 15%, transparent)`,
                  color: badge.color,
                }}
              >
                <Icon size={18} strokeWidth={2} />
              </span>
              <span className="text-[9px] text-[var(--color-text-muted)] text-center leading-tight">
                {t(`badges.${badge.key}`)}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

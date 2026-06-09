"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { FileText, CheckCircle2, CircleCheck, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import type { UserStats } from "@/components/my-reports/types";

function CountUp({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <>{count}</>;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

interface OverviewCardsProps {
  stats: UserStats;
  isLoading?: boolean;
}

export function OverviewCards({ stats, isLoading = false }: OverviewCardsProps) {
  const t = useTranslations("dashboard.overview");

  const verifiedReports = Math.max(0, stats.totalReports - stats.openReports - stats.rejectedReports);
  const verifiedPercent = stats.totalReports > 0
    ? Math.round((verifiedReports / stats.totalReports) * 100)
    : 0;
  const safetyScore = Math.min(100, Math.max(0, Math.round((stats.resolutionRate * 0.7) + (stats.rankPercentile * 0.3))));

  const CARDS = [
    {
      label: t("reportsSubmitted"),
      value: stats.totalReports,
      sub: t("thisMonth", { count: stats.totalReports }),
      icon: FileText,
      color: "var(--color-info)",
      prefix: "",
      suffix: "",
    },
    {
      label: t("verifiedReports"),
      value: verifiedReports,
      sub: t("percentVerified", { percent: verifiedPercent }),
      icon: CheckCircle2,
      color: "var(--color-amber)",
      prefix: "",
      suffix: "",
      progress: verifiedPercent,
      progressColor: "var(--color-amber)",
    },
    {
      label: t("resolvedIssues"),
      value: stats.resolvedReports,
      sub: t("percentResolved", { percent: Math.round(stats.resolutionRate) }),
      icon: CircleCheck,
      color: "var(--color-success)",
      prefix: "",
      suffix: "",
      progress: Math.round(stats.resolutionRate),
      progressColor: "var(--color-success)",
    },
    {
      label: t("safetyScore"),
      value: safetyScore,
      sub: t("communityContributor"),
      icon: Shield,
      color: "var(--color-amber)",
      prefix: "",
      suffix: "/100",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            variants={cardVariants}
            whileHover={{ y: -3 }}
            className="neu-card p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                {card.label}
              </span>
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `color-mix(in srgb, ${card.color} 15%, transparent)`,
                  color: card.color,
                }}
              >
                <Icon size={16} strokeWidth={2} />
              </span>
            </div>

            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-bold text-[var(--color-text-primary)]">
                {card.prefix}
                <CountUp target={isLoading ? 0 : card.value} />
              </span>
              {card.suffix && (
                <span className="text-lg font-semibold text-[var(--color-text-muted)]">
                  {card.suffix}
                </span>
              )}
            </div>

            {card.progress !== undefined ? (
              <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-[var(--color-surface)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${card.progress}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" as const, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: card.progressColor }}
                  />
                </div>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {card.sub}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                {card.label === t("reportsSubmitted") && (
                  <span className="text-[var(--color-success)]">↑</span>
                )}
                {card.sub}
              </span>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ScanEye,
  Gauge,
  Map as MapIcon,
  Camera,
  Cpu,
  ShieldAlert,
  BellRing,
  CheckCircle2,
} from "lucide-react";

import { AnalyticsMap } from "@/components/AnalyticsMap";
import { Link } from "@/i18n/navigation";

const DETECTION_PILLS = [
  "potholes",
  "flooding",
  "fallenTrees",
  "debris",
  "damagedRoads",
  "trafficHazards",
] as const;

const SEVERITY_METRICS = ["priority", "impact", "urgency"] as const;
const SEVERITY_INDICATORS = [
  { key: "critical", color: "var(--color-danger)" },
  { key: "high", color: "var(--color-amber)" },
  { key: "medium", color: "var(--color-info)" },
  { key: "low", color: "var(--color-success)" },
] as const;

const PREDICTIVE_LEGEND = [
  { key: "hotspots", color: "var(--color-danger)" },
  { key: "forecasting", color: "var(--color-amber)" },
  { key: "weather", color: "var(--color-info)" },
  { key: "trends", color: "var(--color-success)" },
] as const;
const PREDICTIVE_FEATURES = [
  "prediction",
  "mapping",
  "forecasting",
  "insights",
] as const;

const PROCESS_STEPS = [
  { key: "step1", Icon: Camera },
  { key: "step2", Icon: Cpu },
  { key: "step3", Icon: ShieldAlert },
  { key: "step4", Icon: BellRing },
  { key: "step5", Icon: CheckCircle2 },
] as const;

const RISK_SCORE = 87;

/** Container that staggers its children into view on scroll. */
const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Small ✓ feature pill. */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[var(--color-success)]">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </span>
  );
}

/** Circular risk gauge that fills its arc when it enters view. */
function RiskGauge() {
  const t = useTranslations("aiIntelligence.severity");
  const prefersReduced = useReducedMotion();

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  // 270° arc (three-quarter ring).
  const arcFraction = 0.75;
  const arcLength = circumference * arcFraction;
  const progress = (RISK_SCORE / 100) * arcLength;

  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-[135deg]">
        {/* Track */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
        />
        {/* Progress */}
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--color-danger)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          initial={{ strokeDashoffset: prefersReduced ? arcLength - progress : arcLength }}
          whileInView={{ strokeDashoffset: arcLength - progress }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
          {t("riskScore")}
        </span>
        <span className="font-mono text-4xl font-semibold text-[var(--color-text-primary)]">
          {RISK_SCORE}
        </span>
        <span className="font-mono text-xs text-[var(--color-text-muted)]">
          {t("scoreSuffix")}
        </span>
      </div>
    </div>
  );
}

/**
 * AI-Powered Safety Intelligence section: three feature cards (smart hazard
 * detection with the AVIF visual, a severity risk gauge, predictive Mapbox
 * analytics) plus a horizontal process timeline. Cards stagger into view.
 */
export function AiIntelligence() {
  const t = useTranslations("aiIntelligence");
  const prefersReduced = useReducedMotion();

  return (
    <section id="ai-intelligence" className="scroll-mt-20 bg-[var(--color-page)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] shadow-[var(--shadow-neu)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-amber)]" />
            {t("badge")}
          </span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-[var(--color-text-secondary)]">{t("subtitle")}</p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* Card 1 — Smart Hazard Detection */}
          <motion.article
            variants={cardVariants}
            whileHover={prefersReduced ? undefined : { y: -6 }}
            className="group neu-card flex flex-col gap-4 overflow-hidden p-5 sm:p-6"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[var(--color-border)]">
              <Image
                src="/images/ai-detection.avif"
                alt={t("detection.imageAlt")}
                fill
                loading="lazy"
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--color-info)_14%,transparent)] text-[var(--color-info)]">
                <ScanEye size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {t("detection.title")}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t("detection.description")}
            </p>
            <div className="mt-auto flex flex-wrap gap-2">
              {DETECTION_PILLS.map((p) => (
                <Pill key={p}>{t(`detection.pills.${p}`)}</Pill>
              ))}
            </div>
          </motion.article>

          {/* Card 2 — Severity Assessment */}
          <motion.article
            variants={cardVariants}
            whileHover={prefersReduced ? undefined : { y: -6 }}
            className="neu-card flex flex-col gap-4 p-5 sm:p-6"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--color-danger)_14%,transparent)] text-[var(--color-danger)]">
                <Gauge size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {t("severity.title")}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t("severity.description")}
            </p>

            <RiskGauge />

            <p className="text-center text-sm font-semibold text-[var(--color-danger)]">
              {t("severity.riskLevel")}
            </p>

            {/* Indicators */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
              {SEVERITY_INDICATORS.map((ind) => (
                <span
                  key={ind.key}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ind.color }} />
                  {t(`severity.indicators.${ind.key}`)}
                </span>
              ))}
            </div>

            {/* Metrics */}
            <dl className="mt-auto divide-y divide-[var(--color-border)] border-t border-[var(--color-border)] pt-1">
              {SEVERITY_METRICS.map((m) => (
                <div key={m} className="flex items-center justify-between py-2 text-sm">
                  <dt className="text-[var(--color-text-secondary)]">
                    {t(`severity.metrics.${m}`)}
                  </dt>
                  <dd className="font-medium text-[var(--color-text-primary)]">
                    {t(`severity.metricValues.${m}`)}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.article>

          {/* Card 3 — Predictive Analytics */}
          <motion.article
            variants={cardVariants}
            whileHover={prefersReduced ? undefined : { y: -6 }}
            className="neu-card flex flex-col gap-4 p-5 sm:p-6 md:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--color-amber)_16%,transparent)] text-[var(--color-amber)]">
                <MapIcon size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {t("predictive.title")}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t("predictive.description")}
            </p>

            <AnalyticsMap compact className="h-[220px] w-full" style={{ height: "220px", minHeight: "220px" }} showAttribution={false} />

            {/* Mapbox attribution kept minimal but present per Mapbox ToS */}
            <p className="-mt-2 text-right text-[10px] text-[var(--color-text-muted)]">
              {t("predictive.mapAttribution")}
            </p>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {PREDICTIVE_LEGEND.map((l) => (
                <span
                  key={l.key}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                  {t(`predictive.legend.${l.key}`)}
                </span>
              ))}
            </div>

            {/* Feature list */}
            <ul className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PREDICTIVE_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-[var(--color-success)]">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t(`predictive.features.${f}`)}
                </li>
              ))}
            </ul>

            <Link
              href="/analytics"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-amber)] transition-colors hover:text-[color-mix(in_srgb,var(--color-amber)_80%,black)]"
            >
              {t("predictive.viewFull")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </motion.article>
        </motion.div>

        {/* Process timeline */}
        <div className="mt-16">
          <h3 className="text-center text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {t("process.title")}
          </h3>

          <motion.ol
            variants={gridVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            className="mt-8 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:justify-between"
          >
            {PROCESS_STEPS.map(({ key, Icon }, index) => (
              <motion.li key={key} variants={cardVariants} className="flex flex-1 flex-col">
                <div className="flex items-center gap-4 lg:flex-col lg:gap-3 lg:text-center">
                  <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-card)] text-[var(--color-amber)] shadow-[var(--shadow-neu)]">
                    <Icon size={20} strokeWidth={2} aria-hidden="true" />
                    <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-amber)] font-mono text-[10px] font-semibold text-[#1c2b3a]">
                      {index + 1}
                    </span>
                  </span>
                  <div className="lg:mt-1">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {t(`process.${key}.title`)}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {t(`process.${key}.description`)}
                    </p>
                  </div>
                </div>

                {/* Connector */}
                {index < PROCESS_STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="ml-6 h-4 w-px bg-[var(--color-border)] lg:hidden"
                  />
                )}
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  );
}

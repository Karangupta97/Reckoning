"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Layers, Maximize2 } from "lucide-react";
import Link from "next/link";

// Lazy load the map — SSR disabled
const IndiaMap = dynamic(() => import("@/components/map/IndiaMap"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[var(--color-surface)] animate-pulse rounded-xl" />,
});

export function SafetyMapPreview() {
  const t = useTranslations("dashboard.safetyMap");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="neu-card overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between p-4 pb-0">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {t("title")}
        </h3>
        <Link href="/dashboard/safety-map">
          <button className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <Layers size={14} />
          </button>
        </Link>
      </div>

      <div className="relative flex-1 min-h-[240px] m-4 rounded-xl overflow-hidden" style={{ isolation: "isolate" }}>
        <Suspense fallback={<div className="absolute inset-0 bg-[var(--color-surface)] animate-pulse rounded-xl" />}>
          <IndiaMap
            adminRole="sub_district_admin"
            height="100%"
            showBreadcrumb={false}
            showControls={false}
            showLegend={false}
            showSidebar={false}
            isDark
          />
        </Suspense>

        {/* Open full map button */}
        <Link href="/dashboard/safety-map" className="absolute bottom-3 left-3 z-[400]">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-primary)] shadow-sm hover:shadow-md transition-shadow">
            <Maximize2 size={13} />
            {t("openFullMap")}
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

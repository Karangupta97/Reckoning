"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

type ReportStatus = "verified" | "inReview" | "resolved" | "pending";

const STATUS_STYLES: Record<ReportStatus, string> = {
  verified:
    "bg-[color-mix(in_srgb,var(--color-info)_15%,transparent)] text-[var(--color-info)]",
  inReview:
    "bg-[color-mix(in_srgb,var(--color-amber)_15%,transparent)] text-[var(--color-amber)]",
  resolved:
    "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)]",
  pending:
    "bg-[color-mix(in_srgb,var(--color-amber)_15%,transparent)] text-[var(--color-amber)]",
};

const REPORTS = [
  { id: "RW-1001", typeKey: "pothole" as const, location: "Panvel", status: "verified" as ReportStatus, dateKey: "today" as const },
  { id: "RW-1002", typeKey: "flooding" as const, location: "Mumbai-Pune Hwy", status: "inReview" as ReportStatus, dateKey: "yesterday" as const },
  { id: "RW-1003", typeKey: "brokenSignal" as const, location: "Navi Mumbai", status: "resolved" as ReportStatus, daysAgo: 2 },
  { id: "RW-1004", typeKey: "roadDebris" as const, location: "Thane", status: "pending" as ReportStatus, daysAgo: 3 },
];

const tableVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function MyReports() {
  const t = useTranslations("dashboard.myReports");

  return (
    <div className="neu-card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {t("title")}
        </h3>
        <button className="text-xs font-medium text-[var(--color-amber)] hover:underline">
          {t("viewAll")}
        </button>
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left min-w-[480px]">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="pb-2 text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                {t("columns.reportId")}
              </th>
              <th className="pb-2 text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                {t("columns.type")}
              </th>
              <th className="pb-2 text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                {t("columns.location")}
              </th>
              <th className="pb-2 text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                {t("columns.status")}
              </th>
              <th className="pb-2 text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                {t("columns.date")}
              </th>
            </tr>
          </thead>
          <motion.tbody
            variants={tableVariants}
            initial="hidden"
            animate="visible"
          >
            {REPORTS.map((report) => (
              <motion.tr
                key={report.id}
                variants={rowVariants}
                className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
              >
                <td className="py-3 text-xs font-mono font-medium text-[var(--color-text-primary)]">
                  {report.id}
                </td>
                <td className="py-3 text-xs text-[var(--color-text-secondary)]">
                  {t(`types.${report.typeKey}`)}
                </td>
                <td className="py-3 text-xs text-[var(--color-text-secondary)]">
                  {report.location}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${STATUS_STYLES[report.status]}`}
                  >
                    {t(`status.${report.status}`)}
                  </span>
                </td>
                <td className="py-3 text-xs text-[var(--color-text-muted)]">
                  {report.dateKey
                    ? t(`dates.${report.dateKey}`)
                    : t("dates.daysAgo", { count: report.daysAgo })}
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}

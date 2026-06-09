"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { MyReport } from "@/components/my-reports/types";

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

function mapStatus(status: MyReport["status"]): ReportStatus {
  if (status === "resolved") return "resolved";
  if (status === "verified") return "verified";
  if (status === "in_progress" || status === "assigned") return "inReview";
  return "pending";
}

function mapTypeKey(hazardType: MyReport["hazardType"]): "pothole" | "flooding" | "brokenSignal" | "roadDebris" {
  if (hazardType === "flooding") return "flooding";
  if (hazardType === "signal") return "brokenSignal";
  if (hazardType === "debris") return "roadDebris";
  return "pothole";
}

const tableVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface MyReportsProps {
  reports: MyReport[];
  isLoading?: boolean;
}

export function MyReports({ reports, isLoading = false }: MyReportsProps) {
  const t = useTranslations("dashboard.myReports");
  const router = useRouter();

  const rows = reports.slice(0, 5).map((report) => ({
    id: report.reportId || report.id,
    typeKey: mapTypeKey(report.hazardType),
    location: report.location.name,
    status: mapStatus(report.status),
    dateLabel: report.createdAt,
  }));

  return (
    <div className="neu-card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {t("title")}
        </h3>
        <button
          onClick={() => router.push("/dashboard/my-reports")}
          className="text-xs font-medium text-[var(--color-amber)] hover:underline"
        >
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
            {rows.map((report) => (
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
                  {new Date(report.dateLabel).toLocaleDateString()}
                </td>
              </motion.tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-[var(--color-text-muted)]">
                  No reports found.
                </td>
              </tr>
            )}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}

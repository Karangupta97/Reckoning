import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnalyticsMap } from "@/components/AnalyticsMap";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

const LEGEND = [
  { key: "accident", color: "#EF4444" },
  { key: "highRisk", color: "#F59E0B" },
  { key: "weather", color: "#3B82F6" },
  { key: "infrastructure", color: "#22C55E" },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "analytics" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function AnalyticsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "analytics" });

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("back")}
        </Link>

        <div className="mt-6 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] shadow-[var(--shadow-neu)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-amber)]" />
            {t("badge")}
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            {t("subtitle")}
          </p>
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          {LEGEND.map((l) => (
            <span
              key={l.key}
              className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              {t(`legend.${l.key}`)}
            </span>
          ))}
        </div>

        <div className="mt-6">
          <AnalyticsMap />
        </div>

        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          {t("note")}
        </p>
      </main>
      <Footer />
    </>
  );
}

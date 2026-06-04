import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Conversion-focused call-to-action with a large amber button to /report.
 */
export function ReportCTA() {
  const t = useTranslations("cta");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <div className="neu-card-lg road-pattern relative overflow-hidden px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-card)_75%)]"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-[var(--color-text-secondary)]">
              {t("subtitle")}
            </p>
            <Link
              href="/report"
              className="btn-amber mt-8 inline-flex px-8 py-4 text-lg"
            >
              {t("button")}
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

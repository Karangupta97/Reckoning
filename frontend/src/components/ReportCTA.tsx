import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

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
        <div className="neu-card-lg road-pattern relative overflow-hidden px-6 py-16 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-card)_75%)]"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
              {t("title")}
            </h2>
            <p className="mt-5 text-lg text-[var(--color-text-secondary)]">
              {t("subtitle")}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard/report"
                className="btn-amber inline-flex items-center gap-2 px-8 py-4 text-lg"
              >
                {t("button")}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="btn-outline inline-flex items-center gap-2 px-8 py-4 text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

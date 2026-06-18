import { useTranslations } from "next-intl";

import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Full-width impact stats bar on the surface background. Numeric values count up
 * on scroll; the average-resolution value is a localized string.
 */
export function StatsBar() {
  const t = useTranslations("stats");

  return (
    <section className="bg-[var(--color-surface)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
            {t("title")}
          </h2>
        </Reveal>

        <dl className="mt-10 grid grid-cols-2 gap-6 text-center lg:grid-cols-4">
          <div className="flex flex-col">
            <dd className="font-mono text-3xl font-medium text-[var(--color-amber)] sm:text-4xl">
              <CountUp end={2400} suffix="+" />
            </dd>
            <dt className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {t("items.reports")}
            </dt>
          </div>
          <div className="flex flex-col">
            <dd className="font-mono text-3xl font-medium text-[var(--color-amber)] sm:text-4xl">
              <CountUp end={7} />
            </dd>
            <dt className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {t("items.countries")}
            </dt>
          </div>
          <div className="flex flex-col">
            <dd className="font-mono text-3xl font-medium text-[var(--color-amber)] sm:text-4xl">
              {t("values.resolution")}
            </dd>
            <dt className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {t("items.resolution")}
            </dt>
          </div>
          <div className="flex flex-col">
            <dd className="font-mono text-3xl font-medium text-[var(--color-amber)] sm:text-4xl">
              <CountUp end={94} suffix="%" />
            </dd>
            <dt className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {t("items.accuracy")}
            </dt>
          </div>
        </dl>
      </div>
    </section>
  );
}

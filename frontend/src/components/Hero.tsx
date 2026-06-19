import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { CountUp } from "@/components/ui/CountUp";
import { InstallPWAButton } from "@/components/pwa/InstallPWAButton";

/**
 * Landing hero with the dashed road-line background, headline, dual CTAs and an
 * animated stat ticker that counts up on scroll into view.
 */
export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="road-pattern relative overflow-hidden">
      {/* Soft vignette so text stays legible over the road pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-page)_78%)]"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-24 pt-20 text-center sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] shadow-[var(--shadow-neu)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-amber)]" />
          {t("badge")}
        </span>

        <h1 className="mt-8 max-w-4xl text-4xl font-semibold leading-[1.1] tracking-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl xl:text-7xl">
          {t("headline")}
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg lg:text-xl">
          {t("subheadline")}
        </p>

        <div className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/dashboard/report"
            className="btn-amber w-full px-8 py-3.5 text-base font-semibold sm:w-auto"
          >
            {t("ctaPrimary")}
          </Link>
          <a
            href="#how-it-works"
            className="btn-outline w-full px-8 py-3.5 text-base sm:w-auto"
          >
            {t("ctaSecondary")}
          </a>
          <InstallPWAButton variant="hero" />
        </div>

        {/* Animated stat ticker */}
        <dl className="mt-16 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="neu-card flex flex-col items-center px-4 py-6">
            <dt className="order-2 mt-1.5 text-sm text-[var(--color-text-muted)]">
              {t("stats.reports")}
            </dt>
            <dd className="order-1 font-mono text-3xl font-medium text-[var(--color-text-primary)]">
              <CountUp end={2400} suffix="+" />
            </dd>
          </div>
          <div className="neu-card flex flex-col items-center px-4 py-6">
            <dt className="order-2 mt-1.5 text-sm text-[var(--color-text-muted)]">
              {t("stats.countries")}
            </dt>
            <dd className="order-1 font-mono text-3xl font-medium text-[var(--color-text-primary)]">
              <CountUp end={7} />
            </dd>
          </div>
          <div className="neu-card flex flex-col items-center px-4 py-6">
            <dt className="order-2 mt-1.5 text-sm text-[var(--color-text-muted)]">
              {t("stats.resolution")}
            </dt>
            <dd className="order-1 font-mono text-3xl font-medium text-[var(--color-text-primary)]">
              <CountUp end={94} suffix="%" />
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

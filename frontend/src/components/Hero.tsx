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

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24 lg:px-8">
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
          {t("headline")}
        </h1>

        <p className="mt-5 max-w-xl text-base text-[var(--color-text-secondary)] sm:text-lg">
          {t("subheadline")}
        </p>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/dashboard/report"
            className="btn-amber w-full px-6 py-3 text-base sm:w-auto"
          >
            {t("ctaPrimary")}
          </Link>
          <a
            href="#how-it-works"
            className="btn-outline w-full px-6 py-3 text-base sm:w-auto"
          >
            {t("ctaSecondary")}
          </a>
          <InstallPWAButton variant="hero" />
        </div>

        {/* Animated stat ticker */}
        <dl className="mt-14 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="neu-card flex flex-col items-center px-4 py-5">
            <dt className="order-2 mt-1 text-sm text-[var(--color-text-muted)]">
              {t("stats.reports")}
            </dt>
            <dd className="order-1 font-mono text-3xl font-medium text-[var(--color-text-primary)]">
              <CountUp end={2400} suffix="+" />
            </dd>
          </div>
          <div className="neu-card flex flex-col items-center px-4 py-5">
            <dt className="order-2 mt-1 text-sm text-[var(--color-text-muted)]">
              {t("stats.countries")}
            </dt>
            <dd className="order-1 font-mono text-3xl font-medium text-[var(--color-text-primary)]">
              <CountUp end={7} />
            </dd>
          </div>
          <div className="neu-card flex flex-col items-center px-4 py-5">
            <dt className="order-2 mt-1 text-sm text-[var(--color-text-muted)]">
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

import { useTranslations } from "next-intl";
import { Camera, ScanSearch, MailCheck } from "lucide-react";

import { Reveal } from "@/components/ui/Reveal";

const STEPS = [
  { key: "step1", Icon: Camera },
  { key: "step2", Icon: ScanSearch },
  { key: "step3", Icon: MailCheck },
] as const;

/**
 * Three-step explainer. Horizontal on desktop, vertical stack on mobile.
 */
export function HowItWorks() {
  const t = useTranslations("howItWorks");

  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8"
    >
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-3 text-[var(--color-text-secondary)]">
          {t("subtitle")}
        </p>
      </Reveal>

      <ol className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map(({ key, Icon }, index) => (
          <Reveal as="li" key={key} delay={index * 120}>
            <div className="neu-card relative flex h-full flex-col items-start gap-4 p-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                {t(`${key}.label`)}
              </span>

              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-amber)_16%,transparent)] text-[var(--color-amber)]">
                <Icon size={24} strokeWidth={2} aria-hidden="true" />
              </span>

              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {t(`${key}.title`)}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {t(`${key}.description`)}
              </p>

              <span
                aria-hidden="true"
                className="absolute right-5 top-5 font-mono text-4xl font-medium text-[var(--color-border)]"
              >
                {index + 1}
              </span>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

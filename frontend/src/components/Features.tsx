import { useTranslations } from "next-intl";
import {
  ScanEye,
  Activity,
  Mail,
  WifiOff,
  Languages,
  MapPin,
} from "lucide-react";

import { Reveal } from "@/components/ui/Reveal";

const FEATURES = [
  { key: "detection", Icon: ScanEye },
  { key: "tracking", Icon: Activity },
  { key: "notifications", Icon: Mail },
  { key: "offline", Icon: WifiOff },
  { key: "multilingual", Icon: Languages },
  { key: "location", Icon: MapPin },
] as const;

/**
 * Feature grid — 2 columns on mobile, 3 on desktop. Neumorphic cards.
 */
export function Features() {
  const t = useTranslations("features");

  return (
    <section
      id="features"
      className="bg-[var(--color-page)] scroll-mt-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            {t("subtitle")}
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {FEATURES.map(({ key, Icon }, index) => (
            <Reveal key={key} delay={(index % 3) * 100}>
              <div className="neu-card flex h-full flex-col gap-3 p-5 sm:p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-info)_14%,transparent)] text-[var(--color-info)]">
                  <Icon size={22} strokeWidth={2} aria-hidden="true" />
                </span>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {t(`items.${key}.description`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

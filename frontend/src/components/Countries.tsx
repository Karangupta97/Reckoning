import { useTranslations } from "next-intl";

import { Reveal } from "@/components/ui/Reveal";

type CountryRow = {
  key: string;
  flag: string;
  /** Native language name for the country. */
  language: string;
  active: boolean;
};

// India, Bangladesh and Nepal are live; the rest are coming soon.
const COUNTRIES: CountryRow[] = [
  { key: "india", flag: "🇮🇳", language: "हिन्दी", active: true },
  { key: "bangladesh", flag: "🇧🇩", language: "বাংলা", active: true },
  { key: "nepal", flag: "🇳🇵", language: "नेपाली", active: true },
  { key: "bhutan", flag: "🇧🇹", language: "རྫོང་ཁ", active: false },
  { key: "myanmar", flag: "🇲🇲", language: "မြန်မာ", active: false },
  { key: "srilanka", flag: "🇱🇰", language: "සිංහල", active: false },
  { key: "thailand", flag: "🇹🇭", language: "ไทย", active: false },
];

/**
 * BIMSTEC nations grid with flag, translated name, native language and an
 * Active / Coming soon status badge.
 */
export function Countries() {
  const t = useTranslations("countries");

  return (
    <section
      id="countries"
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

      <ul className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {COUNTRIES.map((country, index) => (
          <Reveal as="li" key={country.key} delay={(index % 4) * 80}>
            <div className="neu-card flex h-full flex-col items-start gap-3 p-5">
              <span aria-hidden="true" className="text-4xl leading-none">
                {country.flag}
              </span>
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                  {t(`names.${country.key}`)}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {country.language}
                </p>
              </div>
              <span
                className={`mt-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  country.active ? "badge-active" : "badge-soon"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${
                    country.active
                      ? "bg-[var(--color-success)]"
                      : "bg-[var(--color-text-muted)]"
                  }`}
                />
                {country.active ? t("status.active") : t("status.comingSoon")}
              </span>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

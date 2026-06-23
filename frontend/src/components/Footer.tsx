import { useTranslations } from "next-intl";

import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const FOOTER_LINKS = [
  { key: "privacy", href: "/privacy", external: false },
  { key: "terms", href: "/terms", external: false },
  {
    key: "github",
    href: "https://github.com/Karangupta97/Reckoning",
    external: true,
  },
  { key: "contact", href: "mailto:hello@reckoning.app", external: true },
] as const;

/**
 * Site footer: wordmark + tagline, links, attribution, language switcher and the
 * hackathon credit.
 */
export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-page)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t("tagline")}
            </p>
            <p className="mt-4 font-mono text-xs text-[var(--color-text-muted)]">
              {t("attribution")}
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
            <nav aria-label="Footer">
              <ul className="flex flex-col gap-3">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      {...(link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                    >
                      {t(`links.${link.key}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <LanguageSwitcher dropUp />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[var(--color-border)] pt-6 text-xs text-[var(--color-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Reckoning. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}

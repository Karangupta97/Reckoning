"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  LogIn,
  Shield,
  Map,
  Building2,
  UserCog,
  ArrowUpRight,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const PRODUCT_LINKS = [
  { key: "howItWorks", href: "#how-it-works" },
  { key: "features", href: "#features" },
  { key: "countries", href: "#countries" },
  { key: "analytics", href: "/analytics" },
] as const;

const DASHBOARD_LINKS = [
  { key: "citizenDashboard", href: "/dashboard", Icon: LayoutDashboard },
  { key: "districtAdmin", href: "/district-admin", Icon: Building2 },
  { key: "subDistrictAdmin", href: "/sub-district-admin", Icon: Map },
  { key: "superAdmin", href: "/super-admin", Icon: UserCog },
] as const;

const AUTH_LINKS = [
  { key: "citizenLogin", href: "/login", Icon: LogIn },
  { key: "adminLogin", href: "/admin/login", Icon: Shield },
  { key: "register", href: "/register", Icon: ArrowUpRight },
] as const;

const LEGAL_LINKS = [
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
  {
    key: "github",
    href: "https://github.com/",
    external: true,
  },
  { key: "contact", href: "mailto:hello@reckoning.app", external: true },
] as const;

/**
 * Enhanced site footer with product, dashboard, auth and legal link columns,
 * plus a bottom bar with attribution.
 */
export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Top section: Logo + columns */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t("tagline")}
            </p>
            <p className="mt-4 font-mono text-xs text-[var(--color-text-muted)]">
              {t("attribution")}
            </p>
            <div className="mt-5">
              <LanguageSwitcher dropUp />
            </div>
          </div>

          {/* Product column */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {t("sections.product")}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.key}>
                  {link.href.startsWith("#") ? (
                    <a
                      href={link.href}
                      className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                    >
                      {t(`links.${link.key}`)}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                    >
                      {t(`links.${link.key}`)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Dashboards column */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {t("sections.dashboards")}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {DASHBOARD_LINKS.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                  >
                    <link.Icon size={14} strokeWidth={2} aria-hidden="true" className="text-[var(--color-text-muted)]" />
                    {t(`links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account / Auth column */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {t("sections.account")}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {AUTH_LINKS.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                  >
                    <link.Icon size={14} strokeWidth={2} aria-hidden="true" className="text-[var(--color-text-muted)]" />
                    {t(`links.${link.key}`)}
                  </Link>
                </li>
              ))}

              {/* Divider + legal */}
              <li className="mt-2 border-t border-[var(--color-border)] pt-3">
                <ul className="flex flex-col gap-3">
                  {LEGAL_LINKS.map((link) => (
                    <li key={link.key}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                        >
                          {t(`links.${link.key}`)}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                        >
                          {t(`links.${link.key}`)}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--color-text-muted)]">
            © {year} Reckoning. {t("rights")}
          </p>
          <p className="font-mono text-xs text-[var(--color-text-muted)]">
            {t("builtFor")}
          </p>
        </div>
      </div>
    </footer>
  );
}

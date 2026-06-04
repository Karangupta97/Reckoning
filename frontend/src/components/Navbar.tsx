"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallPWAButton } from "@/components/pwa/InstallPWAButton";

const NAV_LINKS = [
  { href: "#how-it-works", key: "howItWorks" },
  { href: "#features", key: "features" },
  { href: "#countries", key: "countries" },
] as const;

/**
 * Sticky navbar with backdrop blur on scroll, desktop links, a language
 * switcher and a mobile slide-down drawer.
 */
export function Navbar() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
        scrolled
          ? "border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-page)_80%,transparent)] backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Reckoning home"
          className="shrink-0"
          onClick={() => setMenuOpen(false)}
        >
          <Logo />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
            >
              {t(link.key)}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          <div className="hidden md:block">
            <InstallPWAButton variant="compact" />
          </div>

          <Link
            href="/login"
            className="btn-amber hidden px-4 py-2 text-sm md:inline-flex"
          >
            {t("login")}
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-primary)] md:hidden"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile slide-down drawer */}
      <div
        id="mobile-menu"
        className={`overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-page)] transition-[max-height] duration-300 ease-out md:hidden ${
          menuOpen ? "max-h-96" : "max-h-0 border-t-transparent"
        }`}
      >
        <div className="flex flex-col gap-1 px-4 py-4 sm:px-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
            >
              {t(link.key)}
            </a>
          ))}

          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="btn-amber mt-2 px-4 py-3 text-center text-base"
          >
            {t("login")}
          </Link>

          <div className="mt-2">
            <InstallPWAButton variant="default" className="w-full justify-center" />
          </div>

          <div className="mt-3 border-t border-[var(--color-border)] pt-3">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}

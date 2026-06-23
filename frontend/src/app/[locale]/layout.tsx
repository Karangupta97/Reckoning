import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import { locales } from "@/i18n/locales";
import { routing } from "@/i18n/routing";

/**
 * Pre-render every supported locale at build time.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Guard against unknown first-path segments hitting the catch-all.
  if (!hasLocale(locales, locale)) {
    notFound();
  }

  // Enables static rendering for this locale.
  setRequestLocale(locale);

  const messages = await getMessages();

  const QueryProvider = (await import("../query-provider")).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryProvider>
        {children}
      </QueryProvider>
    </NextIntlClientProvider>
  );
}

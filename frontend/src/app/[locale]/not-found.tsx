import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";

/**
 * Localized 404 for unknown routes under the `[locale]` segment.
 */
export default function NotFound() {
  const t = useTranslations("nav");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <Logo />
      <p className="mt-10 font-mono text-6xl font-medium text-[var(--color-amber)]">
        404
      </p>
      <h1 className="mt-4 text-2xl font-semibold text-[var(--color-text-primary)]">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-[var(--color-text-secondary)]">
        The road you were looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="btn-amber mt-8 px-6 py-3 text-base">
        {t("reportNow")}
      </Link>
    </main>
  );
}

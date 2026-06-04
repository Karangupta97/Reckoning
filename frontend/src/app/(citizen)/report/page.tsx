import { memo } from "react";
import Link from "next/link";

import { Logo } from "@/components/ui/Logo";

/**
 * Placeholder report page. The landing CTAs route here; the full reporting flow
 * (photo capture → AI detection → submission) is implemented separately.
 *
 * This route lives outside the `[locale]` segment, so it uses the plain Next.js
 * `Link` rather than the locale-aware navigation helper.
 */
const ReportPage = () => {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <Logo />
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        Report a Road Issue
      </h1>
      <p className="max-w-md text-[var(--color-text-secondary)]">
        The reporting flow is coming soon. Snap a photo, let AI detect the issue,
        and we&apos;ll route it to the right authority.
      </p>
      <Link href="/" className="btn-outline px-6 py-3 text-base">
        Back to home
      </Link>
    </main>
  );
};

export default memo(ReportPage);
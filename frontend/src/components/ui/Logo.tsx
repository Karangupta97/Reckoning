import Image from "next/image";

type LogoProps = {
  className?: string;
  /** Size of the mark in px. */
  size?: number;
};

/**
 * Reckoning logo mark — uses the app icon image.
 */
export function LogoMark({ className, size = 28 }: LogoProps) {
  return (
    <Image
      src="/android-chrome-192x192.png"
      alt="Reckoning"
      width={size}
      height={size}
      className={`rounded-md ${className ?? ""}`}
      aria-hidden
    />
  );
}

/** Full wordmark: icon + RECKONING. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark />
      <span className="font-sans font-semibold tracking-tight text-[var(--color-text-primary)] text-lg">
        RECKONING
      </span>
    </span>
  );
}

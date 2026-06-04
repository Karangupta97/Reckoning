type LogoProps = {
  className?: string;
  /** Size of the mark in px. */
  size?: number;
};

/**
 * Reckoning road/warning mark — an inline SVG so it inherits color and needs no
 * network request. A wedge of road with a dashed amber centre line.
 */
export function LogoMark({ className, size = 28 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="#1C2B3A" />
      <path d="M11 25 L14 8 L18 8 L21 25 Z" fill="#3A4658" />
      <g fill="#F59E0B">
        <rect x="15" y="9" width="2" height="4" rx="1" />
        <rect x="15" y="15" width="2" height="4" rx="1" />
        <rect x="15" y="21" width="2" height="4" rx="1" />
      </g>
    </svg>
  );
}

/** Full wordmark: icon + RECKONING in DM Sans 600. */
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

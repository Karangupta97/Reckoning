'use client';

interface MapSkeletonProps {
  height?: string;
}

export function MapSkeleton({ height = '500px' }: MapSkeletonProps) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height, width: '100%', borderRadius: '12px' }}
    >
      {/* Shimmer background */}
      <div className="absolute inset-0 map-skeleton-shimmer" />

      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        {/* India outline SVG */}
        <svg
          viewBox="0 0 200 220"
          className="w-[180px] h-[200px] opacity-[0.12]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <path d="M100,8 L108,12 L115,10 L120,15 L125,12 L130,18 L128,25 L135,28 L140,25 L148,30 L152,28 L158,35 L155,42 L160,48 L165,45 L170,52 L168,58 L172,65 L175,70 L170,78 L172,85 L168,92 L170,98 L165,105 L168,112 L162,118 L158,125 L155,132 L150,138 L145,142 L140,148 L135,155 L128,160 L122,165 L118,172 L112,178 L108,185 L102,190 L98,195 L92,198 L88,202 L82,205 L78,202 L72,198 L68,192 L62,188 L58,182 L52,178 L48,172 L45,165 L42,158 L38,152 L35,145 L32,138 L30,130 L28,122 L30,115 L28,108 L32,100 L30,92 L35,85 L38,78 L42,72 L45,65 L48,58 L52,52 L55,45 L60,40 L65,35 L70,30 L75,25 L80,20 L85,15 L90,12 L95,10 Z" />
          <path d="M68,45 L72,48 L75,52 L78,48 L82,45 L85,48 L88,52 L92,48" opacity="0.5" />
          <path d="M45,95 L42,100 L38,105 L35,110 L38,115" opacity="0.5" />
        </svg>

        {/* Spinner */}
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-amber)]" />

        {/* Text */}
        <p className="text-sm text-[var(--color-text-muted)]">Loading map…</p>
      </div>
    </div>
  );
}

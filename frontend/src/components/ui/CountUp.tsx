"use client";

import { useEffect, useRef, useState } from "react";

import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

type CountUpProps = {
  /** Target value to count up to. */
  end: number;
  /** Animation duration in ms. */
  duration?: number;
  /** Rendered before the number, e.g. "$". */
  prefix?: string;
  /** Rendered after the number, e.g. "+" or "%". */
  suffix?: string;
  /** Decimal places to show. */
  decimals?: number;
  className?: string;
};

/** Formats a number with thousands separators and fixed decimals. */
function format(value: number, decimals: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Counts a number up from 0 to `end` once it scrolls into view. Respects the
 * user's reduced-motion preference by jumping straight to the final value.
 */
export function CountUp({
  end,
  duration = 1800,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: CountUpProps) {
  const { ref, isVisible } = useIntersectionObserver<HTMLSpanElement>();
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      // Defer to a microtask so we don't setState synchronously in the effect.
      const id = requestAnimationFrame(() => setValue(end));
      return () => cancelAnimationFrame(id);
    }

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic for a natural settle.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(end * eased);
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setValue(end);
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [isVisible, end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {format(value, decimals)}
      {suffix}
    </span>
  );
}

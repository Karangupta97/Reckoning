"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  /** Fraction of the element that must be visible to trigger (0–1). */
  threshold?: number;
  /** Root margin, same syntax as the IntersectionObserver API. */
  rootMargin?: string;
  /** Only fire once, then disconnect. Defaults to true. */
  once?: boolean;
};

/**
 * Observes an element and reports when it enters the viewport. Used to trigger
 * scroll-in fade animations and the stat count-up effect.
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.2,
  rootMargin = "0px 0px -10% 0px",
  once = true,
}: Options = {}) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Environments without IntersectionObserver: reveal on the next frame so we
    // never call setState synchronously inside the effect body.
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}

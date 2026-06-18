"use client";

import type { ElementType, ReactNode } from "react";

import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

type RevealProps = {
  children: ReactNode;
  /** Stagger delay in ms applied as an inline transition-delay. */
  delay?: number;
  className?: string;
  /** Element/tag to render. Defaults to a div. */
  as?: ElementType;
};

/**
 * Wraps content in a scroll-triggered fade-in. Adds the `visible` class once the
 * element enters the viewport. Animation is disabled via CSS when the user
 * prefers reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      className={`fade-in ${isVisible ? "visible" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

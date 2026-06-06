"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SettingsSidebar } from "./SettingsSidebar";
import { CategoryList } from "./CategoryList";
import { SettingsDetail } from "./SettingsDetail";
import { useSettingsStore } from "../../store/settingsStore";
import type { SettingsCategory } from "./types";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Slide variants for mobile navigation
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0.6,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-50%" : "50%",
    opacity: 0,
  }),
};

export function SettingsLayout() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { activeCategory, setActiveCategory } = useSettingsStore();
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [direction, setDirection] = useState(0);

  const handleSelectCategory = useCallback(
    (category: SettingsCategory) => {
      setActiveCategory(category);
      if (!isDesktop) {
        setDirection(1);
        setMobileShowDetail(true);
      }
    },
    [isDesktop, setActiveCategory]
  );

  const handleBack = useCallback(() => {
    setDirection(-1);
    setMobileShowDetail(false);
  }, []);

  // Reset mobile state when switching to desktop
  useEffect(() => {
    if (isDesktop) {
      setMobileShowDetail(false);
    }
  }, [isDesktop]);

  // Desktop: dual-pane master-detail layout
  if (isDesktop) {
    return (
      <div className="flex h-full rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)] mx-4 sm:mx-6 lg:mx-8 my-4 shadow-sm">
        <SettingsSidebar
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />
        <SettingsDetail category={activeCategory} />
      </div>
    );
  }

  // Mobile: drill-down push navigation
  return (
    <div className="h-full relative overflow-hidden">
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        {!mobileShowDetail ? (
          <motion.div
            key="category-list"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <CategoryList onSelectCategory={handleSelectCategory} />
          </motion.div>
        ) : (
          <motion.div
            key="settings-detail"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <SettingsDetail
              category={activeCategory}
              onBack={handleBack}
              showBackButton
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

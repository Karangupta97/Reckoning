"use client";

import { useTranslations } from "next-intl";
import { motion, type Variants } from "framer-motion";
import { Quote } from "lucide-react";

const TESTIMONIALS = [
  { key: "t1", avatar: "🇮🇳" },
  { key: "t2", avatar: "🇧🇩" },
  { key: "t3", avatar: "🇳🇵" },
] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Social proof section with testimonial cards from users across BIMSTEC nations.
 */
export function Testimonials() {
  const t = useTranslations("testimonials");

  return (
    <section className="bg-[var(--color-surface)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {TESTIMONIALS.map(({ key, avatar }) => (
            <motion.blockquote
              key={key}
              variants={cardVariants}
              className="neu-card flex flex-col gap-4 p-6"
            >
              <Quote
                size={24}
                strokeWidth={1.5}
                className="text-[var(--color-amber)] opacity-60"
                aria-hidden="true"
              />
              <p className="flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                &ldquo;{t(`${key}.quote`)}&rdquo;
              </p>
              <div className="flex items-center gap-3 border-t border-[var(--color-border)] pt-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-page)] text-lg">
                  {avatar}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {t(`${key}.name`)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {t(`${key}.role`)}
                  </p>
                </div>
              </div>
            </motion.blockquote>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

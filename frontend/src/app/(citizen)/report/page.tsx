"use client";

import { motion } from "framer-motion";
import { ReportHazardForm } from "@/components/report";

export default function ReportPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto pb-32 sm:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--color-text-primary)]">
            Report Road Hazard
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Help keep roads safe — report hazards and let authorities take action.
          </p>
        </div>

        {/* Main Form */}
        <ReportHazardForm />
      </motion.div>
    </div>
  );
}

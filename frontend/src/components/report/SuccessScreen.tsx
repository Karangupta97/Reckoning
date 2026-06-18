"use client";

import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";

interface SuccessScreenProps {
  reportId: string;
  ticketNumber: string;
  onTrackReport?: () => void;
}

export function SuccessScreen({ reportId, ticketNumber, onTrackReport }: SuccessScreenProps) {
  const router = useRouter();

  const handleNewReport = () => {
    router.push("/dashboard/report");
  };

  const handleViewReports = () => {
    router.push("/dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center text-center py-12 px-6"
    >
      {/* Success animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] flex items-center justify-center mb-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 12 }}
        >
          <CheckCircle
            size={44}
            className="text-[var(--color-success)]"
            strokeWidth={1.5}
          />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-xl font-semibold text-[var(--color-text-primary)] mb-2"
      >
        Report submitted successfully
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-2"
      >
        Your hazard report has been received and will be reviewed by the relevant authority.
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-xs text-[var(--color-text-muted)] mb-2"
      >
        Report ID: <span className="font-mono font-medium">{reportId}</span>
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        className="text-xs text-[var(--color-text-muted)] mb-8"
      >
        Ticket number: <span className="font-mono font-medium text-[var(--color-text-primary)]">{ticketNumber}</span>
      </motion.p>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-sm"
      >
        <button
          type="button"
          onClick={onTrackReport ?? handleViewReports}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-amber)] text-[#1c2b3a] font-semibold text-sm hover:brightness-105 transition-all"
        >
          <Ticket size={16} />
          Track this report
        </button>
        <button
          type="button"
          onClick={handleNewReport}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-primary)] font-medium text-sm hover:bg-[var(--color-surface)] transition-all"
        >
          New Report
          <ArrowRight size={16} />
        </button>
      </motion.div>
    </motion.div>
  );
}

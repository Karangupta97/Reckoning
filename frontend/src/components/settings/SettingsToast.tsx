"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface SettingsToastProps {
  show: boolean;
  message?: string;
}

export function SettingsToast({ show, message = "Settings Updated" }: SettingsToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="fixed bottom-28 lg:bottom-8 left-1/2 -translate-x-1/2 z-[200]
            flex items-center gap-2.5 px-5 py-3 rounded-2xl
            bg-[var(--color-text-primary)] text-[var(--color-card)]
            shadow-xl text-sm font-medium backdrop-blur-md"
        >
          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 20 }}
            className="w-5 h-5 rounded-full bg-[var(--color-success)] flex items-center justify-center"
          >
            <Check size={11} strokeWidth={3} className="text-white" />
          </motion.span>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

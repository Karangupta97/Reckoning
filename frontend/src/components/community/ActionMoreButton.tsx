"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, Trash2 } from "lucide-react";

interface ActionMoreButtonProps {
  onDelete?: () => void;
}

export default function ActionMoreButton({ onDelete }: ActionMoreButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="w-10 h-10 rounded-full bg-black/30 border border-white/20 flex items-center justify-center text-white shadow-lg backdrop-blur"
        aria-label="More actions"
      >
        <MoreHorizontal size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 top-full z-50 mt-2 w-40 rounded-2xl border border-white/10 bg-[var(--color-card)] shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onDelete();
                  }}
                  className="w-full px-3 py-2 text-left text-sm font-semibold text-[var(--color-danger)] hover:bg-[rgba(255,255,255,0.05)]"
                >
                  <div className="flex items-center gap-2">
                    <Trash2 size={16} />
                    Delete
                  </div>
                </button>
              ) : (
                <div className="p-3 text-sm text-[var(--color-text-secondary)]">No actions available</div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

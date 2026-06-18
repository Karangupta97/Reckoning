"use client";

import { motion } from "framer-motion";

const EMOJIS = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];

interface EmojiReactionBarProps {
  onReact: (emoji: string) => void;
}

export function EmojiReactionBar({ onReact }: EmojiReactionBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-t border-[var(--color-border)] overflow-x-auto"
      style={{ scrollbarWidth: "none" }}
    >
      {EMOJIS.map((emoji) => (
        <motion.button
          key={emoji}
          onClick={() => onReact(emoji)}
          whileTap={{ scale: 1.3 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="text-2xl shrink-0 w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform"
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}

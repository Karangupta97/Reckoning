"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { MOCK_STORIES, SEVERITY_COLORS } from "./mockData";
import type { StoryItem } from "./types";

export function StoriesRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto bg-[var(--color-card)]/80 backdrop-blur-md"
      style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
    >
      {MOCK_STORIES.map((story) => (
        <StoryCircle key={story.id} story={story} />
      ))}
    </div>
  );
}

function StoryCircle({ story }: { story: StoryItem }) {
  if (story.type === "new") {
    return (
      <button className="flex flex-col items-center gap-1 shrink-0">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--color-amber)] flex items-center justify-center">
          <Plus size={24} className="text-[var(--color-amber)]" />
        </div>
        <span className="text-[0.65rem] text-[var(--color-text-muted)] text-center w-16 truncate">
          {story.label}
        </span>
      </button>
    );
  }

  const ringColor = SEVERITY_COLORS[story.severity || "medium"];
  const isCritical = story.severity === "critical";

  return (
    <button className="flex flex-col items-center gap-1 shrink-0">
      <motion.div
        className="w-16 h-16 rounded-full p-[2.5px]"
        style={{ background: ringColor }}
        animate={isCritical ? { opacity: [1, 0.4, 1] } : undefined}
        transition={isCritical ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        <div className="w-full h-full rounded-full bg-[var(--color-card)] p-[2px]">
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: `${ringColor}20` }}
          >
            {story.emoji}
          </div>
        </div>
      </motion.div>
      <span className="text-[0.65rem] text-[var(--color-text-muted)] text-center w-16 leading-tight line-clamp-2">
        {story.location}
      </span>
    </button>
  );
}

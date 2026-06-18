"use client";

import { motion } from "framer-motion";
import { Landmark, BadgeCheck, Heart } from "lucide-react";
import type { OfficialResponse } from "./types";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  }) + " · " + date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function OfficialResponseCard({ response }: { response: OfficialResponse }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-[var(--color-info)]/20 bg-[color-mix(in_srgb,var(--color-info)_6%,var(--color-card))] p-4"
      style={{ borderLeft: "3px solid var(--color-info)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Landmark size={15} className="text-[var(--color-info)]" />
        <span className="text-xs font-semibold text-[var(--color-text-primary)]">
          Official Response
        </span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-[var(--color-info)]">
          {response.author}
        </span>
        {response.isVerifiedAuthority && (
          <span className="inline-flex items-center gap-0.5 text-[0.6rem] text-[var(--color-success)]">
            <BadgeCheck size={12} />
            Verified Authority
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed italic">
        &ldquo;{response.text}&rdquo;
      </p>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--color-info)]/10">
        <span className="text-[0.65rem] text-[var(--color-text-muted)]">
          {formatDate(response.createdAt)}
        </span>
        <span className="text-[0.65rem] text-[var(--color-text-muted)] flex items-center gap-1">
          <Heart size={10} />
          {response.likes} likes
        </span>
      </div>
    </motion.div>
  );
}

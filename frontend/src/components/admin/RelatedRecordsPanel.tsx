"use client";

/**
 * RelatedRecordsPanel — Reusable traceability widget.
 * Shows all records related to a case: CMP, ESC, EV, BUD, RES.
 * Each ID is clickable. Status badges are colour-coded.
 * Use on: Complaint Detail, Escalation Detail, Evidence Detail, Budget Detail.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle, ShieldAlert, Camera, IndianRupee, CheckCircle2,
} from "lucide-react";

export interface RelatedRecord {
  id: string;
  type: "complaint" | "escalation" | "evidence" | "budget" | "resolution";
  label: string;
  status: string;
  href: string;
}

const TYPE_ICON: Record<RelatedRecord["type"], React.ReactNode> = {
  complaint:  <AlertTriangle size={12} />,
  escalation: <ShieldAlert size={12} />,
  evidence:   <Camera size={12} />,
  budget:     <IndianRupee size={12} />,
  resolution: <CheckCircle2 size={12} />,
};

const TYPE_COLOR: Record<RelatedRecord["type"], string> = {
  complaint:  "#f59e0b",
  escalation: "#f97316",
  evidence:   "#a78bfa",
  budget:     "#22d3ee",
  resolution: "#10b981",
};

function statusBadgeStyle(status: string) {
  const s = status.toLowerCase();
  if (s.includes("approved") || s.includes("resolved") || s.includes("closed")) return { bg: "rgba(16,185,129,0.12)", color: "#10b981" };
  if (s.includes("pending") || s.includes("open") || s.includes("submitted")) return { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" };
  if (s.includes("rejected") || s.includes("breached")) return { bg: "rgba(239,68,68,0.12)", color: "#ef4444" };
  if (s.includes("investigat") || s.includes("progress") || s.includes("assigned")) return { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" };
  if (s.includes("clarification") || s.includes("review")) return { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" };
  return { bg: "rgba(100,116,139,0.12)", color: "#64748b" };
}

interface RelatedRecordsPanelProps {
  records: RelatedRecord[];
  title?: string;
}

export function RelatedRecordsPanel({ records, title = "Related Records" }: RelatedRecordsPanelProps) {
  // Prevent hydration mismatch — store data differs between server (seed) and client (localStorage)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  if (records.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{title}</h4>
      {records.map((r, i) => {
        const badge = statusBadgeStyle(r.status);
        const color = TYPE_COLOR[r.type];
        return (
          <motion.div key={r.id}
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}>
            <Link href={r.href}
              className="flex items-center gap-2 rounded-lg border px-2.5 py-2 hover:bg-[var(--color-surface)] transition-colors"
              style={{ borderColor: "var(--color-border)" }}>
              <span style={{ color }}>{TYPE_ICON[r.type]}</span>
              <span className="font-mono text-[10px] font-bold shrink-0" style={{ color }}>{r.id}</span>
              <span className="text-[10px] text-[var(--color-text-secondary)] truncate flex-1">{r.label}</span>
              <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0"
                style={{ background: badge.bg, color: badge.color }}>
                {r.status}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

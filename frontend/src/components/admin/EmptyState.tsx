"use client";

import { motion } from "framer-motion";
import { Inbox, FileSearch, ShieldAlert, Camera, IndianRupee, Landmark, Bell, FileText, ClipboardList } from "lucide-react";

type EmptyStateVariant =
  | "complaints"
  | "escalations"
  | "evidence"
  | "budgets"
  | "governance"
  | "notifications"
  | "reports"
  | "tickets"
  | "generic";

const VARIANT_CONFIG: Record<EmptyStateVariant, { icon: typeof Inbox; title: string; description: string; color: string }> = {
  complaints: {
    icon: FileSearch,
    title: "No complaints found",
    description: "No complaints match your current filters. Try adjusting your search or filter criteria.",
    color: "#14b8a6",
  },
  escalations: {
    icon: ShieldAlert,
    title: "No escalations",
    description: "There are no escalations matching your criteria. All cases are resolved or filtered out.",
    color: "#f97316",
  },
  evidence: {
    icon: Camera,
    title: "No evidence records",
    description: "No evidence submissions found. Evidence will appear here when uploaded by officers.",
    color: "#8b5cf6",
  },
  budgets: {
    icon: IndianRupee,
    title: "No budget requests",
    description: "No budget requests match the current filters. New requests will appear here once submitted.",
    color: "#f59e0b",
  },
  governance: {
    icon: Landmark,
    title: "No governance requests",
    description: "No governance requests found. Requests will appear here once submitted by districts.",
    color: "#3b82f6",
  },
  notifications: {
    icon: Bell,
    title: "No notifications",
    description: "You're all caught up! New notifications will appear here as actions occur.",
    color: "#22c55e",
  },
  reports: {
    icon: FileText,
    title: "No reports available",
    description: "Reports will be generated from system activity. Ensure data exists before exporting.",
    color: "#06b6d4",
  },
  tickets: {
    icon: ClipboardList,
    title: "No tickets found",
    description: "No work tickets match your current filters. Create a new ticket from the complaints page.",
    color: "#f59e0b",
  },
  generic: {
    icon: Inbox,
    title: "No data available",
    description: "There's nothing to show here yet. Data will appear as system activity occurs.",
    color: "#64748b",
  },
};

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyState({ variant = "generic", title, description, className = "" }: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;
  const displayTitle = title ?? config.title;
  const displayDesc = description ?? config.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: `${config.color}12`, color: config.color }}
      >
        <Icon size={24} />
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{displayTitle}</h3>
      <p className="text-xs text-[var(--color-text-muted)] max-w-[280px] leading-relaxed">{displayDesc}</p>
    </motion.div>
  );
}

"use client";

import { useState, useMemo, Suspense, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  MapPin, Search, X, AlertTriangle, CheckCircle2,
  ChevronUp, ChevronDown, Filter,
  Navigation, Shield, Flame, Droplets, Zap, Construction,
  Activity, Eye, ThumbsUp, ThumbsDown, MapPinned,
} from "lucide-react";
import { useComplaintStore, type ComplaintRecord } from "@/store/complaintStore";
import { MapLoadingSkeleton } from "@/components/map/map-loading-skeleton";

// Lazy load the map — SSR disabled
const IndiaMap = dynamic(() => import("@/components/map/IndiaMap"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type HazardFilter = "all" | "active" | "resolved";
type CategoryFilter = "" | "Road Damage" | "Sanitation" | "Infrastructure" | "Flooding" | "Utilities" | "Safety" | "Drainage" | "Garbage";
type DistanceFilter = "all" | "2km" | "5km" | "10km";

interface HazardItem {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  location: string;
  coordinates: string;
  date: string;
  isActive: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, typeof AlertTriangle> = {
  "Road Damage": Construction,
  Sanitation: Droplets,
  Infrastructure: Shield,
  Flooding: Droplets,
  Utilities: Zap,
  Safety: Flame,
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#f59e0b",
  Low: "#22c55e",
};

function complaintToHazard(c: ComplaintRecord): HazardItem {
  return {
    id: c.id,
    title: c.title,
    category: c.category,
    priority: c.priority,
    status: c.status,
    location: c.location,
    coordinates: c.coordinates,
    date: c.createdDate,
    isActive: c.status !== "Resolved" && c.status !== "Rejected",
  };
}

// Mock distance from user (seeded per hazard for consistency)
function mockDistance(id: string): number {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return parseFloat((0.3 + (hash % 50) * 0.08).toFixed(1));
}

// Safety score formula
function computeSafetyScore(complaints: ComplaintRecord[]): number {
  const active = complaints.filter((c) => c.status !== "Resolved" && c.status !== "Rejected");
  const critical = active.filter((c) => c.priority === "Critical").length;
  const high = active.filter((c) => c.priority === "High").length;
  const medium = active.filter((c) => c.priority === "Medium").length;
  const score = 100 - (critical * 10) - (high * 5) - (medium * 2);
  return Math.max(0, Math.min(100, score));
}

function safetyBadge(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Safe", color: "#22c55e" };
  if (score >= 60) return { label: "Moderate", color: "#f59e0b" };
  if (score >= 40) return { label: "Watchlist", color: "#f97316" };
  return { label: "Risky", color: "#ef4444" };
}

// Safety insights derived from store data
function computeInsights(complaints: ComplaintRecord[]): string[] {
  const insights: string[] = [];
  const active = complaints.filter((c) => c.status !== "Resolved" && c.status !== "Rejected");
  const resolved = complaints.filter((c) => c.status === "Resolved");

  // Most common category
  const catCount = new Map<string, number>();
  for (const c of active) { catCount.set(c.category, (catCount.get(c.category) ?? 0) + 1); }
  const topCat = [...catCount.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCat && topCat[1] > 1) {
    insights.push(`⚠️ ${topCat[0]} reported frequently (${topCat[1]} active)`);
  }

  // Hotspot zone
  const locCount = new Map<string, number>();
  for (const c of active) { locCount.set(c.location, (locCount.get(c.location) ?? 0) + 1); }
  const topLoc = [...locCount.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topLoc && topLoc[1] > 1) {
    insights.push(`⚠️ ${topLoc[0]} has highest active hazards`);
  }

  if (resolved.length > 0) {
    insights.push(`✅ ${resolved.length} hazards resolved recently`);
  }

  const critical = active.filter((c) => c.priority === "Critical").length;
  if (critical > 0) {
    insights.push(`🔴 ${critical} critical hazard${critical > 1 ? "s" : ""} need immediate attention`);
  }

  return insights.slice(0, 4);
}

// Google Maps direction link for route avoidance
function getGoogleMapsLink(coords: string): string {
  // Parse "18.9894° N, 73.1175° E" format
  const match = coords.match(/([\d.]+)°?\s*[NS],?\s*([\d.]+)°?\s*[EW]/);
  if (match) return `https://www.google.com/maps/dir/?api=1&destination=${match[1]},${match[2]}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;
}

// Distance filter thresholds
const DISTANCE_CHIPS: { label: string; value: DistanceFilter }[] = [
  { label: "All", value: "all" },
  { label: "< 2 km", value: "2km" },
  { label: "< 5 km", value: "5km" },
  { label: "< 10 km", value: "10km" },
];

// ─── Filter Chips ─────────────────────────────────────────────────────────────

const STATUS_CHIPS: { label: string; value: HazardFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Resolved", value: "resolved" },
];

const CATEGORY_CHIPS: { label: string; value: CategoryFilter; icon: typeof AlertTriangle }[] = [
  { label: "All Types", value: "", icon: Filter },
  { label: "Road Damage", value: "Road Damage", icon: Construction },
  { label: "Waterlogging", value: "Flooding", icon: Droplets },
  { label: "Sanitation", value: "Sanitation", icon: Droplets },
  { label: "Accident Zone", value: "Safety", icon: Flame },
  { label: "Streetlight", value: "Utilities", icon: Zap },
  { label: "Infrastructure", value: "Infrastructure", icon: Shield },
  { label: "Drainage", value: "Drainage", icon: Droplets },
  { label: "Garbage", value: "Garbage", icon: AlertTriangle },
];

// ─── Hazard Card ──────────────────────────────────────────────────────────────

function HazardCard({ hazard, onSelect, verifications, onVerify }: {
  hazard: HazardItem;
  onSelect: (h: HazardItem) => void;
  verifications: Map<string, number>;
  onVerify: (id: string, type: "confirm" | "cleared") => void;
}) {
  const Icon = CATEGORY_ICONS[hazard.category] ?? AlertTriangle;
  const priorityColor = PRIORITY_COLORS[hazard.priority] ?? "#64748b";
  const distance = mockDistance(hazard.id);
  const vCount = verifications.get(hazard.id) ?? Math.floor(mockDistance(hazard.id) * 3 + 5);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(hazard)}
      className="w-full flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all active:scale-[0.98]"
      style={{
        borderColor: hazard.isActive ? `${priorityColor}30` : "var(--color-border)",
        background: hazard.isActive ? `${priorityColor}05` : "var(--color-surface)",
      }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${priorityColor}15`, color: priorityColor }}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-1">{hazard.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-[11px] text-[var(--color-text-muted)] truncate">{hazard.location}</p>
          <span className="text-[10px] text-blue-400 font-medium shrink-0">· {distance} km</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: `${priorityColor}15`, color: priorityColor }}>
            {hazard.priority}
          </span>
          <span className={`text-[10px] font-medium ${hazard.isActive ? "text-amber-400" : "text-emerald-400"}`}>
            {hazard.isActive ? "Active" : "Resolved"}
          </span>
          <span className="text-[9px] text-[var(--color-text-muted)] ml-auto flex items-center gap-0.5">
            <CheckCircle2 size={9} className="text-blue-400" /> {vCount} verified
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Hazard Detail Bottom Sheet (mobile) / Panel (desktop) ────────────────────

function HazardDetail({ hazard, onClose, verifications, onVerify, voted }: {
  hazard: HazardItem;
  onClose: () => void;
  verifications: Map<string, number>;
  onVerify: (id: string, type: "confirm" | "cleared") => void;
  voted: Set<string>;
}) {
  const Icon = CATEGORY_ICONS[hazard.category] ?? AlertTriangle;
  const priorityColor = PRIORITY_COLORS[hazard.priority] ?? "#64748b";
  const vCount = verifications.get(hazard.id) ?? Math.floor(mockDistance(hazard.id) * 3 + 5);
  const hasVoted = voted.has(hazard.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[80vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: `${priorityColor}15`, color: priorityColor }}>
              <Icon size={20} />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold" style={{ color: priorityColor }}>{hazard.id}</span>
              <p className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5 leading-snug">{hazard.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-muted)]">
            <X size={14} />
          </button>
        </div>

        {/* Details */}
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Category", value: hazard.category },
              { label: "Priority", value: hazard.priority },
              { label: "Status", value: hazard.status },
              { label: "Reported", value: hazard.date.split(",")[0] ?? hazard.date },
              { label: "Reports Count", value: "3" },
              { label: "Distance", value: `${mockDistance(hazard.id)} km` },
            ].map((f) => (
              <div key={f.label} className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                <p className="text-[10px] text-[var(--color-text-muted)]">{f.label}</p>
                <p className="text-xs font-medium text-[var(--color-text-primary)] mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            <p className="text-[10px] text-[var(--color-text-muted)]">Location</p>
            <p className="text-xs font-medium text-[var(--color-text-primary)] mt-0.5">{hazard.location}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-mono">{hazard.coordinates}</p>
          </div>

          {/* Crowd Verification */}
          <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: "rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.04)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                <CheckCircle2 size={11} className="inline text-blue-400 mr-1" />{vCount} Citizens Verified
              </span>
            </div>
            {hasVoted ? (
              <p className="text-[10px] text-emerald-400 font-medium">✓ Thank you for verifying!</p>
            ) : (
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); onVerify(hazard.id, "confirm"); }}
                  className="flex-1 h-8 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-medium border transition-all active:scale-95"
                  style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                  <ThumbsUp size={12} /> Confirm Hazard
                </button>
                <button onClick={(e) => { e.stopPropagation(); onVerify(hazard.id, "cleared"); }}
                  className="flex-1 h-8 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-medium border transition-all active:scale-95"
                  style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>
                  <ThumbsDown size={12} /> Hazard Cleared
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            {/* Route Avoidance — for Critical/High active hazards */}
            {hazard.isActive && (hazard.priority === "Critical" || hazard.priority === "High") && (
              <a href={getGoogleMapsLink(hazard.coordinates)} target="_blank" rel="noopener noreferrer">
                <motion.button whileTap={{ scale: 0.97 }}
                  className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-medium border"
                  style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>
                  <Navigation size={15} /> Open Safe Route
                </motion.button>
              </a>
            )}
            <Link href={`/dashboard/my-reports`}>
              <motion.button whileTap={{ scale: 0.97 }}
                className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-medium border"
                style={{ borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)", color: "#3b82f6" }}>
                <Eye size={15} /> View Details
              </motion.button>
            </Link>
            <Link href={`/dashboard/report`}>
              <motion.button whileTap={{ scale: 0.97 }}
                className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
                <AlertTriangle size={15} /> Report Similar
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SafetyMapPage() {
  const complaints = useComplaintStore((s) => s.complaints);
  const [statusFilter, setStatusFilter] = useState<HazardFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("");
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<HazardItem | null>(null);
  const [listExpanded, setListExpanded] = useState(true);
  const [verifications, setVerifications] = useState<Map<string, number>>(new Map());
  const [voted, setVoted] = useState<Set<string>>(new Set());

  const handleVerify = useCallback((id: string, type: "confirm" | "cleared") => {
    setVerifications((prev) => {
      const next = new Map(prev);
      const current = next.get(id) ?? Math.floor(mockDistance(id) * 3 + 5);
      next.set(id, type === "confirm" ? current + 1 : Math.max(0, current - 1));
      return next;
    });
    setVoted((prev) => new Set(prev).add(id));
  }, []);

  const hazards = useMemo(() => {
    let items = complaints.map(complaintToHazard);

    if (statusFilter === "active") items = items.filter((h) => h.isActive);
    else if (statusFilter === "resolved") items = items.filter((h) => !h.isActive);

    if (categoryFilter) items = items.filter((h) => h.category === categoryFilter);

    // Distance filter using mock distances
    if (distanceFilter !== "all") {
      const maxKm = distanceFilter === "2km" ? 2 : distanceFilter === "5km" ? 5 : 10;
      items = items.filter((h) => mockDistance(h.id) <= maxKm);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((h) =>
        h.title.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.id.toLowerCase().includes(q)
      );
    }

    return items.sort((a, b) => {
      const pOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      const pa = pOrder[a.priority] ?? 9;
      const pb = pOrder[b.priority] ?? 9;
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return pa - pb;
    });
  }, [complaints, statusFilter, categoryFilter, distanceFilter, search]);

  const activeCount = complaints.filter((c) => c.status !== "Resolved" && c.status !== "Rejected").length;
  const resolvedCount = complaints.filter((c) => c.status === "Resolved").length;

  return (
    <div className="flex flex-col h-full min-h-0 lg:flex-row lg:gap-0">
      {/* ── Mobile/Tablet: stacked layout | Desktop: side-by-side ── */}

      {/* Left Panel (mobile: top section, desktop: sidebar 35%) */}
      <div className="flex flex-col gap-3 p-4 pb-2 lg:w-[380px] lg:h-full lg:overflow-y-auto lg:border-r lg:border-[var(--color-border)] lg:p-5 shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-[var(--color-info)]" />
            <h1 className="text-base font-bold text-[var(--color-text-primary)]">Safety Map</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--color-danger) 12%, transparent)", color: "var(--color-danger)" }}>{activeCount} active</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--color-success) 12%, transparent)", color: "var(--color-success)" }}>{resolvedCount} resolved</span>
          </div>
        </div>

        {/* Local Safety Overview */}
        {(() => {
          const score = computeSafetyScore(complaints);
          const badge = safetyBadge(score);
          const critical = complaints.filter((c) => c.priority === "Critical" && c.status !== "Resolved" && c.status !== "Rejected").length;
          const circumference = 2 * Math.PI * 24;
          const offset = circumference - (score / 100) * circumference;
          return (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Your Area</p>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Panvel, Maharashtra</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="relative w-10 h-10">
                    <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="var(--color-border)" strokeWidth="4" />
                      <circle cx="28" cy="28" r="24" fill="none" stroke="var(--color-info)" strokeWidth="4"
                        strokeDasharray={`${circumference}`} strokeDashoffset={offset} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold tabular-nums text-[var(--color-text-primary)]">{score}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: `color-mix(in srgb, ${badge.color} 12%, transparent)`, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Active", value: activeCount, color: "var(--color-danger)" },
                  { label: "Resolved", value: resolvedCount, color: "var(--color-success)" },
                  { label: "Critical", value: critical, color: "var(--color-danger)" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg px-2 py-1.5 text-center bg-[var(--color-card)]">
                    <p className="text-xs font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[9px] text-[var(--color-text-muted)]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Near Me distance filter */}
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {DISTANCE_CHIPS.map((chip) => (
            <button key={chip.value} onClick={() => setDistanceFilter(chip.value)}
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-medium whitespace-nowrap shrink-0 transition-all"
              style={{
                background: distanceFilter === chip.value ? "color-mix(in srgb, var(--color-info) 12%, transparent)" : "var(--color-surface)",
                color: distanceFilter === chip.value ? "var(--color-info)" : "var(--color-text-muted)",
                border: `1px solid ${distanceFilter === chip.value ? "color-mix(in srgb, var(--color-info) 30%, transparent)" : "var(--color-border)"}`,
              }}>
              <MapPinned size={10} />
              {chip.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hazards by location or ID…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border text-sm bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Status filter chips */}
        <div className="flex gap-2">
          {STATUS_CHIPS.map((chip) => (
            <button key={chip.value} onClick={() => setStatusFilter(chip.value)}
              className="h-8 px-3 rounded-lg text-xs font-medium transition-all"
              style={{
                background: statusFilter === chip.value ? "color-mix(in srgb, var(--color-info) 12%, transparent)" : "var(--color-surface)",
                color: statusFilter === chip.value ? "var(--color-info)" : "var(--color-text-muted)",
                border: `1px solid ${statusFilter === chip.value ? "color-mix(in srgb, var(--color-info) 30%, transparent)" : "var(--color-border)"}`,
              }}>
              {chip.label}
            </button>
          ))}
        </div>

        {/* Category filter chips — horizontal scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
          {CATEGORY_CHIPS.map((chip) => {
            const Icon = chip.icon;
            return (
              <button key={chip.value} onClick={() => setCategoryFilter(chip.value)}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 transition-all"
                style={{
                  background: categoryFilter === chip.value ? "color-mix(in srgb, var(--color-info) 12%, transparent)" : "var(--color-surface)",
                  color: categoryFilter === chip.value ? "var(--color-info)" : "var(--color-text-muted)",
                  border: `1px solid ${categoryFilter === chip.value ? "color-mix(in srgb, var(--color-info) 30%, transparent)" : "var(--color-border)"}`,
                }}>
                <Icon size={12} />
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Hazards list — collapsible on mobile, always visible on desktop */}
        <div className="flex items-center justify-between lg:hidden">
          <span className="text-xs font-bold text-[var(--color-text-primary)]">Nearby Hazards</span>
          <button onClick={() => setListExpanded((p) => !p)} className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--color-info)" }}>
            {listExpanded ? <><ChevronDown size={12} /> Hide</> : <><ChevronUp size={12} /> Show</>}
          </button>
        </div>
        <div className="hidden lg:flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--color-text-primary)]">Nearby Hazards</span>
          <span className="text-[10px] text-[var(--color-text-muted)]">{hazards.length} found</span>
        </div>

        <AnimatePresence>
          {(listExpanded || typeof window !== "undefined" && window.innerWidth >= 1024) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col gap-2 overflow-hidden lg:flex-1 lg:overflow-y-auto lg:min-h-0"
              style={{ maxHeight: "calc(100vh - 360px)" }}
            >
              {hazards.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <MapPin size={24} className="text-[var(--color-text-muted)] opacity-40 mb-2" />
                  <p className="text-sm text-[var(--color-text-muted)]">No hazards match your filters</p>
                </div>
              ) : (
                hazards.slice(0, 20).map((h) => (
                  <HazardCard key={h.id} hazard={h} onSelect={setSelected} verifications={verifications} onVerify={handleVerify} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Community Safety Updates */}
        {(() => {
          const insights = computeInsights(complaints);
          if (insights.length === 0) return null;
          return (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Activity size={13} className="text-[var(--color-info)]" />
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">Community Safety Updates</span>
              </div>
              <div className="flex flex-col gap-2">
                {insights.map((ins, i) => (
                  <p key={i} className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{ins}</p>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Report Hazard CTA */}
        <Link href="/dashboard/report" className="shrink-0">
          <motion.button whileTap={{ scale: 0.97 }}
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--color-amber, #F59E0B), #d97706)", boxShadow: "0 4px 16px color-mix(in srgb, var(--color-amber) 40%, transparent)" }}>
            <AlertTriangle size={16} /> Report a Hazard
          </motion.button>
        </Link>
      </div>

      {/* Map Area (mobile: 50-60vh, desktop: fills remaining space) */}
      <div className="flex-1 min-h-[50vh] lg:min-h-0 lg:h-full relative" style={{ isolation: "isolate" }}>
        <Suspense fallback={<MapLoadingSkeleton />}>
          <IndiaMap
            adminRole="sub_district_admin"
            height="100%"
            showBreadcrumb={false}
            showControls={false}
            showLegend={false}
            showSidebar={false}
            isDark
          />
        </Suspense>

        {/* Map overlay — active hazard count */}
        <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 rounded-lg border px-3 py-1.5 pointer-events-none"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)", opacity: 0.95 }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
          </span>
          <span className="text-[11px] font-medium text-[var(--color-text-primary)]">{activeCount} Active Hazards</span>
        </div>
      </div>

      {/* Detail bottom sheet */}
      <AnimatePresence>
        {selected && <HazardDetail hazard={selected} onClose={() => setSelected(null)} verifications={verifications} onVerify={handleVerify} voted={voted} />}
      </AnimatePresence>
    </div>
  );
}

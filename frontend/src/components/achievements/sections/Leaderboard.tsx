"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PodiumSection, RankedList } from "@/components/leaderboard";
import { LEADERBOARD } from "../mockData";
import type { LeaderboardScope } from "../types";
import type { AnyEntry } from "@/types/leaderboard";

const TABS: { key: LeaderboardScope; label: string }[] = [
  { key: "sub-district", label: "Sub-Dist" },
  { key: "district",     label: "District" },
  { key: "state",        label: "State"    },
  { key: "national",     label: "National" },
];

function enrichLeaderboardEntry(entry: {
  rank: number;
  name: string;
  points: number;
  reports: number;
  reputation: number;
  isCurrentUser: boolean;
  avatarColor: string;
  avatarUrl?: string;
  initial: string;
}): AnyEntry {
  const district = entry.rank <= 5 ? "Mumbai" : entry.rank <= 10 ? "Pune" : "Nashik";
  const subDistrict = entry.rank <= 5 ? "Andheri" : entry.rank <= 10 ? "Bandra" : "Dadar";

  return {
    rank: entry.rank,
    prevRank: Math.max(1, entry.rank + (entry.rank % 2 === 0 ? -1 : 1)),
    name: entry.name,
    points: entry.points,
    pointsDeltaWeek: Math.max(40, Math.round(entry.points * 0.035)),
    reports: entry.reports,
    verified: Math.max(6, Math.round(entry.reports * 0.72)),
    reputation: entry.reputation,
    isCurrentUser: entry.isCurrentUser,
    avatarColor: entry.avatarColor,
    avatarUrl: entry.avatarUrl,
    initial: entry.initial,
    isVerifiedUser: entry.reputation >= 90,
    district,
    subDistrict,
    badges: entry.rank <= 3 ? ["Road Guardian", "Evidence Expert"] : ["Quick Reporter", "Hazard Hunter"],
    totalReports: entry.reports,
    validationCount: Math.max(5, Math.round(entry.reports * 0.72)),
    resolvedCount: Math.max(2, Math.round(entry.reports * 0.35)),
    streak: 4 + (entry.rank % 7),
    impactScore: Math.min(100, entry.reputation + 4),
    livesImpacted: entry.reports * 11,
    roadsImproved: Math.max(1, Math.round(entry.reports * 0.18)),
    authoritiesNotified: Math.max(1, Math.round(entry.reports * 0.55)),
    highRiskReports: Math.max(1, Math.round(entry.reports * 0.12)),
    rejections: Math.max(0, Math.round(entry.reports * 0.05)),
    authorityActionsTriggered: Math.max(1, Math.round(entry.reports * 0.1)),
    recentAchievements: [
      { name: "Top Contributor", timeAgo: "2 days ago", icon: "award" },
      { name: "Evidence Expert", timeAgo: "5 days ago", icon: "camera" },
      { name: "Streak Master", timeAgo: "1 week ago", icon: "flame" },
    ],
  };
}

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardScope>("district");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [highlightUserId, setHighlightUserId] = useState<string | null>(null);
  const router = useRouter();

  const leaderboard: AnyEntry[] = LEADERBOARD.map(enrichLeaderboardEntry);
  const top3 = leaderboard.slice(0, 3);
  const listData = leaderboard.slice(3, 10);

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleHighlightMe = () => {
    setHighlightUserId("Rahul Mehta");
    window.dispatchEvent(new Event("leaderboard:highlightMe"));
    window.setTimeout(() => setHighlightUserId(null), 2400);
  };

  return (
    <div className="neu-card p-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between mb-3.5">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Leaderboard</h3>
          <p className="text-[11px] text-[#64748B]">Leaderboard preview for achievements.</p>
        </div>

        <div
          className="flex items-center gap-0.5 p-0.5 rounded-full max-w-full overflow-x-auto scrollbar-none"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="relative px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all duration-200 whitespace-nowrap"
                style={{
                  color: active ? "#fff" : "var(--color-text-muted)",
                  background: active ? "var(--color-teal, #14b8a6)" : "transparent",
                  boxShadow: active ? "0 0 8px color-mix(in srgb, #14b8a6 40%, transparent)" : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <PodiumSection
          topThree={top3}
          totalCount={leaderboard.length}
          visibleCount={listData.length + 3}
          onSelect={() => undefined}
          onHighlightMe={handleHighlightMe}
          showHighlightMe={true}
        />

        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Top Contributors</p>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Preview leaderboard</p>
              </div>
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">{listData.length} entries</span>
            </div>
          </div>

          <div className="px-2 pb-4">
            <RankedList
              entries={listData}
              view="citizen"
              totalCount={leaderboard.length}
              hasMore={false}
              onLoadMore={() => undefined}
              onSelect={() => undefined}
              expandedId={expandedId}
              onToggleExpand={handleToggleExpand}
              highlightUserId={highlightUserId}
            />
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard/leaderboard")}
          className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors duration-200"
          style={{
            color: "var(--color-teal, #14b8a6)",
            border: "1px solid color-mix(in srgb, var(--color-teal, #14b8a6) 25%, transparent)",
            background: "color-mix(in srgb, var(--color-teal, #14b8a6) 5%, transparent)",
          }}
          aria-label="View full leaderboard"
        >
          View full leaderboard
          <ArrowRight size={13} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

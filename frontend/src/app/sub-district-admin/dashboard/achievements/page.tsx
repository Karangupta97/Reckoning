"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy, Star, Flame, Zap, BadgeCheck, Lock,
  CheckCircle2, ShieldCheck, Camera,
  Award, Gift, Clock, BarChart3, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  useAchievementStore,
  SUBDISTRICT_RANKS,
  getRankForXP,
  type AdminBadge,
} from "@/store/achievementStore";
import { useLeaderboardStore } from "@/store/leaderboardStore";
import { useIsClient } from "@/hooks/useIsClient";
import { RankProgressTrack, AchievementTimeline } from "@/components/admin-achievements/AdminAchievementShared";

// ─── Animation helpers ────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.07, ease: [0.4,0,0.2,1] as [number,number,number,number] } }),
};

const RARITY_COLOR: Record<string, string> = {
  common:    "#22C55E",
  rare:      "#3B82F6",
  epic:      "#8B5CF6",
  legendary: "#F59E0B",
};

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <span className="text-[10px] text-[var(--color-text-muted)]">{label}</span>
    </div>
  );
}

function BadgeCard({ badge, index }: { badge: AdminBadge; index: number }) {
  const color = RARITY_COLOR[badge.rarity];
  const pct = badge.progress !== undefined && badge.total ? Math.min(100, Math.round((badge.progress / badge.total) * 100)) : 100;
  const IconMap: Record<string, React.ReactNode> = {
    "check-circle": <CheckCircle2 size={18}/>, "shield-check": <ShieldCheck size={18}/>,
    trophy: <Trophy size={18}/>, camera: <Camera size={18}/>, flame: <Flame size={18}/>,
    award: <Award size={18}/>, shield: <ShieldCheck size={18}/>, zap: <Zap size={18}/>,
    star: <Star size={18}/>,
  };
  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible"
      className="relative flex flex-col items-center text-center rounded-xl px-2 py-3 transition-all hover:scale-[1.03]"
      style={{
        background: badge.unlocked ? `${color}0d` : "var(--color-surface)",
        border: `1px solid ${badge.unlocked ? `${color}30` : "var(--color-border)"}`,
        opacity: badge.unlocked ? 1 : 0.6,
      }}>
      {badge.unlocked && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
      )}
      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1.5"
        style={{ background: badge.unlocked ? `${color}18` : "var(--color-border)", color: badge.unlocked ? color : "var(--color-text-muted)" }}>
        {badge.unlocked ? (IconMap[badge.icon] ?? <Award size={18}/>) : <Lock size={14}/>}
      </div>
      <span className="text-[10px] font-semibold leading-tight line-clamp-2"
        style={{ color: badge.unlocked ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
        {badge.name}
      </span>
      <span className="mt-0.5 text-[9px] font-medium" style={{ color: badge.unlocked ? color : "var(--color-text-muted)" }}>
        {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
      </span>
      {!badge.unlocked && badge.progress !== undefined && badge.total && (
        <div className="w-full mt-1.5">
          <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
          </div>
          <span className="text-[8px] text-[var(--color-text-muted)]">{pct}%</span>
        </div>
      )}
    </motion.div>
  );
}

const SCORING_RULES = [
  { action: "Complaint Resolved",         xp: 50,   color: "#22C55E" },
  { action: "Ticket Completed",           xp: 40,   color: "#F59E0B" },
  { action: "Evidence Submitted",         xp: 25,   color: "#3B82F6" },
  { action: "SLA Maintained",             xp: 35,   color: "#14b8a6" },
  { action: "Escalation Handled",         xp: 60,   color: "#8B5CF6" },
  { action: "Resolution Approved",        xp: 45,   color: "#F97316" },
  { action: "Field Inspection",           xp: 20,   color: "#06B6D4" },
  { action: "Daily Streak",               xp: 10,   color: "#22C55E" },
  { action: "Weekly Streak Bonus",        xp: 100,  color: "#F59E0B" },
  { action: "Monthly Streak Bonus",       xp: 500,  color: "#8B5CF6" },
];

export default function SubDistrictAchievementsPage() {
  const { subDistrict } = useAchievementStore();
  const { subDistrictOfficers } = useLeaderboardStore();
  const isClient = useIsClient();
  const [chartPeriod, setChartPeriod] = useState<"month" | "year">("month");

  const profile   = subDistrict;
  const ranks     = SUBDISTRICT_RANKS;
  const rank      = getRankForXP(profile.totalXP, ranks);
  const nextRank  = ranks.find(r => r.level === rank.level + 1);
  const nextXP    = nextRank?.minXP ?? rank.minXP + 5000;
  const bandStart = rank.minXP;
  const bandSize  = nextXP - bandStart;
  const bandProgress = profile.totalXP - bandStart;
  const xpPct     = Math.min(100, Math.round((bandProgress / bandSize) * 100));
  const xpToNext  = nextXP - profile.totalXP;

  const top3 = subDistrictOfficers.slice(0, 3);

  const ACCENT = "#f59e0b"; // amber — SDA theme

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* ── Hero Header ─────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <DashboardCard className="p-6 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${ACCENT}0d 0%, var(--color-card) 60%)`, borderColor: `${ACCENT}25` }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-[0.06]"
            style={{ background: ACCENT, filter: "blur(40px)" }} />
          <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl font-black border-2"
                style={{ borderColor: rank.color, background: `${rank.color}18`, color: rank.color }}>
                {profile.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{profile.name}</h2>
                  <BadgeCheck size={16} className="text-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 w-fit"
                  style={{ background: `${rank.color}18`, color: rank.color, border: `1px solid ${rank.color}30` }}>
                  <Trophy size={11} />
                  {rank.title}
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{profile.designation} · {profile.employeeId}</p>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-end justify-between gap-3 mb-2.5 flex-wrap">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-[var(--color-text-primary)]">{profile.totalXP.toLocaleString()}</span>
                    <span className="text-sm font-semibold" style={{ color: ACCENT }}>XP</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">Total Earned</p>
                </div>
                {nextRank && (
                  <div className="text-right">
                    <p className="text-xs text-[var(--color-text-muted)]">Next Rank</p>
                    <span className="text-sm font-semibold" style={{ color: nextRank.color }}>{nextRank.title}</span>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">{xpToNext.toLocaleString()} XP to go</p>
                  </div>
                )}
              </div>
              <div className="relative w-full h-3 rounded-full overflow-hidden border border-[var(--color-border)]" style={{ background: "var(--color-surface)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 1.2, ease: [0.4,0,0.2,1] as [number,number,number,number], delay: 0.3 }}
                  className="h-full rounded-full relative"
                  style={{ background: `linear-gradient(90deg, ${ACCENT}, #f97316)`, boxShadow: `0 0 10px ${ACCENT}50` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </motion.div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-[var(--color-text-muted)]">{bandStart.toLocaleString()} XP</span>
                <span className="text-[10px] font-medium" style={{ color: ACCENT }}>{xpPct}% complete</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">{nextXP.toLocaleString()} XP</span>
              </div>
            </div>
          </div>
        </DashboardCard>
      </motion.div>

      {/* ── Stats Row ────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { id: "points", label: "Total Points",       value: profile.totalPoints.toLocaleString(), color: "#F59E0B", sub: `+${profile.monthlyContribution.at(-1)?.resolved ?? 0} this month`, subColor: "#22C55E", icon: <Trophy size={18}/> },
          { id: "rep",    label: "Reputation Score",   value: `${profile.reputationScore}/100`,       color: "#22C55E", sub: "Excellent",  subColor: "#22C55E", icon: <Star size={18}/> },
          { id: "streak", label: "Contribution Streak",value: `${profile.streak} Days`,               color: "#F97316", sub: "Personal best!", subColor: "#F97316", icon: <Flame size={18}/> },
          { id: "rank",   label: "Zone Rank",          value: `#${profile.rankPosition}`,             color: "#3B82F6", sub: "Zone-wide",  subColor: "#3B82F6", icon: <BarChart3 size={18}/> },
        ].map((s, i) => (
          <motion.div key={s.id} custom={i} variants={fadeUp} initial="hidden" animate="visible">
            <DashboardCard className="p-4 flex flex-col gap-2 hover:scale-[1.02] transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18`, color: s.color }}>
                  {s.icon}
                </div>
                <span className="text-[10px] text-[var(--color-text-muted)] font-medium">{s.label}</span>
              </div>
              <span className="text-2xl font-bold text-[var(--color-text-primary)]">{s.value}</span>
              <span className="text-xs font-medium" style={{ color: s.subColor }}>{s.sub}</span>
            </DashboardCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Rank Progress Track ──────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <DashboardCard className="p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-5">Rank Progress</h3>
          <RankProgressTrack ranks={ranks} currentRank={rank} accentColor={ACCENT} />
        </DashboardCard>
      </motion.div>

      {/* ── Main two-column layout ───────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Left (2/3) */}
        <div className="flex flex-col gap-5 lg:col-span-2">

          {/* Badges */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <DashboardCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Badge Collection</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.25)" }}>
                  {profile.badges.filter(b => b.unlocked).length}/{profile.badges.length} unlocked
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {profile.badges.map((b, i) => <BadgeCard key={b.id} badge={b} index={i} />)}
              </div>
            </DashboardCard>
          </motion.div>

          {/* Contribution Analytics */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <DashboardCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Contribution Analytics</h3>
                <select value={chartPeriod} onChange={e => setChartPeriod(e.target.value as "month" | "year")}
                  className="text-xs px-2 py-1 rounded-md border bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none">
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <LegendDot color={ACCENT}    label="Resolved"    />
                <LegendDot color="#F97316"   label="Escalations" />
                <LegendDot color="#3B82F6"   label="Evidence"    />
              </div>
              <div className="w-full h-44 sm:h-52">
                {isClient && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={profile.monthlyContribution} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        {[[`sda-amber`,ACCENT],[`sda-orange`,"#F97316"],[`sda-blue`,"#3B82F6"]].map(([id,c]) => (
                          <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={c} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={c} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} vertical={false}/>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}/>
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}/>
                      <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "12px" }} labelStyle={{ color: "var(--color-text-primary)", fontWeight: 600 }}/>
                      <Area type="monotone" dataKey="resolved"    stroke={ACCENT}    strokeWidth={2} fill={`url(#grad-sda-amber)`}  dot={false} activeDot={{ r: 4 }}/>
                      <Area type="monotone" dataKey="escalations" stroke="#F97316"   strokeWidth={2} fill={`url(#grad-sda-orange)`} dot={false} activeDot={{ r: 4 }}/>
                      <Area type="monotone" dataKey="evidence"    stroke="#3B82F6"   strokeWidth={2} fill={`url(#grad-sda-blue)`}   dot={false} activeDot={{ r: 4 }}/>
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </DashboardCard>
          </motion.div>

          {/* Impact Summary */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <DashboardCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Your Impact</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.impactStats.map((stat, i) => {
                  const COLORS = ["#F59E0B","#22C55E","#3B82F6","#8B5CF6","#F97316","#14b8a6"];
                  const c = COLORS[i % COLORS.length];
                  const IconMap: Record<string, React.ReactNode> = {
                    "check-circle": <CheckCircle2 size={17}/>, shield: <ShieldCheck size={17}/>,
                    camera: <Camera size={17}/>, "shield-check": <ShieldCheck size={17}/>,
                    trophy: <Trophy size={17}/>, zap: <Zap size={17}/>,
                  };
                  return (
                    <motion.div key={stat.label} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-amber-400/30 transition-colors">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${c}14`, color: c }}>
                        {IconMap[stat.icon] ?? <Award size={17}/>}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-base font-bold text-[var(--color-text-primary)] tabular-nums">{stat.value}</span>
                        <span className="block text-[10px] text-[var(--color-text-muted)] leading-tight">{stat.label}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </DashboardCard>
          </motion.div>

          {/* XP Scoring rules */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <DashboardCard className="p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">How XP is Earned</h3>
              <div className="flex flex-col divide-y divide-[var(--color-border)]">
                {SCORING_RULES.map(r => (
                  <div key={r.action} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                    <span className="text-xs text-[var(--color-text-secondary)]">{r.action}</span>
                    <span className="text-xs font-bold tabular-nums font-mono" style={{ color: r.color }}>+{r.xp} XP</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </motion.div>
        </div>

        {/* Right (1/3) */}
        <div className="flex flex-col gap-5">

          {/* Monthly Challenges */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <DashboardCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Monthly Challenges</h3>
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium"><Clock size={11}/> Active</span>
              </div>
              <div className="flex flex-col gap-3">
                {profile.challenges.map(ch => {
                  const pct = Math.min(100, Math.round((ch.progress / ch.total) * 100));
                  const done = ch.progress >= ch.total;
                  return (
                    <div key={ch.id} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-amber-400/30 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <span className="text-xs font-medium text-[var(--color-text-primary)] leading-tight">{ch.title}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap tabular-nums flex-shrink-0">{ch.progress}/{ch.total}</span>
                      </div>
                      <div className="relative w-full h-1.5 rounded-full overflow-hidden bg-[var(--color-border)]">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: [0.4,0,0.2,1] as [number,number,number,number], delay: 0.2 }}
                          className="h-full rounded-full"
                          style={{ background: done ? "#22C55E" : `linear-gradient(90deg, ${ACCENT}, #F97316)` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-[var(--color-text-muted)]">{pct}% complete</span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                          <Gift size={11}/> {ch.reward} {ch.rewardType.toUpperCase()}
                        </span>
                      </div>
                      {ch.endsAt !== "Ongoing" && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--color-text-muted)]">
                          <Clock size={9}/> Ends in {ch.endsAt}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </DashboardCard>
          </motion.div>

          {/* Achievement Timeline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <DashboardCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Achievements</h3>
                <button className="text-xs text-amber-400 hover:underline">View all</button>
              </div>
              <AchievementTimeline events={profile.timeline} accentColor={ACCENT} />
            </DashboardCard>
          </motion.div>

          {/* Leaderboard Preview */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <DashboardCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Zone Leaderboard</h3>
                <a href="/sub-district-admin/dashboard/leaderboard"
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1">
                  Full Board <ChevronRight size={11}/>
                </a>
              </div>
              <div className="flex flex-col gap-1.5">
                {top3.map((e, i) => (
                  <div key={e.rank} className="flex items-center gap-2.5 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <span className="text-sm font-black w-5 text-center text-[var(--color-text-muted)]">
                      {["🥇","🥈","🥉"][i]}
                    </span>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ background: e.avatarColor }}>
                      {e.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{e.name}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">{e.ticketsCompleted} tickets</p>
                    </div>
                    <span className="text-xs font-black font-mono text-amber-400">{e.points.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </motion.div>

          {/* Motivation banner */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <div className="relative overflow-hidden rounded-2xl p-5"
              style={{ background: "linear-gradient(135deg, #b45309 0%, #d97706 40%, #f59e0b 100%)", boxShadow: "0 8px 24px rgba(245,158,11,0.25)" }}>
              <div className="absolute inset-0 pointer-events-none opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white blur-3xl" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center border border-white/20">
                    <Flame size={20} className="text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white">On Fire! 🔥</h3>
                </div>
                <p className="text-sm text-white/90">
                  {profile.streak}-day streak and{" "}
                  <span className="font-bold text-white">#{profile.rankPosition} in the zone</span>
                  {" "}— keep the momentum going!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

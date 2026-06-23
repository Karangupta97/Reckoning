"use client";

import { motion } from "framer-motion";
import { HeroSection } from "./sections/HeroSection";
import { StatsGrid } from "./sections/StatsGrid";
import { RankProgress } from "./sections/RankProgress";
import { PointsBreakdown } from "./sections/PointsBreakdown";
import { BadgesCollection } from "./sections/BadgesCollection";
import { MonthlyChallenges } from "./sections/MonthlyChallenges";
import { Leaderboard } from "./sections/Leaderboard";
import { AchievementTimeline } from "./sections/AchievementTimeline";
import { ImpactSection } from "./sections/ImpactSection";
import { ContributionAnalytics } from "./sections/ContributionAnalytics";
import { MotivationBanner } from "./sections/MotivationBanner";

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
};

export function AchievementsPage() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      {/* Hero Section */}
      <motion.div variants={fadeUp}>
        <HeroSection />
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeUp}>
        <StatsGrid />
      </motion.div>

      {/* Rank Progress + Points Breakdown */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <RankProgress />
        <PointsBreakdown />
      </motion.div>

      {/* Badges + Monthly Challenges */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <BadgesCollection />
        </div>
        <div className="lg:col-span-2">
          <MonthlyChallenges />
        </div>
      </motion.div>

      {/* Leaderboard + Recent Achievements */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Leaderboard />
        </div>
        <div className="lg:col-span-2">
          <AchievementTimeline />
        </div>
      </motion.div>

      {/* Impact + Contribution Analytics */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImpactSection />
        <ContributionAnalytics />
      </motion.div>

      {/* Motivation Banner */}
      <motion.div variants={fadeUp}>
        <MotivationBanner />
      </motion.div>
    </motion.div>
  );
}

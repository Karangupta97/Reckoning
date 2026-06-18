"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { HeroSection } from "@/components/dashboard/HeroSection";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { MyReports } from "@/components/dashboard/MyReports";
import { NearbyHazards } from "@/components/dashboard/NearbyHazards";
import { SafetyMapPreview } from "@/components/dashboard/SafetyMapPreview";
import { Achievements } from "@/components/dashboard/Achievements";
import { EmergencyContacts } from "@/components/dashboard/EmergencyContacts";
import { useMyReports } from "@/hooks/useMyReports";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { reports, stats, isLoading } = useMyReports();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Hero greeting + Quick actions */}
        <HeroSection />

        {/* Overview stats cards */}
        <OverviewCards stats={stats} isLoading={isLoading} />

        {/* My Reports (left) + Recent Activity (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MyReports reports={reports} isLoading={isLoading} />
          <RecentActivity activities={stats.recentActivity} isLoading={isLoading} />
        </div>

        {/* Map + Achievements row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SafetyMapPreview />
          <Achievements />
        </div>

        {/* Emergency Contacts (left) + Nearby Hazards (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EmergencyContacts />
          <NearbyHazards />
        </div>

        {/* Footer message */}
        <p className="text-center text-xs text-[var(--color-text-muted)] py-4">
          {t("footer")}
        </p>
      </motion.div>
    </div>
  );
}

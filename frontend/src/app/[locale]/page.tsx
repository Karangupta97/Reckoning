import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { AiIntelligence } from "@/components/AiIntelligence";
import { Features } from "@/components/Features";
import { Countries } from "@/components/Countries";
import { StatsBar } from "@/components/StatsBar";
import { Testimonials } from "@/components/Testimonials";
import { TrustBadges } from "@/components/TrustBadges";
import { ReportCTA } from "@/components/ReportCTA";
import { Footer } from "@/components/Footer";
import {Agentation} from "agentation";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  // Opt into static rendering for this locale.
  setRequestLocale(locale);

  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Hero />
        <HowItWorks />
        <AiIntelligence />
        <Features />
        <Countries />
        <StatsBar />
        <Testimonials />
        <TrustBadges />
        <ReportCTA />
      </main>
      <Footer />
      {process.env.NODE_ENV === "development" && <Agentation />}
    </>
  );
}

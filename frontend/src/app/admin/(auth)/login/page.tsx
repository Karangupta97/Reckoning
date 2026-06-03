"use client";

import { memo } from "react";
import UploadPanel from "@/components/user/dashboard/UploadPanel";
import SmartReport from "@/components/user/dashboard/SmartReport";
import ComplaintForm from "@/components/user/dashboard/ComplaintForm";
import SpendTracker from "@/components/user/dashboard/SpendTracker";
import ContractorLeaderboard from "@/components/user/dashboard/ContractorLeaderboard";
import CommunityImpact from "@/components/user/dashboard/CommunityImpact";

function SubdistrictDashboard() {
  return (
    <div className="rk-subdistrict-dashboard">
      <header className="rk-dashboard-hero">
        <div className="rk-dashboard-hero-text">
          <span className="rk-hero-eyebrow">Pune Subdistrict · Ward 8</span>
          <h1 className="rk-hero-title">Road Transparency Dashboard</h1>
          <p className="rk-hero-desc">
            Report defects anonymously, track AI-detected issues, and hold contractors accountable —
            all without storing personal data.
          </p>
        </div>
        <div className="rk-hero-badges">
          <span className="rk-hero-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Privacy-first
          </span>
          <span className="rk-hero-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12.55a11 11 0 0114.08 0" />
              <path d="M1.42 9a16 16 0 0121.16 0" />
              <path d="M8.53 16.11a6 6 0 016.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
            Offline-ready
          </span>
          <span className="rk-hero-badge accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a2 2 0 010 4h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a2 2 0 010-4h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
            </svg>
            AI-powered
          </span>
        </div>
      </header>

      <div className="rk-dashboard-grid">
        <div className="rk-dash-col-main">
          <UploadPanel />
          <SmartReport />
          <SpendTracker />
        </div>
        <aside className="rk-dash-col-side">
          <ComplaintForm />
          <ContractorLeaderboard />
          <CommunityImpact />
        </aside>
      </div>
    </div>
  );
}

export default memo(SubdistrictDashboard);

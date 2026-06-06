"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopHeader } from "@/components/dashboard/TopHeader";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { PWAProvider, PWAInstallBanner, OfflineSyncStatus } from "@/components/pwa";

export function CitizenShell({ children }: { children: React.ReactNode }) {
  return (
    <PWAProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--color-page)] max-w-[100vw]">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile sidebar drawer */}
        <MobileSidebar />

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden overflow-x-hidden">
          <TopHeader />

          {/* PWA Install Banner */}
          <PWAInstallBanner />

          <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0">
            {/* Offline sync status */}
            <div className="px-4 sm:px-6 lg:px-8 pt-2">
              <OfflineSyncStatus />
            </div>
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileBottomNav />
      </div>
    </PWAProvider>
  );
}

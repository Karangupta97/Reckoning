"use client";

import { Suspense, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopHeader } from "@/components/dashboard/TopHeader";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { PWAProvider, PWAInstallBanner, OfflineSyncStatus } from "@/components/pwa";

/** Spinner shown only in the content area while router.refresh() is in flight */
function ContentRefreshingIndicator() {
  return (
    <div className="flex items-center justify-center py-8">
      <RefreshCw size={20} className="animate-spin text-[var(--color-text-muted)]" />
    </div>
  );
}

/** Button that refreshes only server-side data without a full page reload */
export function DashboardRefreshButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      aria-label="Refresh page data"
      className={`inline-flex items-center justify-center rounded-xl p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50 ${className ?? ""}`}
    >
      <RefreshCw size={16} className={isPending ? "animate-spin" : ""} strokeWidth={2} />
    </button>
  );
}

export function CitizenShell({ children }: { children: React.ReactNode }) {
  return (
    <PWAProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--color-page)] max-w-[100vw]">
        {/* Desktop sidebar — persists across all navigations and refreshes */}
        <Sidebar />

        {/* Mobile sidebar drawer */}
        <MobileSidebar />

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden overflow-x-hidden">
          <TopHeader />

          {/* PWA Install Banner */}
          <PWAInstallBanner />

          {/*
            Suspense boundary scoped to the content area only.
            When router.refresh() is called, only this region
            shows a loading indicator — the sidebar is unaffected.
          */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0">
            <div className="px-4 sm:px-6 lg:px-8 pt-2">
              <OfflineSyncStatus />
            </div>
            <Suspense fallback={<ContentRefreshingIndicator />}>
              {children}
            </Suspense>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileBottomNav />
      </div>
    </PWAProvider>
  );
}

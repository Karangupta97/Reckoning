"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopHeader } from "@/components/dashboard/TopHeader";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";

export function CitizenShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-page)]">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar drawer */}
      <MobileSidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader />

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}

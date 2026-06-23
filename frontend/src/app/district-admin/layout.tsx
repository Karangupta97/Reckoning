"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { DistrictAdminSidebar, DistrictAdminHeader } from "@/components/district-admin-dashboard";
import "@/components/district-admin-dashboard/district-admin-theme.css";
import { districtLabel } from "@/lib/district-config";
import { useStoreSync } from "@/hooks/useStoreSync";
import { api } from "@/lib/api";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { shouldUseMock } from "@/lib/useMock";
import QueryProvider from "@/app/query-provider";

export default function DistrictAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [authStatus, setAuthStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const router = useRouter();

  const currentAdmin = useAdminAuthStore((s) => s.admin);
  const isMock = shouldUseMock(currentAdmin?.email);

  useStoreSync();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMock) {
      if (currentAdmin && currentAdmin.role === "DISTRICT_ADMIN") {
        setAuthStatus("authenticated");
      } else {
        setAuthStatus("unauthenticated");
        router.push("/admin/login");
      }
      return;
    }

    // Only verify if we haven't already determined auth status
    if (authStatus !== "loading") return;

    let cancelled = false;
    const verifyAuth = async () => {
      try {
        const res = await api.get("/api/admin/auth/me");
        if (cancelled) return;
        if (res.data?.success && res.data?.data?.role === "DISTRICT_ADMIN") {
          setAuthStatus("authenticated");
        } else {
          setAuthStatus("unauthenticated");
          router.push("/admin/login");
        }
      } catch (err) {
        if (cancelled) return;
        setAuthStatus("unauthenticated");
        router.push("/admin/login");
      }
    };
    verifyAuth();
    return () => { cancelled = true; };
    // Only depend on stable values — not currentAdmin which changes on store hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMock]);

  if (authStatus === "loading") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#1A1F2E] font-sans">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="h-10 w-10 rounded-full border-4 border-teal-500/20 border-t-teal-400"
        />
        <p className="mt-4 text-xs font-semibold tracking-wider text-teal-400/80 uppercase">
          Verifying Credentials...
        </p>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return null;
  }

  return (
    <QueryProvider>
      <div className="district-admin-shell h-screen overflow-hidden bg-[var(--color-page)] text-[var(--color-text-primary)]">
        <div className="flex h-full">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex lg:flex-shrink-0">
            <DistrictAdminSidebar />
          </div>

          {/* Main content */}
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            <DistrictAdminHeader
              onMenuToggle={() => setIsMobileSidebarOpen(true)}
              title={districtLabel}
              subtitle="Monitoring • Escalations • SLA Compliance"
            />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>

        {/* Mobile sidebar drawer */}
        <AnimatePresence>
          {isMobile && isMobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 w-[260px] lg:hidden"
              >
                <DistrictAdminSidebar />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </QueryProvider>
  );
}


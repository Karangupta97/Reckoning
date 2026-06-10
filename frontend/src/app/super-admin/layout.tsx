"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/super-admin-dashboard/sidebar";
import Header from "@/components/super-admin-dashboard/header";
import "@/components/super-admin-dashboard/super-admin-theme.css";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

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

  return (
    <div className="h-screen overflow-hidden bg-[var(--color-page)] text-[var(--color-text-primary)]">
      <div className="flex h-full">
        <div className="hidden lg:block lg:w-[250px] lg:flex-shrink-0">
          <Sidebar activePath={pathname} />
        </div>
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Header onMenuToggle={() => setIsMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {isMobile && isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] lg:hidden"
            >
              <Sidebar activePath={pathname} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
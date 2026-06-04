"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/super-admin-dashboard/sidebar";
import Header from "@/components/super-admin-dashboard/header";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    <div className="min-h-screen bg-[#0a0f1a] text-slate-200">
      {/* Desktop Layout */}
      <div className="flex min-h-screen">
        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:w-[250px] lg:flex-shrink-0">
          <Sidebar activePath="/dashboard" />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <Header onMenuToggle={() => setIsMobileSidebarOpen(true)} />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobile && isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] lg:hidden"
            >
              <Sidebar activePath="/dashboard" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
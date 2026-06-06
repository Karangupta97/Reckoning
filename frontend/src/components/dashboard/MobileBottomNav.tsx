"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";

/* ─── Props ───────────────────────────────────────────────────── */
interface BottomNavProps {
  notificationCount?: number; // default 0 — overrides store count if provided
}

/* ─── Icon Components (outlined + filled variants) ────────────── */

function HomeOutlined({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function HomeFilled({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" className={className}>
      <path d="M12.707 2.293a1 1 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13h1v7a2 2 0 0 0 2 2h4v-6h4v6h4a2 2 0 0 0 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9z" />
    </svg>
  );
}

function MapOutlined({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function MapFilled({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
    </svg>
  );
}

function BellOutlined({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function BellFilled({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

function UserOutlined({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function UserFilled({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2h16z" />
    </svg>
  );
}

/* ─── Tab configuration ───────────────────────────────────────── */
interface TabConfig {
  id: string;
  label: string;
  href: string;
  ariaLabel: string;
  IconOutlined: React.FC<{ className?: string }>;
  IconFilled: React.FC<{ className?: string }>;
}

const TABS: TabConfig[] = [
  {
    id: "home",
    label: "Home",
    href: "/dashboard",
    ariaLabel: "Go to Home",
    IconOutlined: HomeOutlined,
    IconFilled: HomeFilled,
  },
  {
    id: "map",
    label: "Map",
    href: "/map",
    ariaLabel: "Open Safety Map",
    IconOutlined: MapOutlined,
    IconFilled: MapFilled,
  },
  {
    id: "fab",
    label: "",
    href: "/report",
    ariaLabel: "Report a Road Hazard",
    IconOutlined: () => null,
    IconFilled: () => null,
  },
  {
    id: "notifications",
    label: "Alerts",
    href: "/notifications",
    ariaLabel: "View Notifications",
    IconOutlined: BellOutlined,
    IconFilled: BellFilled,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    ariaLabel: "Open Profile",
    IconOutlined: UserOutlined,
    IconFilled: UserFilled,
  },
];

/* ─── Tab Item Component ──────────────────────────────────────── */
function TabItem({
  tab,
  isActive,
  badge,
  onPress,
}: {
  tab: TabConfig;
  isActive: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <motion.button
      onClick={onPress}
      whileTap={{ scale: 0.88 }}
      tabIndex={0}
      role="button"
      aria-label={tab.ariaLabel}
      aria-current={isActive ? "page" : undefined}
      className="relative flex flex-col items-center justify-center flex-1 h-full min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded-lg whitespace-nowrap"
    >
      {/* Icon */}
      <span className="relative w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.span
              key="filled"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center text-[var(--color-amber)]"
            >
              <tab.IconFilled className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.span>
          ) : (
            <motion.span
              key="outlined"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center text-[var(--color-text-muted)]"
            >
              <tab.IconOutlined className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Notification Badge */}
        {badge !== undefined && badge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="absolute -top-0.5 -right-1.5 min-w-[14px] h-[14px] sm:min-w-[16px] sm:h-[16px] px-[2px] sm:px-[3px] flex items-center justify-center rounded-full bg-[var(--color-danger)] text-white font-sans"
            style={{ fontSize: "9px", fontWeight: 700, lineHeight: 1 }}
            aria-label={`${badge} unread notifications`}
          >
            {badge > 9 ? "9+" : badge}
          </motion.span>
        )}
      </span>

      {/* Active dot indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-1 h-1 rounded-full bg-[var(--color-amber)] mt-[2px]"
          />
        )}
      </AnimatePresence>
      {!isActive && <span className="w-1 h-1 mt-[2px] opacity-0" />}

      {/* Label */}
      <span
        className="text-[10px] sm:text-[11px] md:text-[12px] text-center leading-tight mt-[1px] sm:mt-[2px] font-sans whitespace-nowrap"
        style={{
          color: isActive ? "var(--color-amber)" : "var(--color-text-muted)",
          fontWeight: isActive ? 600 : 400,
        }}
      >
        {tab.label}
      </span>
    </motion.button>
  );
}

/* ─── Center FAB ──────────────────────────────────────────────── */
function CenterFAB({
  isActive,
  onPress,
}: {
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <div className="relative flex items-center justify-center flex-1 min-w-0 h-full">
      {/* Outer touch target — centered, positioned above navbar */}
      <motion.button
        onClick={onPress}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.9, rotate: 45 }}
        tabIndex={0}
        role="button"
        aria-label="Report a Road Hazard"
        className="absolute left-1/2 flex items-center justify-center w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] md:w-[72px] md:h-[72px] rounded-full outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
        style={{
          bottom: "14px",
          transform: "translateX(-50%)",
        }}
      >
        {/* Inner visible circle */}
        <div
          className="relative w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] md:w-[52px] md:h-[52px] rounded-full flex items-center justify-center"
          style={{
            backgroundColor: "#F59E0B",
            border: "3px solid var(--color-card)",
            boxShadow: "var(--shadow-fab, 0 4px 20px rgba(245,158,11,0.45))",
          }}
        >
          {/* Active glow ring pulse */}
          {isActive && (
            <motion.span
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 0 0px rgba(245,158,11,0)",
                  "0 0 0 8px rgba(245,158,11,0.3)",
                  "0 0 0 0px rgba(245,158,11,0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Plus icon */}
          <Plus size={22} strokeWidth={2.2} className="text-white sm:w-6 sm:h-6" />
        </div>
      </motion.button>

      {/* Idle float animation when on /report */}
      {isActive && (
        <motion.div
          className="absolute left-1/2 flex items-center justify-center w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] md:w-[72px] md:h-[72px] pointer-events-none"
          style={{ bottom: "14px", transform: "translateX(-50%)" }}
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

/* ─── Main BottomNav Component ────────────────────────────────── */
export function MobileBottomNav({ notificationCount }: BottomNavProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const storeUnreadCount = useNotificationStore((s) => s.getUnreadCount());
  const [pwaExtraPadding, setPwaExtraPadding] = useState(0);

  // Resolve notification count: prop override > store
  const badgeCount = notificationCount ?? storeUnreadCount;

  // PWA standalone detection
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setPwaExtraPadding(8);
    }
  }, []);

  const isTabActive = useCallback(
    (href: string) => {
      if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
      return pathname.startsWith(href);
    },
    [pathname]
  );

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );

  return (
    <motion.nav
      initial={{ y: 72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      role="navigation"
      aria-label="Mobile navigation"
      style={{
        maxWidth: "100vw",
        overflowX: "hidden",
        paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${pwaExtraPadding}px)`,
      }}
    >
      {/* Background container — max-width for large tablets, centered */}
      <div
        className="relative w-full max-w-screen-lg mx-auto backdrop-blur-md"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)",
          borderTop: "0.5px solid var(--color-border)",
          borderRadius: "20px 20px 0 0",
          boxShadow: "var(--shadow-bottom-nav, 0 -4px 24px rgba(0,0,0,0.08))",
        }}
      >
        {/* 5-column flex container */}
        <div className="flex flex-row items-stretch justify-around w-full h-[60px] sm:h-[66px] md:h-[72px] px-1 sm:px-2 md:px-4">
          {TABS.map((tab) => {
            if (tab.id === "fab") {
              return (
                <CenterFAB
                  key={tab.id}
                  isActive={isTabActive(tab.href)}
                  onPress={() => navigate(tab.href)}
                />
              );
            }

            return (
              <TabItem
                key={tab.id}
                tab={tab}
                isActive={isTabActive(tab.href)}
                badge={tab.id === "notifications" ? badgeCount : undefined}
                onPress={() => navigate(tab.href)}
              />
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}

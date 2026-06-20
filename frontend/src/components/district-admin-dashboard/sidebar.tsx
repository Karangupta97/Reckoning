"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  AlertTriangle,
  BarChart3,
  Map,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  Activity,
  Users,
  UserCircle,
  ShieldAlert,
  Shield,
  Bell,
  Zap,
  MapPin,
  Trophy,
  Award,
  MessageSquare,
} from "lucide-react";
import { districtSidebarSubtitle, DISTRICT_CONFIG } from "@/lib/district-config";

interface SubNavItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  hasDropdown?: boolean;
  color?: string;
  children?: SubNavItem[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    href: "/district-admin/dashboard",
    color: "text-[var(--color-text-muted)]",
  },
  {
    label: "Escalations",
    icon: <ShieldAlert size={18} />,
    href: "/district-admin/dashboard/escalation",
    color: "text-[var(--color-text-muted)]",
  },
  {
    label: "Clarifications",
    icon: <MessageSquare size={18} />,
    href: "/district-admin/clarifications",
    color: "text-[var(--color-text-muted)]",
  },
  {
    label: "Budget Requests",
    icon: <BarChart3 size={18} />,
    href: "/district-admin/budget",
    color: "text-[var(--color-text-muted)]",
  },
  {
    label: "Evidence",
    icon: <FileText size={18} />,
    href: "/district-admin/evidence",
    color: "text-[var(--color-text-muted)]",
  },
  {
    label: "Governance",
    icon: <Shield size={18} />,
    href: "/district-admin/governance",
    color: "text-[var(--color-text-muted)]",
  },
  {
    label: "Sub-Districts",
    icon: <Users size={18} />,
    href: "/district-admin/dashboard/sub-districts",
    hasDropdown: true,
    color: "text-[var(--color-text-muted)]",
    children: [
      { label: "All Sub-Districts", href: "/district-admin/dashboard/sub-districts/all-sub-districts" },
      { label: "Add New", href: "/district-admin/dashboard/sub-districts/new" },
    ],
  },
  {
    label: "District Analytics",
    icon: <BarChart3 size={18} />,
    href: "/district-admin/analytics",
    color: "text-[var(--color-text-muted)]",
  },
  {
    label: "Map View",
    icon: <Map size={18} />,
    href: "/district-admin/map",
    color: "text-[var(--color-text-muted)]",
  },
  {
    label: "Reports",
    icon: <FileText size={18} />,
    href: "/district-admin/reports",
    color: "text-[var(--color-text-muted)]",
  },
  {
    label: "Alerts",
    icon: <Bell size={18} />,
    href: "/district-admin/alerts",
    color: "text-[var(--color-text-muted)]",
  },
  {
    label: "Leaderboard",
    icon: <Trophy size={18} />,
    href: "/district-admin/leaderboard",
    color: "text-[var(--color-text-muted)]",
  },
  {
    label: "Achievements",
    icon: <Award size={18} />,
    href: "/district-admin/achievements",
    color: "text-[var(--color-text-muted)]",
  },
  {
    label: "Profile",
    icon: <UserCircle size={18} />,
    href: "/district-admin/profile",
    color: "text-[var(--color-text-muted)]",
  },
];

interface SidebarProps {
  activePath?: string;
}

const SIDEBAR_WIDTH = 250;

const sidebarShell =
  "bg-[var(--color-card)] border-[var(--color-border)]";

const navScrollClass = [
  "flex-1 overflow-y-auto px-3 py-3 space-y-0.5",
  "[scrollbar-width:thin]",
  "[scrollbar-color:rgba(255,255,255,0.12)_transparent]",
  "[&::-webkit-scrollbar]:w-1",
  "[&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-full",
  "[&::-webkit-scrollbar-thumb]:bg-white/10",
  "[&::-webkit-scrollbar-thumb:hover]:bg-white/20",
].join(" ");

export default function DistrictAdminSidebar({
  activePath: activePathProp,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const activePath = activePathProp ?? pathname ?? "/district-admin/dashboard";
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const parentsToExpand = navItems
      .filter((item) =>
        item.children?.some((child) => activePath === child.href)
      )
      .map((item) => item.label);

    if (parentsToExpand.length > 0) {
      setExpandedItems((prev) => {
        const next = new Set(prev);
        parentsToExpand.forEach((l) => next.add(l));
        return next;
      });
    }
  }, [activePath]);

  const toggleExpand = useCallback((label: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }, []);

  const isActive = useCallback(
    (href: string) => {
      if (activePath === href) return true;
      // Allow child routes to highlight their parent leaf item
      // (e.g. escalation detail /escalation/ESC-4021 highlights Escalations)
      // but ONLY for known non-dashboard prefixes to avoid Dashboard false-positives
      const nonDashboardPrefixes = [
        "/district-admin/dashboard/escalation",
        "/district-admin/dashboard/sub-districts",
        "/district-admin/map",
        "/district-admin/analytics",
        "/district-admin/reports",
        "/district-admin/alerts",
        "/district-admin/profile",
        "/district-admin/leaderboard",
        "/district-admin/achievements",
      ];
      if (nonDashboardPrefixes.includes(href) && activePath.startsWith(href + "/")) {
        return true;
      }
      return false;
    },
    [activePath]
  );

  const isParentActive = useCallback(
    (item: NavItem) => {
      // Parent with children: highlight if any child is active
      if (item.children?.length) {
        return item.children.some((child) => activePath === child.href);
      }
      // Leaf: use isActive
      return isActive(item.href);
    },
    [activePath, isActive]
  );

  const sidebarContent = useMemo(
    () => (
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="flex items-center gap-3.5 px-4 py-5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 shadow-[0_0_24px_rgba(20,184,166,0.22)]">
            <div
              className="pointer-events-none absolute inset-0 rounded-xl bg-teal-400/15 blur-md"
              aria-hidden
            />
            <Activity
              size={20}
              className="relative text-teal-400 drop-shadow-[0_0_10px_rgba(20,184,166,0.55)]"
            />
          </div>
          <div className="min-w-0 flex flex-col gap-0.5">
            <span className="text-base font-bold tracking-wide text-[var(--color-text-primary)] truncate">
              RECKONING
            </span>
            <span className="flex items-center gap-1 text-[10px] leading-snug text-teal-400/80 line-clamp-1 font-medium truncate">
              <MapPin size={9} className="shrink-0" />
              {districtSidebarSubtitle}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className={navScrollClass} aria-label="District admin navigation">
          {navItems.map((item) => {
            const active = isParentActive(item);
            const expanded = expandedItems.has(item.label);

            return (
              <div key={item.label}>
                <motion.button
                  onClick={() => {
                    if (item.hasDropdown) toggleExpand(item.label);
                    else router.push(item.href);
                  }}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-[13px] font-medium
                    transition-all duration-200 border
                    ${
                      active
                        ? `bg-teal-500/10 text-teal-300 border-teal-500/20
                           shadow-[0_0_16px_rgba(20,184,166,0.1)]`
                        : `text-[var(--color-text-secondary)] border-transparent
                           hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]`
                    }
                  `}
                >
                  <span
                    className={`shrink-0 transition-colors duration-200 ${
                      active ? "text-teal-300" : item.color
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.hasDropdown && (
                    <motion.span
                      animate={{ rotate: expanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={`shrink-0 ${
                        active ? "text-teal-400/60" : "text-[var(--color-text-muted)]"
                      }`}
                    >
                      <ChevronDown size={14} />
                    </motion.span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {item.hasDropdown && expanded && item.children && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pl-11 pr-2 py-1 space-y-0.5">
                        {item.children.map((sub) => {
                          const subActive = isActive(sub.href);
                          return (
                            <motion.button
                              key={sub.label}
                              onClick={() => router.push(sub.href)}
                              whileHover={{ x: 2 }}
                              whileTap={{ scale: 0.98 }}
                              className={`
                                w-full flex items-center gap-2 px-3 py-2 rounded-md text-[11px]
                                transition-all duration-200
                                ${
                                  subActive
                                    ? `text-teal-300 bg-teal-500/10 shadow-[0_0_10px_rgba(20,184,166,0.1)]`
                                    : `text-[var(--color-text-muted)]
                                       hover:text-teal-600 hover:bg-teal-500/[0.08]
                                       dark:hover:text-teal-300 dark:hover:bg-teal-500/[0.06]`
                                }
                              `}
                            >
                              <ChevronRight
                                size={11}
                                className={
                                  subActive
                                    ? "text-teal-400"
                                    : "text-[var(--color-text-muted)]"
                                }
                              />
                              <span className="truncate">{sub.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Footer status */}
        <div className="px-3 pb-4 pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(20,184,166,0.6)]" />
            <span className="text-[11px] text-[var(--color-text-secondary)] truncate">
              {DISTRICT_CONFIG.name} Operations Active
            </span>
          </div>
        </div>
      </div>
    ),
    [expandedItems, isActive, isParentActive, toggleExpand]
  );

  return (
    <>
      {/* Mobile trigger */}
      {isMobile && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors lg:hidden"
          aria-label="Open navigation"
        >
          <Zap size={20} />
        </motion.button>
      )}

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: -SIDEBAR_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: -SIDEBAR_WIDTH }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{ width: SIDEBAR_WIDTH }}
              className={`fixed inset-y-0 left-0 z-50 border-r lg:hidden ${sidebarShell}`}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        style={{ width: SIDEBAR_WIDTH }}
        className={`hidden lg:flex lg:flex-col lg:shrink-0 border-r h-screen sticky top-0 ${sidebarShell}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

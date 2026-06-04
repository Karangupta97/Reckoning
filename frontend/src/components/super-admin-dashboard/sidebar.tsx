"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Route,
  AlertTriangle,
  BarChart3,
  Users,
  Bell,
  Map,
  Shield,
  FileText,
  ClipboardList,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Hexagon,
} from "lucide-react";

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
    label: "Overview",
    icon: <LayoutDashboard size={18} />,
    href: "/dashboard",
    color: "text-slate-400",
  },
  {
    label: "Road Intelligence",
    icon: <Route size={18} />,
    href: "/dashboard/road-intelligence",
    hasDropdown: true,
    color: "text-slate-400",
    children: [
      {
        label: "Road Conditions",
        href: "/dashboard/road-intelligence/road-conditions",
      },
      {
        label: "Traffic Analysis",
        href: "/dashboard/road-intelligence/traffic-analysis",
      },
      {
        label: "Infrastructure Health",
        href: "/dashboard/road-intelligence/infrastructure-health",
      },
    ],
  },
  {
    label: "Complaints",
    icon: <AlertTriangle size={18} />,
    href: "/dashboard/complaints",
    hasDropdown: true,
    color: "text-slate-400",
    children: [
      {
        label: "Citizen Complaints",
        href: "/dashboard/complaints/citizen-complaints",
      },
      {
        label: "Escalated Cases",
        href: "/dashboard/complaints/escalated-cases",
      },
      {
        label: "Resolution Tracker",
        href: "/dashboard/complaints/resolution-tracker",
      },
    ],
  },
  {
    label: "Expenditure Analytics",
    icon: <BarChart3 size={18} />,
    href: "/dashboard/expenditure",
    hasDropdown: true,
    color: "text-slate-400",
    children: [
      {
        label: "Budget Allocation",
        href: "/dashboard/expenditure/budget-allocation",
      },
      {
        label: "Spending Trends",
        href: "/dashboard/expenditure/spending-trends",
      },
      {
        label: "Audit Insights",
        href: "/dashboard/expenditure/audit-insights",
      },
    ],
  },
  {
    label: "Contractors",
    icon: <Users size={18} />,
    href: "/dashboard/contractors",
    hasDropdown: true,
    color: "text-slate-400",
    children: [
      {
        label: "Verified Contractors",
        href: "/dashboard/contractors/verified-contractors",
      },
      {
        label: "Pending Verification",
        href: "/dashboard/contractors/pending-verification",
      },
      {
        label: "Risk Assessment",
        href: "/dashboard/contractors/risk-assessment",
      },
    ],
  },
  {
    label: "AI Alerts",
    icon: <Bell size={18} />,
    href: "/dashboard/ai-alerts",
    color: "text-slate-400",
  },
  {
    label: "GIS Monitoring",
    icon: <Map size={18} />,
    href: "/dashboard/gis",
    hasDropdown: true,
    color: "text-slate-400",
    children: [
      {
        label: "Infrastructure Map",
        href: "/dashboard/gis/infrastructure-map",
      },
      {
        label: "Risk Zones",
        href: "/dashboard/gis/risk-zones",
      },
      {
        label: "Satellite View",
        href: "/dashboard/gis/satellite-view",
      },
    ],
  },
  {
    label: "Admin Governance",
    icon: <Shield size={18} />,
    href: "/dashboard/admin",
    hasDropdown: true,
    color: "text-slate-400",
    children: [
      {
        label: "User Roles",
        href: "/dashboard/admin/user-roles",
      },
      {
        label: "Access Control",
        href: "/dashboard/admin/access-control",
      },
      {
        label: "Compliance Review",
        href: "/dashboard/admin/compliance-review",
      },
    ],
  },
  {
    label: "Reports",
    icon: <FileText size={18} />,
    href: "/dashboard/reports",
    color: "text-slate-400",
  },
  {
    label: "Audit Logs",
    icon: <ClipboardList size={18} />,
    href: "/dashboard/audit",
    color: "text-slate-400",
  },
  {
    label: "Settings",
    icon: <Settings size={18} />,
    href: "/dashboard/settings",
    color: "text-slate-400",
  },
];

interface SidebarProps {
  activePath?: string;
}

const SIDEBAR_WIDTH = 250;

const sidebarGradient =
  "bg-gradient-to-b from-[#0c1220] via-[#0a0f1a] to-[#060a12]";

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

export default function Sidebar({ activePath = "/dashboard" }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const parentsToExpand = navItems
      .filter(
        (item) =>
          item.children?.some(
            (child) =>
              activePath === child.href ||
              activePath.startsWith(child.href + "/")
          ) ||
          (item.hasDropdown &&
            activePath !== item.href &&
            activePath.startsWith(item.href + "/"))
      )
      .map((item) => item.label);

    if (parentsToExpand.length > 0) {
      setExpandedItems((prev) => {
        const next = new Set(prev);
        parentsToExpand.forEach((label) => next.add(label));
        return next;
      });
    }
  }, [activePath]);

  const toggleExpand = useCallback((label: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }, []);

  const isActive = useCallback(
    (href: string) =>
      activePath === href || activePath.startsWith(href + "/"),
    [activePath]
  );

  const isParentActive = useCallback(
    (item: NavItem) =>
      isActive(item.href) ||
      (item.children?.some((child) => isActive(child.href)) ?? false),
    [isActive]
  );

  const sidebarContent = useMemo(
    () => (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3.5 px-4 py-5 border-b border-white/[0.06]">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_24px_rgba(34,211,238,0.22)]">
            <div
              className="pointer-events-none absolute inset-0 rounded-xl bg-cyan-400/15 blur-md"
              aria-hidden
            />
            <Hexagon
              size={22}
              className="relative text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.55)]"
            />
          </div>
          <div className="min-w-0 flex flex-col gap-0.5">
            <span className="text-base font-bold tracking-wide text-white truncate">
              RECKONING
            </span>
            <span className="text-[10px] leading-snug text-slate-500 line-clamp-2">
              Infrastructure Transparency Platform
            </span>
          </div>
        </div>

        <nav className={navScrollClass}>
          {navItems.map((item) => {
            const active = isParentActive(item);
            const expanded = expandedItems.has(item.label);

            return (
              <div key={item.label}>
                <motion.button
                  onClick={() => {
                    if (item.hasDropdown) {
                      toggleExpand(item.label);
                    }
                  }}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-[13px] font-medium
                    transition-all duration-200 border
                    ${
                      active
                        ? `
                            bg-cyan-500/10 text-cyan-300 border-cyan-500/20
                            shadow-[0_0_16px_rgba(34,211,238,0.1)]
                          `
                        : `
                            text-slate-400 border-transparent
                            hover:bg-white/[0.03] hover:text-white
                          `
                    }
                  `}
                >
                  <span
                    className={`shrink-0 transition-colors duration-200 ${
                      active ? "text-cyan-300" : item.color
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
                        active ? "text-cyan-400/60" : "text-slate-600"
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
                              whileHover={{ x: 2 }}
                              whileTap={{ scale: 0.98 }}
                              className={`
                                w-full flex items-center gap-2 px-3 py-2 rounded-md text-[11px]
                                transition-all duration-200
                                ${
                                  subActive
                                    ? `
                                        text-cyan-300 bg-cyan-500/10
                                        shadow-[0_0_10px_rgba(34,211,238,0.1)]
                                      `
                                    : `
                                        text-slate-500
                                        hover:text-cyan-300 hover:bg-cyan-500/[0.06]
                                        hover:shadow-[0_0_8px_rgba(34,211,238,0.08)]
                                      `
                                }
                              `}
                            >
                              <ChevronRight
                                size={11}
                                className={
                                  subActive ? "text-cyan-400" : "text-slate-600"
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

        <div className="px-3 pb-4 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span className="text-[11px] text-slate-400">
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    ),
    [expandedItems, isActive, isParentActive, toggleExpand]
  );

  return (
    <>
      {isMobile && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-[#0d1320]/90 border border-[#1e2a3a] text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors lg:hidden"
        >
          <Menu size={20} />
        </motion.button>
      )}

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
              className={`fixed inset-y-0 left-0 z-50 border-r border-white/[0.06] lg:hidden ${sidebarGradient}`}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.03] transition-colors"
              >
                <X size={18} />
              </button>
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside
        style={{ width: SIDEBAR_WIDTH }}
        className={`hidden lg:flex lg:flex-col lg:shrink-0 border-r border-white/[0.06] h-screen sticky top-0 ${sidebarGradient}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

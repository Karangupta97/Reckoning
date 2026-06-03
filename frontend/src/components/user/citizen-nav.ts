export const CITIZEN_NAV = [
  {
    href: "/user/dashboard",
    labelKey: "navHome" as const,
    label: "Home",
    icon: "home",
    section: "top",
    mobile: true,
  },
  {
    href: "/user/dashboard#report",
    labelKey: "navReport" as const,
    label: "Report",
    icon: "upload",
    section: "report",
    mobile: true,
  },
  {
    href: "/user/dashboard#ai",
    labelKey: "navAI" as const,
    label: "SmartReport",
    icon: "ai",
    section: "ai",
    mobile: true,
  },
  {
    href: "/user/dashboard#contractors",
    labelKey: "navContractors" as const,
    label: "Contractors",
    icon: "contractor",
    section: "contractors",
    mobile: false,
  },
  {
    href: "/user/dashboard#community",
    labelKey: "navCommunity" as const,
    label: "Community",
    icon: "community",
    section: "community",
    mobile: true,
  },
] as const;

export const NAV_LABELS: Record<(typeof CITIZEN_NAV)[number]["labelKey"], string> = {
  navHome: "Home",
  navReport: "Report",
  navAI: "SmartReport",
  navContractors: "Contractors",
  navCommunity: "Community",
};

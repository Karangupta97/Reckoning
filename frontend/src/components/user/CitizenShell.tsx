"use client";

import { memo, useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import { CITIZEN_NAV } from "./citizen-nav";
import { useCitizenProfile } from "./CitizenProfileProvider";
import { useLocation } from "./LocationProvider";

function NavIcon({ name }: { name: string }) {
  const props = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  switch (name) {
    case "home":
      return (
        <svg {...props}>
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "grid":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="4" rx="1" />
          <rect x="14" y="11" width="7" height="10" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "upload":
      return (
        <svg {...props}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      );
    case "ai":
      return (
        <svg {...props}>
          <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a2 2 0 010 4h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a2 2 0 010-4h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
          <circle cx="9" cy="14" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "contractor":
      return (
        <svg {...props}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
          <line x1="12" y1="12" x2="12" y2="16" />
          <line x1="10" y1="14" x2="14" y2="14" />
        </svg>
      );
    case "community":
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case "activity":
      return (
        <svg {...props}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case "budget":
      return (
        <svg {...props}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      );
    case "bell":
      return (
        <svg {...props}>
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      );
  }
}

function CitizenShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, initials, role } = useCitizenProfile();
  const { location } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const mobileItems = CITIZEN_NAV.filter((n) => n.mobile);

  return (
    <div className="rk-citizen-shell">
      <div
        className={`rk-sidebar-backdrop ${sidebarOpen ? "visible" : ""}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <aside
        className={`rk-sidebar ${collapsed ? "collapsed" : ""} ${sidebarOpen ? "open" : ""}`}
        aria-label="Citizen navigation"
      >
        <div className="rk-sidebar-header">
          <div className="rk-sidebar-logo">R</div>
          <div className="rk-sidebar-brand-text">
            Reckoning
            <small>Transparency for Every Road</small>
          </div>
        </div>

        <nav className="rk-sidebar-nav">
          <span className="rk-sidebar-section">Navigate</span>
          {CITIZEN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rk-nav-link ${pathname === item.href ? "active" : ""}`}
              onClick={closeSidebar}
            >
              <span className="rk-nav-icon">
                <NavIcon name={item.icon} />
              </span>
              <span className="rk-sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="rk-sidebar-footer">
          <Link href="/user/settings" className="rk-sidebar-user" onClick={closeSidebar}>
            <span className="rk-sidebar-user-avatar">{initials}</span>
            <span className="rk-sidebar-user-text">
              <span className="rk-sidebar-user-name">{profile.name}</span>
              <span className="rk-sidebar-user-role">{role}</span>
            </span>
          </Link>
          <button
            type="button"
            className="rk-sidebar-collapse-btn rk-sidebar-collapse-desktop"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
              {collapsed ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
        </div>
      </aside>

      <div className="rk-main-wrap">
        <header className="rk-topbar">
          <div className="rk-topbar-left">
            <button
              type="button"
              className="rk-menu-btn"
              aria-label="Open menu"
              onClick={() => setSidebarOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <Link href="/user/dashboard" className="rk-topbar-brand">
              <span className="rk-topbar-brand-mark">R</span>
              <span className="rk-topbar-brand-text">
                <span className="rk-topbar-brand-name">Reckoning</span>
                <span className="rk-topbar-tagline">Transparency for Every Road</span>
              </span>
            </Link>

            <div className="rk-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="search" placeholder="Search reports, roads, wards..." aria-label="Search" />
            </div>
          </div>

          <div className="rk-topbar-right">
            <LanguageToggle />

            <button type="button" className="rk-district-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{location.district}</span>
            </button>

            <Link href="/user/notifications" className="rk-icon-btn" aria-label="Notifications">
              <span className="rk-notif-badge" />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </Link>

            <ThemeToggle />

            <Link href="/user/settings" className="rk-avatar" aria-label="Account settings">
              {initials}
            </Link>
          </div>
        </header>

        <main
          className={`rk-content${pathname === "/user/settings" || pathname.startsWith("/user/settings/") ? " rk-content--settings" : ""}`}
        >
          {children}
        </main>
      </div>

      <nav className="rk-mobile-nav" aria-label="Mobile navigation">
        {mobileItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? "active" : ""}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          className={`rk-mobile-nav-btn ${sidebarOpen ? "active" : ""}`}
          onClick={() => setSidebarOpen(true)}
          aria-label="More menu"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          More
        </button>
      </nav>
    </div>
  );
}

export default memo(CitizenShell);

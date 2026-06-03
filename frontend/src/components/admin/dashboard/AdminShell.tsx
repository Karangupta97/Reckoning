"use client";

import { memo, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import "@/style/dashboard.css";

const NAV_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    match: "/admin/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="4" rx="1" />
        <rect x="14" y="11" width="7" height="10" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    href: "/admin/dashboard",
  },
  {
    id: "status",
    label: "Status",
    match: "/admin/status",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    href: "/admin/status",
  },
  {
    id: "upload",
    label: "Upload",
    match: "/admin/upload",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    href: "/admin/upload",
  },
  {
    id: "budget",
    label: "Budget",
    match: "/admin/budget",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    href: "/admin/budget",
  },
  {
    id: "notifications",
    label: "Notifications",
    match: "/admin/notifications",
    badge: 3,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
    href: "/admin/notifications",
  },
  {
    id: "settings",
    label: "Settings",
    match: "/admin/settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    href: "/admin/settings",
  },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  const isActive = (match: string) =>
    pathname === match || pathname.startsWith(`${match}/`);

  const activeItem =
    NAV_ITEMS.find((item) => isActive(item.match)) ?? NAV_ITEMS[0];

  return (
    <div className="admin-shell">
      <div
        className={`sidebar-backdrop ${mobileNavOpen ? "visible" : ""}`}
        onClick={closeMobileNav}
        aria-hidden="true"
      />

      <aside
        className={`admin-sidebar ${mobileNavOpen ? "mobile-open" : ""}`}
        aria-label="Operations navigation"
      >
        <div className="sidebar-header">
          <div className="sidebar-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 17l4-8 4 5 4-9 6 12" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="18" cy="6" r="2" fill="currentColor" stroke="none" opacity="0.9" />
            </svg>
          </div>
          <div className="sidebar-brand">
            <span className="sidebar-brand-name">RoadWatch AI</span>
            <span className="sidebar-brand-sub">Smart City Ops</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Monitor</span>
          {NAV_ITEMS.slice(0, 3).map((item) => (
            <a
              key={item.id}
              className={`sidebar-link ${isActive(item.match) ? "active" : ""}`}
              href={item.href}
              onClick={closeMobileNav}
            >
              {item.icon}
              {item.label}
            </a>
          ))}

          <span className="sidebar-section-label">Manage</span>
          {NAV_ITEMS.slice(3).map((item) => (
            <a
              key={item.id}
              className={`sidebar-link ${isActive(item.match) ? "active" : ""}`}
              href={item.href}
              onClick={closeMobileNav}
            >
              {item.icon}
              {item.label}
              {item.badge ? (
                <span className="sidebar-link-badge">{item.badge}</span>
              ) : null}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">KR</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">K. Ramanujam</div>
              <div className="sidebar-user-role">District Engineer</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <button
              type="button"
              className="sidebar-mobile-toggle"
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((o) => !o)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className="header-breadcrumb">
              Operations
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span>{activeItem.label}</span>
            </div>

            <div className="header-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                placeholder="Search incidents, roads, wards..."
                aria-label="Search operations data"
              />
              <span className="header-search-shortcut">⌘K</span>
            </div>
          </div>

          <div className="header-right">
            <button type="button" className="header-district" aria-haspopup="listbox">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Pune District
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <button type="button" className="header-icon-btn" aria-label="Calendar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>

            <button type="button" className="header-icon-btn" aria-label="Notifications">
              <span className="header-notif-dot" aria-hidden="true" />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>

            <div className="header-avatar" role="img" aria-label="User KR">
              KR
            </div>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

export default memo(AdminShell);

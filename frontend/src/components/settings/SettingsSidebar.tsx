"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  Smartphone,
  MapPin,
  Database,
  HelpCircle,
  AlertTriangle,
  LogOut,
  Wifi,
  WifiOff,
} from "lucide-react";
import { SettingsSearch } from "./SettingsSearch";
import type { SettingsCategory, SettingsCategoryItem } from "./types";
import { useAuthStore } from "@/stores/authStore";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatCountry(country?: string): string {
  if (!country) return "Citizen";
  return country
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const CATEGORIES: SettingsCategoryItem[] = [
  { id: "account", label: "Account", description: "Profile & personal info", icon: User },
  { id: "notifications", label: "Notifications", description: "Alerts & channels", icon: Bell },
  { id: "privacy", label: "Privacy & Security", description: "Visibility & authentication", icon: Shield },
  { id: "language", label: "Language & Region", description: "Locale & translations", icon: Globe },
  { id: "appearance", label: "Appearance", description: "Theme & display", icon: Palette },
  { id: "pwa", label: "PWA & Device", description: "Install, sync & cache", icon: Smartphone },
  { id: "location", label: "Location Preferences", description: "Feed scope & accuracy", icon: MapPin },
  { id: "data", label: "Data & Storage", description: "Offline data & exports", icon: Database },
  { id: "support", label: "Support & Help", description: "FAQ, feedback & legal", icon: HelpCircle },
  { id: "abuse", label: "Report Abuse", description: "Safety & moderation", icon: AlertTriangle, danger: true },
  { id: "logout", label: "Logout", description: "Sign out of your account", icon: LogOut, danger: true },
];

interface SettingsSidebarProps {
  activeCategory: SettingsCategory;
  onSelectCategory: (category: SettingsCategory) => void;
}

export function SettingsSidebar({ activeCategory, onSelectCategory }: SettingsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const filtered = searchQuery
    ? CATEGORIES.filter(
        (c) =>
          c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : CATEGORIES;

  return (
    <aside className="w-[280px] h-full border-r border-[var(--color-border)] bg-[var(--color-card)] flex flex-col">
      {/* Profile Card */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-amber)] to-orange-400 flex items-center justify-center text-white font-bold text-sm">
              {getInitials(user?.fullName ?? "Citizen")}
            </div>
            {/* Online indicator */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--color-surface)] ${
                isOnline ? "bg-[var(--color-success)]" : "bg-[var(--color-text-muted)]"
              }`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {user?.fullName ?? "Citizen"}
            </p>
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <Wifi size={10} className="text-[var(--color-success)]" />
              ) : (
                <WifiOff size={10} className="text-[var(--color-text-muted)]" />
              )}
              <span className="text-[10px] text-[var(--color-text-muted)]">
                {user ? `${formatCountry(user.country)} • ${isOnline ? "Online" : "Offline"}` : isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <SettingsSearch onSearch={setSearchQuery} />
      </div>

      {/* Category Navigation */}
      <nav className="flex-1 px-3 py-1 space-y-0.5" aria-label="Settings categories">
        {filtered.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`
                group relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left
                transition-all duration-200 min-h-[44px]
                ${isActive
                  ? "bg-[var(--color-surface)]"
                  : "hover:bg-[var(--color-surface)]/60"
                }
                ${cat.danger && !isActive ? "hover:bg-[var(--color-danger)]/5" : ""}
              `}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="settings-nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--color-amber)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Icon container */}
              <span
                className={`
                  shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                  transition-all duration-200
                  ${isActive
                    ? "bg-[var(--color-amber)]/10 text-[var(--color-amber)]"
                    : cat.danger
                    ? "text-[var(--color-danger)]/70 group-hover:text-[var(--color-danger)]"
                    : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
                  }
                `}
              >
                <Icon size={17} strokeWidth={1.8} />
              </span>

              {/* Label */}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[13px] font-medium truncate transition-colors duration-200 ${
                    isActive
                      ? "text-[var(--color-text-primary)]"
                      : cat.danger
                      ? "text-[var(--color-danger)]/80 group-hover:text-[var(--color-danger)]"
                      : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {cat.label}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* App version */}
      <div className="px-4 py-3 border-t border-[var(--color-border)]">
        <p className="text-[10px] text-[var(--color-text-muted)] text-center">
          Reckoning v0.1.0 • PWA
        </p>
      </div>
    </aside>
  );
}

"use client";

import { motion } from "framer-motion";
import { ChevronRight, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import { CATEGORIES } from "./SettingsSidebar";
import { SettingsSearch } from "./SettingsSearch";
import type { SettingsCategory } from "./types";

interface CategoryListProps {
  onSelectCategory: (category: SettingsCategory) => void;
}

export function CategoryList({ onSelectCategory }: CategoryListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOnline, setIsOnline] = useState(true);

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

  // Group: main items and danger items
  const mainItems = filtered.filter((c) => !c.danger);
  const dangerItems = filtered.filter((c) => c.danger);

  return (
    <div className="h-full bg-[var(--color-page)] overflow-y-auto overscroll-contain">
      {/* Profile Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-amber)] to-orange-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
              KS
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-page)] ${
                isOnline ? "bg-[var(--color-success)]" : "bg-[var(--color-text-muted)]"
              }`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Settings</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isOnline ? (
                <Wifi size={11} className="text-[var(--color-success)]" />
              ) : (
                <WifiOff size={11} className="text-[var(--color-text-muted)]" />
              )}
              <span className="text-xs text-[var(--color-text-muted)]">
                Karan Sharma • {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <SettingsSearch onSearch={setSearchQuery} />
      </div>

      {/* Main Category Items */}
      <div className="px-4 pb-4">
        {mainItems.length > 0 && (
          <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden divide-y divide-[var(--color-border)] shadow-sm">
            {mainItems.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left
                    active:bg-[var(--color-surface)] transition-colors duration-100
                    min-h-[56px]"
                >
                  <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
                    <Icon size={17} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                      {cat.label}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)] leading-tight">
                      {cat.description}
                    </p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-[var(--color-text-muted)]/60" />
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Danger Items */}
        {dangerItems.length > 0 && (
          <div className="mt-4 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden divide-y divide-[var(--color-border)] shadow-sm">
            {dangerItems.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (mainItems.length + index) * 0.03, duration: 0.2 }}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left
                    active:bg-[var(--color-danger)]/5 transition-colors duration-100
                    min-h-[56px]"
                >
                  <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-danger)]/8 text-[var(--color-danger)]">
                    <Icon size={17} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-[var(--color-danger)]">
                      {cat.label}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)] leading-tight">
                      {cat.description}
                    </p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-[var(--color-text-muted)]/60" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* App version */}
      <div className="px-5 pb-8 pt-2">
        <p className="text-[11px] text-[var(--color-text-muted)] text-center">
          Reckoning v0.1.0 • PWA
        </p>
      </div>
    </div>
  );
}

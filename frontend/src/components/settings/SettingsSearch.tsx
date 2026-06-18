"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

interface SettingsSearchProps {
  onSearch: (query: string) => void;
}

export function SettingsSearch({ onSearch }: SettingsSearchProps) {
  const [query, setQuery] = useState("");

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="relative">
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
      />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search settings..."
        className="w-full h-9 pl-9 pr-8 rounded-lg text-xs
          bg-[var(--color-surface)] border border-[var(--color-border)]
          text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
          focus:outline-none focus:border-[var(--color-amber)] focus:ring-2 focus:ring-[var(--color-amber)]/20
          transition-all duration-200"
        aria-label="Search settings"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
            bg-[var(--color-text-muted)]/20 flex items-center justify-center
            hover:bg-[var(--color-text-muted)]/30 transition-colors"
          aria-label="Clear search"
        >
          <X size={10} className="text-[var(--color-text-muted)]" />
        </button>
      )}
    </div>
  );
}

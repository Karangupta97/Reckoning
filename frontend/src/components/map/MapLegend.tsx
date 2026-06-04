'use client';

import { useState } from 'react';

interface MapLegendProps {
  isDark: boolean;
}

const LEGEND_ITEMS = [
  { color: '#DC2626', label: 'Very High Risk' },
  { color: '#F59E0B', label: 'High Risk' },
  { color: '#EAB308', label: 'Medium Risk' },
  { color: '#22C55E', label: 'Low Risk' },
  { color: '#06B6D4', label: 'Very Low Risk' },
];

export function MapLegend({ isDark }: MapLegendProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="absolute bottom-3 right-3 z-10 rounded-xl p-3 select-none"
      style={{
        background: isDark ? 'rgba(34,40,56,0.92)' : 'rgba(26,31,46,0.88)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        border: `1px solid ${isDark ? '#313A50' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="md:hidden flex items-center gap-1.5 text-[10px] font-semibold text-white/80 mb-1"
      >
        {collapsed ? '▶' : '▼'} Risk Legend
      </button>

      <div className={`space-y-1.5 ${collapsed ? 'hidden' : 'block'} md:block`}>
        {LEGEND_ITEMS.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: item.color, boxShadow: `0 0 6px ${item.color}44` }}
            />
            <span className="text-[11px] text-white/85 whitespace-nowrap">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

interface MapLegendProps {
  isDark: boolean;
  currentLevel?: string;
}

const LEGEND_ITEMS = [
  { color: '#DC2626', label: 'Very High Risk' },
  { color: '#F59E0B', label: 'High Risk' },
  { color: '#EAB308', label: 'Medium Risk' },
  { color: '#22C55E', label: 'Low Risk' },
  { color: '#06B6D4', label: 'Very Low Risk' },
];

const HIERARCHY_ITEMS = [
  { level: 'national', label: 'National', desc: 'Shows State-level division across India' },
  { level: 'state', label: 'District', desc: 'Shows District-level division within State' },
  { level: 'district', label: 'Sub-District', desc: 'Shows Sub-District level local division' },
];

export function MapLegend({ isDark, currentLevel }: MapLegendProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  return (
    <div
      className="absolute bottom-3 right-3 z-[1000] rounded-xl p-3 select-none flex flex-col gap-2.5 max-w-[240px]"
      style={{
        background: isDark ? 'rgba(34,40,56,0.92)' : 'rgba(26,31,46,0.88)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${isDark ? '#313A50' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="md:hidden flex items-center justify-between text-[10px] font-semibold text-white/80 w-full gap-2"
      >
        <span>Risk & Hierarchy Legend</span>
        <span>{collapsed ? '▶' : '▼'}</span>
      </button>

      <div className={`space-y-3 ${collapsed ? 'hidden' : 'block'} md:block`}>
        {/* Risk Indicators */}
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1">Risk Level</p>
          {LEGEND_ITEMS.map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: item.color }}
              />
              <span className="text-[11px] text-white/85 whitespace-nowrap">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Map Hierarchy */}
        <div className="border-t border-white/10 pt-2.5 space-y-1.5">
          <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1">Map Hierarchy</p>
          {HIERARCHY_ITEMS.map(item => {
            const isActive = currentLevel === item.level;
            const isLabelActive = activeLabel === item.label;

            return (
              <div
                key={item.level}
                className="relative flex flex-col cursor-pointer group"
                onMouseEnter={() => setActiveLabel(item.label)}
                onMouseLeave={() => setActiveLabel(null)}
                onClick={() => setActiveLabel(activeLabel === item.label ? null : item.label)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full shrink-0 transition-colors"
                    style={{
                      background: isActive ? 'var(--color-amber, #F59E0B)' : 'rgba(255,255,255,0.2)',
                    }}
                  />
                  <span
                    className="text-[11px] whitespace-nowrap transition-colors"
                    style={{
                      color: isActive ? 'var(--color-amber, #F59E0B)' : 'rgba(255,255,255,0.85)',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[var(--color-amber, #F59E0B)]/20 text-[var(--color-amber, #F59E0B)] leading-none ml-auto scale-90">
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Tooltip on hover (desktop only) */}
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:md:block bg-slate-900 border border-slate-700 text-white text-[10px] rounded-lg px-2.5 py-1.5 w-44 shadow-xl z-50 pointer-events-none text-left font-normal normal-case">
                  <p className="font-semibold text-white/95 text-[11px] mb-0.5">{item.label} Level</p>
                  <p className="text-white/70 leading-normal text-[10px]">{item.desc}</p>
                </div>

                {/* Inline label on mobile tap (mobile only) */}
                {isLabelActive && (
                  <div className="md:hidden text-[9px] text-white/60 pl-4 mt-0.5 leading-normal max-w-full">
                    {item.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

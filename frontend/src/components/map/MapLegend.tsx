'use client';

import { useState } from 'react';

interface MapLegendProps {
  isDark: boolean;
  currentLevel?: string;
}

const LEGEND_ITEMS = [
  { color: '#DC2626', label: 'Very High Risk', range: '80-100' },
  { color: '#F59E0B', label: 'High Risk', range: '60-79' },
  { color: '#EAB308', label: 'Medium Risk', range: '40-59' },
  { color: '#22C55E', label: 'Low Risk', range: '20-39' },
  { color: '#06B6D4', label: 'Very Low Risk', range: '0-19' },
];

const HIERARCHY_ITEMS = [
  { level: 'national', label: 'National → States', desc: '36 States & UTs with real population, area & district data' },
  { level: 'state', label: 'State → Districts', desc: 'All districts with demographic-based risk scoring' },
  { level: 'district', label: 'District → Sub-Districts', desc: 'Talukas, Tehsils, Blocks & Ward-level drill-down' },
];

export function MapLegend({ isDark, currentLevel }: MapLegendProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="absolute bottom-3 right-3 z-[1000] rounded-2xl select-none flex flex-col gap-0 max-w-[250px] overflow-hidden"
      style={{
        background: isDark ? 'rgba(15,23,42,0.94)' : 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${isDark ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.8)'}`,
        boxShadow: isDark
          ? '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)'
          : '0 20px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full px-4 py-3 gap-2"
        style={{
          borderBottom: collapsed ? 'none' : `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : 'rgba(226,232,240,0.6)'}`,
        }}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}>
          Map Legend
        </span>
        <span className="text-[9px]" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
          {collapsed ? '▶' : '▼'}
        </span>
      </button>

      <div className={`${collapsed ? 'hidden' : 'block'} px-4 pb-4 pt-2`}>
        {/* Risk Indicators */}
        <div className="space-y-1.5 mb-3">
          <p className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>
            Risk Score
          </p>
          {LEGEND_ITEMS.map(item => (
            <div key={item.label} className="flex items-center gap-2.5 group">
              <div
                className="h-3 w-3 rounded-[4px] shrink-0 transition-transform group-hover:scale-125"
                style={{ background: item.color, boxShadow: `0 2px 6px ${item.color}40` }}
              />
              <span className="text-[10px] flex-1" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>
                {item.label}
              </span>
              <span className="text-[9px] font-mono" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
                {item.range}
              </span>
            </div>
          ))}
        </div>

        {/* Map Hierarchy */}
        <div className="pt-3 space-y-2" style={{ borderTop: `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : 'rgba(226,232,240,0.6)'}` }}>
          <p className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>
            Drill-Down Levels
          </p>
          {HIERARCHY_ITEMS.map(item => {
            const isActive = currentLevel === item.level;
            return (
              <div key={item.level} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full shrink-0 transition-all"
                    style={{
                      background: isActive ? '#F59E0B' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'),
                      boxShadow: isActive ? '0 0 8px rgba(245,158,11,0.5)' : 'none',
                    }}
                  />
                  <span
                    className="text-[10px] whitespace-nowrap transition-colors"
                    style={{
                      color: isActive ? '#F59E0B' : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'),
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full ml-auto"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                {isActive && (
                  <p className="text-[9px] pl-4 leading-relaxed" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                    {item.desc}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

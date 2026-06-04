'use client';

import type { RegionStats } from '@/lib/map/types';
import { getRiskColor, getRiskLabel } from '@/lib/map/mapUtils';

interface MapTooltipProps {
  stats: RegionStats;
  isDark: boolean;
}

export function MapTooltip({ stats, isDark }: MapTooltipProps) {
  const riskColor = getRiskColor(stats.riskScore);
  const riskLabel = getRiskLabel(stats.riskScore);
  const trendIcon = stats.trend === 'up' ? '📈' : stats.trend === 'down' ? '📉' : '➡️';
  const trendSign = stats.trend === 'up' ? '+' : stats.trend === 'down' ? '-' : '';

  return (
    <div
      className="rounded-xl border p-3"
      style={{
        background: isDark ? '#222838' : '#FFFFFF',
        borderColor: isDark ? '#313A50' : '#D6DFE8',
        maxWidth: 220,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 11,
        lineHeight: 1.4,
        color: isDark ? '#EDF1F7' : '#1C2B3A',
      }}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span
          className="inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
          style={{
            background: `${riskColor}22`,
            color: riskColor,
          }}
        >
          {riskLabel}
        </span>
      </div>
      <div className="mb-2 text-[13px] font-bold">{stats.name}</div>
      <div
        className="mb-2"
        style={{ borderTop: `1px solid ${isDark ? '#313A50' : '#D6DFE8'}` }}
      />
      <div style={{ color: isDark ? '#A8B6C8' : '#4A5D70' }} className="mb-0.5">
        📊 {stats.totalReports} Total Reports
      </div>
      <div style={{ color: isDark ? '#A8B6C8' : '#4A5D70' }} className="mb-0.5">
        🔴 Critical: {stats.criticalCount} &nbsp; 🟡 High: {stats.highCount}
      </div>
      <div style={{ color: isDark ? '#A8B6C8' : '#4A5D70' }} className="mb-2">
        🟢 Resolved: {stats.resolvedReports} &nbsp; ⏳ Open: {stats.openReports}
      </div>
      <div
        className="mb-2"
        style={{ borderTop: `1px solid ${isDark ? '#313A50' : '#D6DFE8'}` }}
      />
      <div style={{ color: isDark ? '#5C6E82' : '#8A9BAD' }} className="mb-0.5">
        ⚠️ Top: {stats.topHazardType} &nbsp; {trendIcon} {trendSign}{stats.trendPercent}%
      </div>
      <div style={{ color: isDark ? '#5C6E82' : '#8A9BAD' }}>
        ✅ {stats.verificationAccuracy}% accuracy &nbsp; ⏱ {stats.avgResolutionDays}d avg
      </div>
    </div>
  );
}

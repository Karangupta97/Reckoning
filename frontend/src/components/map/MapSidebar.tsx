'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, Users } from 'lucide-react';
import type { RegionStats } from '@/lib/map/types';
import { getRiskColor, getRiskLabel } from '@/lib/map/mapUtils';

interface MapSidebarProps {
  stats: RegionStats | null;
  onClose: () => void;
  isDark: boolean;
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
}

function getLevelBadge(level: string): string {
  switch (level) {
    case 'national': return 'State';
    case 'state': return 'District';
    case 'district': return 'Sub-district';
    default: return 'Region';
  }
}

export function MapSidebar({ stats, onClose, isDark }: MapSidebarProps) {
  if (!stats) return null;

  const riskColor = getRiskColor(stats.riskScore);
  const riskLabel = getRiskLabel(stats.riskScore);
  const totalSeverity = stats.criticalCount + stats.highCount + stats.mediumCount + stats.lowCount;
  const criticalPercent = totalSeverity > 0 ? (stats.criticalCount / totalSeverity) * 100 : 0;
  const highPercent = totalSeverity > 0 ? (stats.highCount / totalSeverity) * 100 : 0;
  const mediumPercent = totalSeverity > 0 ? (stats.mediumCount / totalSeverity) * 100 : 0;
  const lowPercent = totalSeverity > 0 ? (stats.lowCount / totalSeverity) * 100 : 0;

  const trendIcon = stats.trend === 'up' ? '↑' : stats.trend === 'down' ? '↓' : '→';
  const trendColor = stats.trend === 'up' ? '#EF4444' : stats.trend === 'down' ? '#22C55E' : '#94A3B8';

  const handleExport = () => {
    const csv = `Region,Total Reports,Open,Resolved,Pending,Critical,High,Medium,Low,Risk Score,Accuracy,Avg Resolution Days\n${stats.name},${stats.totalReports},${stats.openReports},${stats.resolvedReports},${stats.pendingReports},${stats.criticalCount},${stats.highCount},${stats.mediumCount},${stats.lowCount},${stats.riskScore},${stats.verificationAccuracy},${stats.avgResolutionDays}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stats.id}-report-data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="map-sidebar-mobile md:absolute md:right-0 md:top-0 md:bottom-0 md:w-[320px] overflow-y-auto z-20"
        style={{
          background: isDark ? '#222838' : '#FFFFFF',
          borderLeft: `1px solid ${isDark ? '#313A50' : '#D6DFE8'}`,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 p-4 border-b" style={{ borderColor: isDark ? '#313A50' : '#D6DFE8', background: isDark ? '#222838' : '#FFFFFF' }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold truncate" style={{ color: isDark ? '#EDF1F7' : '#1C2B3A' }}>
                {stats.name}
              </h2>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span
                  className="inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: isDark ? '#2A3144' : '#E4EBF1', color: isDark ? '#A8B6C8' : '#4A5D70' }}
                >
                  {getLevelBadge(stats.level)}
                </span>
                <span
                  className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: `${riskColor}18`, color: riskColor }}
                >
                  {riskLabel}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors"
              style={{ background: isDark ? '#2A3144' : '#E4EBF1' }}
              aria-label="Close sidebar"
            >
              <X size={14} style={{ color: isDark ? '#A8B6C8' : '#4A5D70' }} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* Overview cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Total', value: stats.totalReports, color: '#3B82F6' },
              { label: 'Open', value: stats.openReports, color: '#F59E0B' },
              { label: 'Resolved', value: stats.resolvedReports, color: '#22C55E' },
              { label: 'Critical', value: stats.criticalCount, color: '#EF4444' },
            ].map(card => (
              <div
                key={card.label}
                className="rounded-xl p-3 border"
                style={{ borderColor: isDark ? '#313A50' : '#D6DFE8', background: isDark ? '#2A3144' : '#F8FAFC' }}
              >
                <div className="text-[10px] font-medium mb-1" style={{ color: card.color }}>
                  {card.label}
                </div>
                <div className="text-xl font-bold" style={{ color: isDark ? '#EDF1F7' : '#1C2B3A' }}>
                  {card.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Severity breakdown bar */}
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: isDark ? '#A8B6C8' : '#4A5D70' }}>
              Severity Breakdown
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden flex" style={{ background: isDark ? '#1A1F2E' : '#E4EBF1' }}>
              <div style={{ width: `${criticalPercent}%`, background: '#EF4444' }} />
              <div style={{ width: `${highPercent}%`, background: '#F59E0B' }} />
              <div style={{ width: `${mediumPercent}%`, background: '#EAB308' }} />
              <div style={{ width: `${lowPercent}%`, background: '#22C55E' }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px]" style={{ color: isDark ? '#5C6E82' : '#8A9BAD' }}>
              <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: '#EF4444' }} />Critical {stats.criticalCount}</span>
              <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: '#F59E0B' }} />High {stats.highCount}</span>
              <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: '#EAB308' }} />Medium {stats.mediumCount}</span>
              <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: '#22C55E' }} />Low {stats.lowCount}</span>
            </div>
          </div>

          {/* Key metrics */}
          <div className="space-y-3">
            <div className="text-xs font-semibold" style={{ color: isDark ? '#A8B6C8' : '#4A5D70' }}>
              Key Metrics
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: isDark ? '#5C6E82' : '#8A9BAD' }}>⚠️ Top Hazard</span>
              <span className="text-xs font-semibold" style={{ color: isDark ? '#EDF1F7' : '#1C2B3A' }}>{stats.topHazardType}</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: isDark ? '#5C6E82' : '#8A9BAD' }}>✅ Verification Accuracy</span>
                <span className="text-xs font-semibold" style={{ color: isDark ? '#EDF1F7' : '#1C2B3A' }}>{stats.verificationAccuracy}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: isDark ? '#1A1F2E' : '#E4EBF1' }}>
                <div className="h-full rounded-full" style={{ width: `${stats.verificationAccuracy}%`, background: '#22C55E' }} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: isDark ? '#5C6E82' : '#8A9BAD' }}>⏱ Avg Resolution</span>
              <span className="text-xs font-semibold" style={{ color: isDark ? '#EDF1F7' : '#1C2B3A' }}>{stats.avgResolutionDays} days</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: isDark ? '#5C6E82' : '#8A9BAD' }}>📊 Trend</span>
              <span className="text-xs font-bold" style={{ color: trendColor }}>
                {trendIcon} {stats.trend === 'stable' ? '' : stats.trend === 'up' ? '+' : '-'}{stats.trendPercent}% {stats.trend}
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-2">
            <div className="text-xs font-semibold mb-2" style={{ color: isDark ? '#A8B6C8' : '#4A5D70' }}>
              Quick Actions
            </div>
            <a
              href={`/admin/reports?region=${stats.id}`}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-xs font-medium transition-colors border"
              style={{ borderColor: isDark ? '#313A50' : '#D6DFE8', color: isDark ? '#EDF1F7' : '#1C2B3A', background: isDark ? '#2A3144' : '#F8FAFC' }}
            >
              <FileText size={14} style={{ color: '#3B82F6' }} />
              View All Reports
            </a>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-xs font-medium transition-colors border"
              style={{ borderColor: isDark ? '#313A50' : '#D6DFE8', color: isDark ? '#EDF1F7' : '#1C2B3A', background: isDark ? '#2A3144' : '#F8FAFC' }}
            >
              <Download size={14} style={{ color: '#22C55E' }} />
              Export Data
            </button>
            <button
              onClick={() => console.log('[IndiaMap] Assign team triggered for:', stats.id)}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-xs font-medium transition-colors border"
              style={{ borderColor: isDark ? '#313A50' : '#D6DFE8', color: isDark ? '#EDF1F7' : '#1C2B3A', background: isDark ? '#2A3144' : '#F8FAFC' }}
            >
              <Users size={14} style={{ color: '#F59E0B' }} />
              Assign Team
            </button>
          </div>

          {/* Last reported */}
          <div className="pt-2 border-t text-[10px]" style={{ borderColor: isDark ? '#313A50' : '#D6DFE8', color: isDark ? '#5C6E82' : '#8A9BAD' }}>
            Last reported: {formatRelativeTime(stats.lastReportedAt)}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

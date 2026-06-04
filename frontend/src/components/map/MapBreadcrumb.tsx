'use client';

import type { DrillState, MapLevel } from '@/lib/map/types';

interface MapBreadcrumbProps {
  drillState: DrillState;
  onNavigate: (level: MapLevel) => void;
}

export function MapBreadcrumb({ drillState, onNavigate }: MapBreadcrumbProps) {
  const items: { label: string; level: MapLevel; isCurrent: boolean }[] = [];

  if (drillState.level === 'national') {
    items.push({ label: 'India', level: 'national', isCurrent: true });
  } else {
    items.push({ label: 'India', level: 'national', isCurrent: false });

    if (drillState.stateName) {
      items.push({
        label: drillState.stateName,
        level: 'state',
        isCurrent: drillState.level === 'state',
      });
    }

    if (drillState.districtName) {
      items.push({
        label: drillState.districtName,
        level: 'district',
        isCurrent: drillState.level === 'district',
      });
    }

    if (drillState.subdistrictName) {
      items.push({
        label: drillState.subdistrictName,
        level: 'subdistrict',
        isCurrent: drillState.level === 'subdistrict',
      });
    }
  }

  return (
    <nav className="absolute top-3 left-3 z-10 flex items-center overflow-x-auto max-w-[calc(100%-120px)] no-scrollbar">
      <ol className="flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs backdrop-blur-sm"
        style={{ background: 'rgba(34,40,56,0.85)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
      >
        {items.map((item, index) => (
          <li key={item.level + item.label} className="flex items-center gap-1">
            {index > 0 && (
              <span className="text-[10px] text-slate-500 mx-0.5">&gt;</span>
            )}
            {item.isCurrent ? (
              <span className="font-semibold text-white">{item.label}</span>
            ) : (
              <button
                onClick={() => onNavigate(item.level)}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

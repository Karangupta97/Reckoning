'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Layers, Maximize2, Minimize2 } from 'lucide-react';

interface MapControlsProps {
  mapRef: React.RefObject<L.Map | null>;
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const VIEW_MODES = ['Risk View', 'Report Density', 'Resolution Rate'];

export function MapControls({ mapRef, viewMode, onViewModeChange, isExpanded, onToggleExpand }: MapControlsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  return (
    <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5" ref={dropdownRef}>
      {onToggleExpand && (
        <button
          onClick={onToggleExpand}
          className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:scale-105"
          style={{
            background: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}
          aria-label={isExpanded ? 'Minimize map' : 'Maximize map'}
        >
          {isExpanded
            ? <Minimize2 size={16} className="text-[var(--color-text-primary)]" />
            : <Maximize2 size={16} className="text-[var(--color-text-primary)]" />
          }
        </button>
      )}

      <button
        onClick={handleZoomIn}
        className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:scale-105"
        style={{
          background: 'var(--color-card)',
          borderColor: 'var(--color-border)',
        }}
        aria-label="Zoom in"
      >
        <Plus size={16} className="text-[var(--color-text-primary)]" />
      </button>

      <button
        onClick={handleZoomOut}
        className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:scale-105"
        style={{
          background: 'var(--color-card)',
          borderColor: 'var(--color-border)',
        }}
        aria-label="Zoom out"
      >
        <Minus size={16} className="text-[var(--color-text-primary)]" />
      </button>

      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:scale-105"
          style={{
            background: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}
          aria-label="Map layers"
        >
          <Layers size={16} className="text-[var(--color-text-primary)]" />
        </button>

        {showDropdown && (
          <div
            className="absolute top-0 right-11 z-[1001] w-36 rounded-lg border overflow-hidden"
            style={{
              background: 'var(--color-card)',
              borderColor: 'var(--color-border)',
            }}
          >
            {VIEW_MODES.map(mode => (
              <button
                key={mode}
                onClick={() => {
                  onViewModeChange(mode);
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-[11px] font-medium transition-colors"
                style={{
                  color: viewMode === mode ? 'var(--color-amber)' : 'var(--color-text-secondary)',
                  background: viewMode === mode ? 'rgba(245,158,11,0.08)' : 'transparent',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

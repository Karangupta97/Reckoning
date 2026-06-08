'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import type { Layer, LeafletMouseEvent, PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import type { IndiaMapProps } from './IndiaMap';
import type { MapLevel } from '@/lib/map/types';
import { useAdminMap } from '@/hooks/useAdminMap';
import {
  fitBoundsOptions,
  generateTooltipHTML,
  getFeatureId,
  getFeatureName,
  getRiskColor,
} from '@/lib/map/mapUtils';
import { MapBreadcrumb } from './MapBreadcrumb';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { MapSidebar } from './MapSidebar';

// Fix Leaflet default marker icon paths broken by webpack/next.js bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

const LIGHT_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

// India bounding box
const INDIA_BOUNDS: L.LatLngBoundsExpression = [[6.4627, 68.1097], [35.5133, 97.3953]];
const INDIA_FIT_BOUNDS: L.LatLngBoundsExpression = [[8.4, 68.7], [37.6, 97.25]];
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

function useMapTheme(propIsDark?: boolean): boolean {
  const [isDark, setIsDark] = useState(propIsDark ?? false);

  useEffect(() => {
    if (propIsDark !== undefined) {
      setIsDark(propIsDark);
      return;
    }

    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [propIsDark]);

  return isDark;
}

export default function IndiaMapInner({
  adminRole,
  adminRegionId,
  height = '500px',
  className = '',
  onRegionSelect,
  showSidebar = true,
  showBreadcrumb = true,
  showLegend = true,
  showControls = true,
  isDark: propIsDark,
}: IndiaMapProps) {
  const [mounted, setMounted] = useState(false);
  const isDark = useMapTheme(propIsDark);
  const mapRef = useRef<L.Map | null>(null);
  const [viewMode, setViewMode] = useState('Risk View');
  const [isExpanded, setIsExpanded] = useState(false);
  const [statesBorderGeoJSON, setStatesBorderGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);

  const expandedHeight = '85vh';
  const activeHeight = isExpanded ? expandedHeight : height;

  // Ensure client-only rendering to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    drillState,
    currentData,
    isLoading,
    selectedRegion,
    currentGeoJSON,
    drillDown,
    drillUp,
    resetToDefault,
    selectRegion,
    hoverRegion,
  } = useAdminMap(adminRole, adminRegionId);

  const config = useMemo(() => ({
    defaultLevel: (adminRole === 'super_admin' ? 'national' : adminRole === 'district_admin' ? 'district' : 'national') as MapLevel,
    defaultRegionId: adminRegionId,
    adminRole,
    allowedLevels: adminRole === 'super_admin'
      ? ['national', 'state', 'district', 'subdistrict'] as MapLevel[]
      : adminRole === 'sub_district_admin'
        ? ['district', 'subdistrict'] as MapLevel[]
        : ['national', 'state', 'district', 'subdistrict'] as MapLevel[],
    dimOtherRegions: adminRole !== 'super_admin',
  }), [adminRole, adminRegionId]);

  // Load india_states.geojson for border overlay
  useEffect(() => {
    fetch('/geojson/india_states.geojson')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setStatesBorderGeoJSON(data); })
      .catch(() => {});
  }, []);

  // Lock map to India bounds after mount — via whenReady callback, not a ref effect
  const handleMapReady = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setMaxBounds(INDIA_BOUNDS);
    map.fitBounds(INDIA_FIT_BOUNDS);
  }, []);

  // Check if we can drill deeper
  const canDrillDown = useCallback((currentLevel: MapLevel): boolean => {
    const levelIndex = config.allowedLevels.indexOf(currentLevel);
    return levelIndex >= 0 && levelIndex < config.allowedLevels.length - 1;
  }, [config.allowedLevels]);

  // Style function for GeoJSON features (data layer)
  const styleFeature = useCallback((feature: GeoJSON.Feature | undefined): PathOptions => {
    if (!feature) return { fillColor: '#94A3B8', fillOpacity: 0.20, color: '#FFFFFF', weight: 1.5, opacity: 0.8 };

    const regionId = getFeatureId(feature);
    const stats = currentData[regionId];
    const isSelected = selectedRegion?.id === regionId;
    const hasSelection = selectedRegion !== null;

    // Determine fill opacity based on state
    let fillOpacity = 0.35; // default — transparent enough to see map tiles
    if (isSelected) {
      fillOpacity = 0.70;
    } else if (hasSelection) {
      fillOpacity = 0.10; // dimmed — other regions when one is selected
    }

    // No-data regions get even lighter opacity
    if (!stats) {
      fillOpacity = 0.20;
    }

    return {
      fillColor: stats ? getRiskColor(stats.riskScore) : '#94A3B8',
      fillOpacity,
      color: isSelected ? '#F59E0B' : '#FFFFFF',
      weight: isSelected ? 3 : 1.5,
      opacity: isSelected ? 1.0 : 0.8,
    };
  }, [currentData, selectedRegion]);

  // Style for the state border overlay (always visible)
  const borderStyle = useCallback((): PathOptions => ({
    fillColor: 'transparent',
    fillOpacity: 0,
    color: '#FFFFFF',
    weight: 1.5,
    opacity: 0.8,
  }), []);

  // Feature event handlers
  const onEachFeature = useCallback((feature: GeoJSON.Feature, layer: Layer) => {
    const regionId = getFeatureId(feature);
    const regionName = getFeatureName(feature);
    const stats = currentData[regionId];

    if (stats) {
      layer.bindTooltip(generateTooltipHTML(stats, isDark), {
        sticky: true,
        direction: 'top',
        offset: [0, -10],
        opacity: 1,
        className: 'map-tooltip',
      });
    }

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        hoverRegion(regionId);
        const target = e.target;
        target.setStyle({
          fillOpacity: 0.55,
          color: '#FFFFFF',
          weight: 2.5,
          opacity: 1.0,
        });
        target.bringToFront();
      },
      mouseout: (e: LeafletMouseEvent) => {
        hoverRegion(null);
        const target = e.target;
        const isSelected = selectedRegion?.id === regionId;
        const hasSelection = selectedRegion !== null;
        const hasStats = !!currentData[regionId];

        let fillOpacity = 0.35;
        if (isSelected) {
          fillOpacity = 0.70;
        } else if (hasSelection) {
          fillOpacity = 0.10;
        } else if (!hasStats) {
          fillOpacity = 0.20;
        }

        target.setStyle({
          fillOpacity,
          color: isSelected ? '#F59E0B' : '#FFFFFF',
          weight: isSelected ? 3 : 1.5,
          opacity: isSelected ? 1.0 : 0.8,
        });
      },
      click: () => {
        if (canDrillDown(drillState.level)) {
          drillDown(regionId, regionName);
        } else {
          selectRegion(regionId);
          if (onRegionSelect && stats) {
            onRegionSelect(stats);
          }
        }
      },
    });
  }, [currentData, isDark, hoverRegion, selectedRegion, canDrillDown, drillState.level, drillDown, selectRegion, onRegionSelect]);

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = useCallback(async (level: MapLevel) => {
    if (level === drillState.level) return;

    if (level === 'national') {
      await resetToDefault();
      return;
    }

    const currentIndex = config.allowedLevels.indexOf(drillState.level);
    const targetIndex = config.allowedLevels.indexOf(level);

    if (targetIndex < currentIndex) {
      const stepsUp = currentIndex - targetIndex;
      for (let i = 0; i < stepsUp; i++) {
        await drillUp();
      }
    }
  }, [drillState.level, config.allowedLevels, drillUp, resetToDefault]);

  // Fit bounds when GeoJSON changes
  useEffect(() => {
    if (!mapRef.current || !currentGeoJSON || currentGeoJSON.features.length === 0) return;

    const geoJSONLayer = L.geoJSON(currentGeoJSON);
    const bounds = geoJSONLayer.getBounds();

    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, fitBoundsOptions);
    }
  }, [currentGeoJSON]);

  const geoJSONKey = `${drillState.level}-${drillState.stateId || ''}-${drillState.districtId || ''}-${drillState.subdistrictId || ''}`;

  // Don't render until mounted on client to prevent hydration mismatch
  if (!mounted) {
    return (
      <div
        className={`relative w-full overflow-hidden ${className}`}
        style={{ height: activeHeight, width: '100%', borderRadius: '12px', isolation: 'isolate' }}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: isDark ? '#1A1F2E' : '#EFF2F9' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-amber)]" />
            <p className="text-sm text-[var(--color-text-muted)]">Loading map…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        height: activeHeight,
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'height 0.3s ease',
        isolation: 'isolate',
      }}
    >
      {/* Breadcrumb */}
      {showBreadcrumb && (
        <MapBreadcrumb drillState={drillState} onNavigate={handleBreadcrumbNavigate} />
      )}

      {/* Controls */}
      {showControls && (
        <MapControls
          mapRef={mapRef}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(e => !e)}
        />
      )}

      {/* Map */}
      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        minZoom={4}
        maxZoom={18}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
        ref={mapRef}
        whenReady={handleMapReady}
        style={{
          background: isDark ? '#1A1F2E' : '#EFF2F9',
          cursor: canDrillDown(drillState.level) ? 'pointer' : 'default',
          height: '100%',
          width: '100%',
          borderRadius: '12px',
        }}
      >
        {/* Tile layer — reactive: switches URL when isDark changes */}
        <TileLayer
          url={isDark ? DARK_TILE : LIGHT_TILE}
          maxZoom={18}
          minZoom={4}
          keepBuffer={4}
        />

        {/* Data layer — colored regions */}
        {currentGeoJSON && (
          <GeoJSON
            key={geoJSONKey}
            data={currentGeoJSON}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}

        {/* State borders overlay — always visible */}
        {statesBorderGeoJSON && (
          <GeoJSON
            key="india-borders-overlay"
            data={statesBorderGeoJSON}
            style={borderStyle}
            interactive={false}
          />
        )}
      </MapContainer>

      {/* Legend */}
      {showLegend && <MapLegend isDark={isDark} />}

      {/* Sidebar */}
      {showSidebar && selectedRegion && (
        <MapSidebar
          stats={selectedRegion}
          onClose={() => selectRegion(null)}
          isDark={isDark}
        />
      )}

      {/* Drill-down Loading Overlay — semi-transparent, keeps map visible */}
      {isLoading && (
        <div
          className="absolute inset-0 z-[1001] flex flex-col items-center justify-center pointer-events-none"
          style={{ background: isDark ? 'rgba(34,40,56,0.6)' : 'rgba(255,255,255,0.6)', backdropFilter: 'blur(1px)' }}
        >
          <div className="flex flex-col items-center gap-2.5 rounded-xl px-5 py-4" style={{ background: isDark ? 'rgba(26,31,46,0.92)' : 'rgba(255,255,255,0.92)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[var(--color-border)] border-t-[var(--color-amber)]" />
            <p className="text-xs font-medium text-[var(--color-text-muted)]">
              {drillState.level === 'national' ? 'Loading districts…' : drillState.level === 'state' ? 'Loading sub-districts…' : 'Loading…'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DrillState, GeoJSONCache, MapConfig, MapLevel, RegionStats } from './types';
import { getRealDataForRegion } from './indiaRealData';
import { generateFallbackGeoJSON, getGeoJSONUrl, filterDistrictsByState, filterSubdistrictsByDistrict, STATE_CENTERS, DISTRICT_CENTERS } from './mapUtils';

export function useMapData(config: MapConfig) {
  const [drillState, setDrillState] = useState<DrillState>(() => {
    if (config.defaultLevel === 'state' && config.defaultRegionId) {
      return {
        level: 'state',
        stateId: config.defaultRegionId,
        stateName: config.defaultRegionName || config.defaultRegionId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      };
    }
    if (config.defaultLevel === 'district' && config.defaultRegionId) {
      return {
        level: 'district',
        districtId: config.defaultRegionId,
        districtName: config.defaultRegionName || config.defaultRegionId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      };
    }
    return { level: 'national' };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionStats | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<RegionStats | null>(null);
  const [currentGeoJSON, setCurrentGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);

  const geoJSONCache = useRef<GeoJSONCache>({});

  const currentData = useMemo((): Record<string, RegionStats> => {
    if (drillState.level === 'national') {
      return getRealDataForRegion('national');
    }
    if (drillState.level === 'state') {
      return getRealDataForRegion('state', drillState.stateId);
    }
    if (drillState.level === 'district') {
      return getRealDataForRegion('district', drillState.districtId);
    }
    if (drillState.level === 'subdistrict') {
      return getRealDataForRegion('district', drillState.subdistrictId);
    }
    return {};
  }, [drillState]);

  const fetchGeoJSON = useCallback(async (level: MapLevel, regionId?: string): Promise<GeoJSON.FeatureCollection> => {
    const cacheKey = `${level}-${regionId || 'india'}`;

    if (geoJSONCache.current[cacheKey]) {
      return geoJSONCache.current[cacheKey];
    }

    const fetchOpts: RequestInit = {
      priority: 'high' as RequestPriority,
      headers: { 'Cache-Control': 'max-age=86400' },
    };

    try {
      // STATE level: load full india_district.geojson and filter by state
      if (level === 'state' && regionId) {
        const fullDistrictsCacheKey = 'full-districts';
        let fullDistricts: GeoJSON.FeatureCollection;

        if (geoJSONCache.current[fullDistrictsCacheKey]) {
          fullDistricts = geoJSONCache.current[fullDistrictsCacheKey];
        } else {
          const url = getGeoJSONUrl('state', regionId);
          const response = await fetch(url, fetchOpts);
          if (!response.ok) throw new Error(`GeoJSON not found: ${url}`);
          fullDistricts = await response.json() as GeoJSON.FeatureCollection;
          geoJSONCache.current[fullDistrictsCacheKey] = fullDistricts;
        }

        const filtered = filterDistrictsByState(fullDistricts, regionId);
        geoJSONCache.current[cacheKey] = filtered;
        return filtered;
      }

      // DISTRICT level (subdistricts): load full india_subdistricts.geojson and filter by district
      if (level === 'district' && regionId) {
        const fullSubdistrictsCacheKey = 'full-subdistricts';
        let fullSubdistricts: GeoJSON.FeatureCollection;

        if (geoJSONCache.current[fullSubdistrictsCacheKey]) {
          fullSubdistricts = geoJSONCache.current[fullSubdistrictsCacheKey];
        } else {
          const url = getGeoJSONUrl('district', regionId);
          const response = await fetch(url, fetchOpts);
          if (!response.ok) throw new Error(`GeoJSON not found: ${url}`);
          fullSubdistricts = await response.json() as GeoJSON.FeatureCollection;
          geoJSONCache.current[fullSubdistrictsCacheKey] = fullSubdistricts;
        }

        const filtered = filterSubdistrictsByDistrict(fullSubdistricts, regionId);
        geoJSONCache.current[cacheKey] = filtered;
        return filtered;
      }

      // NATIONAL level or fallback: fetch directly
      const url = getGeoJSONUrl(level, regionId);
      const response = await fetch(url, fetchOpts);
      if (!response.ok) throw new Error(`GeoJSON not found: ${url}`);
      const data = await response.json() as GeoJSON.FeatureCollection;
      geoJSONCache.current[cacheKey] = data;
      return data;
    } catch {
      const url = getGeoJSONUrl(level, regionId);
      console.warn(`[IndiaMap] GeoJSON not found for ${url}, using fallback bounds`);

      const mockData = level === 'national'
        ? getRealDataForRegion('national')
        : level === 'state'
          ? getRealDataForRegion('state', regionId)
          : getRealDataForRegion('district', regionId);

      const regionNames = Object.values(mockData).map(r => r.name);
      const center = regionId
        ? (STATE_CENTERS[regionId] || DISTRICT_CENTERS[regionId] || [20.5937, 78.9629])
        : [20.5937, 78.9629] as [number, number];

      const fallback = generateFallbackGeoJSON(
        center as [number, number],
        regionNames.length,
        regionNames
      );
      geoJSONCache.current[cacheKey] = fallback;
      return fallback;
    }
  }, []);

  // Load initial GeoJSON on mount
  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true);
      try {
        let geoJSON: GeoJSON.FeatureCollection;

        if (drillState.level === 'national') {
          geoJSON = await fetchGeoJSON('national');
        } else if (drillState.level === 'state') {
          geoJSON = await fetchGeoJSON('state', drillState.stateId);
        } else if (drillState.level === 'district') {
          geoJSON = await fetchGeoJSON('district', drillState.districtId);
        } else {
          geoJSON = await fetchGeoJSON('national');
        }

        setCurrentGeoJSON(geoJSON);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drillDown = useCallback(async (regionId: string, regionName: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedRegion(null);

    try {
      if (drillState.level === 'national') {
        const geoJSON = await fetchGeoJSON('state', regionId);
        setCurrentGeoJSON(geoJSON);
        setDrillState({
          level: 'state',
          stateId: regionId,
          stateName: regionName,
        });
      } else if (drillState.level === 'state') {
        // Drill from state into a district — load subdistricts filtered by district NAME_2
        const geoJSON = await fetchGeoJSON('district', regionId);
        setCurrentGeoJSON(geoJSON);
        setDrillState(prev => ({
          level: 'district',
          stateId: prev.stateId,
          stateName: prev.stateName,
          districtId: regionId,
          districtName: regionName,
        }));
      } else if (drillState.level === 'district') {
        setDrillState(prev => ({
          level: 'subdistrict',
          stateId: prev.stateId,
          stateName: prev.stateName,
          districtId: prev.districtId,
          districtName: prev.districtName,
          subdistrictId: regionId,
          subdistrictName: regionName,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to drill down');
    } finally {
      setIsLoading(false);
    }
  }, [drillState, fetchGeoJSON]);

  const drillUp = useCallback(async () => {
    setIsLoading(true);
    setSelectedRegion(null);
    setError(null);

    try {
      if (drillState.level === 'subdistrict') {
        // Go back to district level — show subdistricts of this district
        const geoJSON = await fetchGeoJSON('district', drillState.districtId);
        setCurrentGeoJSON(geoJSON);
        setDrillState(prev => ({
          level: 'district',
          stateId: prev.stateId,
          stateName: prev.stateName,
          districtId: prev.districtId,
          districtName: prev.districtName,
        }));
      } else if (drillState.level === 'district') {
        // Go back to state level — show districts of this state
        const geoJSON = await fetchGeoJSON('state', drillState.stateId);
        setCurrentGeoJSON(geoJSON);
        setDrillState(prev => ({
          level: 'state',
          stateId: prev.stateId,
          stateName: prev.stateName,
        }));
      } else if (drillState.level === 'state') {
        const geoJSON = await fetchGeoJSON('national');
        setCurrentGeoJSON(geoJSON);
        setDrillState({ level: 'national' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to navigate up');
    } finally {
      setIsLoading(false);
    }
  }, [drillState, fetchGeoJSON]);

  const resetToDefault = useCallback(async () => {
    setIsLoading(true);
    setSelectedRegion(null);
    setError(null);

    try {
      if (config.defaultLevel === 'state' && config.defaultRegionId) {
        const geoJSON = await fetchGeoJSON('state', config.defaultRegionId);
        setCurrentGeoJSON(geoJSON);
        setDrillState({
          level: 'state',
          stateId: config.defaultRegionId,
          stateName: config.defaultRegionName || config.defaultRegionId,
        });
      } else if (config.defaultLevel === 'district' && config.defaultRegionId) {
        const geoJSON = await fetchGeoJSON('district', config.defaultRegionId);
        setCurrentGeoJSON(geoJSON);
        setDrillState({
          level: 'district',
          districtId: config.defaultRegionId,
          districtName: config.defaultRegionName || config.defaultRegionId,
        });
      } else {
        const geoJSON = await fetchGeoJSON('national');
        setCurrentGeoJSON(geoJSON);
        setDrillState({ level: 'national' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
    } finally {
      setIsLoading(false);
    }
  }, [config, fetchGeoJSON]);

  const selectRegion = useCallback((regionId: string | null) => {
    if (!regionId) {
      setSelectedRegion(null);
      return;
    }
    const stats = currentData[regionId] || null;
    setSelectedRegion(stats);
  }, [currentData]);

  const hoverRegion = useCallback((regionId: string | null) => {
    if (!regionId) {
      setHoveredRegion(null);
      return;
    }
    const stats = currentData[regionId] || null;
    setHoveredRegion(stats);
  }, [currentData]);

  return {
    drillState,
    currentData,
    isLoading,
    error,
    selectedRegion,
    hoveredRegion,
    geoJSONCache,
    currentGeoJSON,
    drillDown,
    drillUp,
    resetToDefault,
    selectRegion,
    hoverRegion,
  };
}

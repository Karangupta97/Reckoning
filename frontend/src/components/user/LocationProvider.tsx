"use client";

import { createContext, useContext, useMemo } from "react";

export type CitizenLocation = {
  district: string;
  subdistrict: string;
  ward: string;
  coords: { lat: number; lng: number };
};

type LocationContextValue = {
  location: CitizenLocation;
};

const DEFAULT_LOCATION: CitizenLocation = {
  district: "Pune District",
  subdistrict: "Pune Subdistrict",
  ward: "Ward 8",
  coords: { lat: 18.5204, lng: 73.8567 },
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => ({ location: DEFAULT_LOCATION }), []);

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return ctx;
}

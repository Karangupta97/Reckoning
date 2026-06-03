"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CITIZEN_USER } from "./citizen-user";

export type CitizenProfile = {
  name: string;
  email: string;
  phone: string;
  nationality: string;
  ward: string;
};

const STORAGE_KEY = "reckoning-citizen-profile";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function loadProfile(): CitizenProfile {
  if (typeof window === "undefined") {
    return {
      name: CITIZEN_USER.name,
      email: CITIZEN_USER.email,
      phone: CITIZEN_USER.phone,
      nationality: CITIZEN_USER.nationality,
      ward: CITIZEN_USER.ward,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        name: CITIZEN_USER.name,
        email: CITIZEN_USER.email,
        phone: CITIZEN_USER.phone,
        nationality: CITIZEN_USER.nationality,
        ward: CITIZEN_USER.ward,
      };
    }
    const parsed = JSON.parse(raw) as Partial<CitizenProfile>;
    return {
      name: parsed.name ?? CITIZEN_USER.name,
      email: parsed.email ?? CITIZEN_USER.email,
      phone: parsed.phone ?? CITIZEN_USER.phone,
      nationality: CITIZEN_USER.nationality,
      ward: parsed.ward ?? CITIZEN_USER.ward,
    };
  } catch {
    return {
      name: CITIZEN_USER.name,
      email: CITIZEN_USER.email,
      phone: CITIZEN_USER.phone,
      nationality: CITIZEN_USER.nationality,
      ward: CITIZEN_USER.ward,
    };
  }
}

type CitizenProfileContextValue = {
  profile: CitizenProfile;
  initials: string;
  saveProfile: (next: CitizenProfile) => void;
  role: string;
  district: string;
  badge: string;
  memberSince: string;
  verified: boolean;
};

const CitizenProfileContext = createContext<CitizenProfileContextValue | null>(null);

export function CitizenProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<CitizenProfile>(loadProfile);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setMounted(true);
  }, []);

  const saveProfile = useCallback((next: CitizenProfile) => {
    const saved: CitizenProfile = {
      ...next,
      nationality: CITIZEN_USER.nationality,
    };
    setProfile(saved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    window.dispatchEvent(new CustomEvent("reckoning-profile-updated"));
  }, []);

  useEffect(() => {
    const onUpdate = () => setProfile(loadProfile());
    window.addEventListener("reckoning-profile-updated", onUpdate);
    return () => window.removeEventListener("reckoning-profile-updated", onUpdate);
  }, []);

  const value = useMemo(
    () => ({
      profile: mounted ? profile : loadProfile(),
      initials: initialsFromName(mounted ? profile.name : CITIZEN_USER.name),
      saveProfile,
      role: CITIZEN_USER.role,
      district: CITIZEN_USER.district,
      badge: CITIZEN_USER.badge,
      memberSince: CITIZEN_USER.memberSince,
      verified: CITIZEN_USER.verified,
    }),
    [profile, saveProfile, mounted],
  );

  return (
    <CitizenProfileContext.Provider value={value}>{children}</CitizenProfileContext.Provider>
  );
}

export function useCitizenProfile() {
  const ctx = useContext(CitizenProfileContext);
  if (!ctx) {
    throw new Error("useCitizenProfile must be used within CitizenProfileProvider");
  }
  return ctx;
}

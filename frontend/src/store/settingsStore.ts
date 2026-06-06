import { create } from "zustand";
import type { SettingsCategory } from "../components/settings/types";

interface SettingsState {
  activeCategory: SettingsCategory;
  setActiveCategory: (category: SettingsCategory) => void;

  // Account
  fullName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  address: string;
  district: string;
  subDistrict: string;
  state: string;
  country: string;

  // Notifications
  pushEnabled: boolean;
  roadHazardAlerts: boolean;
  nearbyIncidentAlerts: boolean;
  authorityUpdates: boolean;
  reportStatusUpdates: boolean;
  communityActivity: boolean;
  achievementAlerts: boolean;
  weeklySummary: boolean;
  monthlySummary: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;

  // Privacy & Security
  publicProfile: boolean;
  anonymousReporting: boolean;
  showLocation: boolean;
  allowMentions: boolean;
  twoFactorAuth: boolean;
  loginAlerts: boolean;

  // Language
  language: string;

  // Appearance
  theme: "light" | "dark" | "system";
  compactMode: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: "small" | "medium" | "large";

  // PWA
  offlineMode: boolean;
  backgroundSync: boolean;

  // Location
  autoDetectLocation: boolean;
  feedScope: "sub-district" | "district" | "state" | "national";
  locationAccuracy: "high" | "balanced" | "low";

  // Data & Storage
  autoSync: boolean;
  dataSaver: boolean;

  // Actions
  setField: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (val: boolean) => void;
  isSaving: boolean;
  setIsSaving: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  activeCategory: "account",
  setActiveCategory: (category) => set({ activeCategory: category }),

  // Account
  fullName: "Karan Sharma",
  email: "karan@example.com",
  phone: "+91 98765 43210",
  emergencyContact: "+91 91234 56789",
  address: "123, Main Street",
  district: "Pune",
  subDistrict: "Haveli",
  state: "Maharashtra",
  country: "India",

  // Notifications
  pushEnabled: true,
  roadHazardAlerts: true,
  nearbyIncidentAlerts: true,
  authorityUpdates: true,
  reportStatusUpdates: true,
  communityActivity: true,
  achievementAlerts: true,
  weeklySummary: false,
  monthlySummary: false,
  emailNotifications: true,
  smsNotifications: false,

  // Privacy
  publicProfile: true,
  anonymousReporting: false,
  showLocation: true,
  allowMentions: true,
  twoFactorAuth: false,
  loginAlerts: true,

  // Language
  language: "en",

  // Appearance
  theme: "system",
  compactMode: false,
  reducedMotion: false,
  highContrast: false,
  fontSize: "medium",

  // PWA
  offlineMode: false,
  backgroundSync: true,

  // Location
  autoDetectLocation: true,
  feedScope: "district",
  locationAccuracy: "balanced",

  // Data
  autoSync: true,
  dataSaver: false,

  // Actions
  setField: (key, value) =>
    set({ [key]: value, hasUnsavedChanges: true } as Partial<SettingsState>),
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),
  isSaving: false,
  setIsSaving: (val) => set({ isSaving: val }),
}));

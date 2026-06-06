import type React from "react";

export type SettingsCategory =
  | "account"
  | "notifications"
  | "privacy"
  | "language"
  | "appearance"
  | "pwa"
  | "location"
  | "data"
  | "support"
  | "abuse"
  | "logout";

export interface SettingsCategoryItem {
  id: SettingsCategory;
  label: string;
  description: string;
  icon: React.ElementType;
  danger?: boolean;
}

export interface SettingsSelectOption {
  value: string;
  label: string;
}

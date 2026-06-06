"use client";

import { SettingsSection } from "../SettingsSection";
import { SettingsToggle } from "../SettingsToggle";
import { useSettingsStore } from "../../../store/settingsStore";

export function NotificationsPanel() {
  const {
    pushEnabled,
    roadHazardAlerts,
    nearbyIncidentAlerts,
    authorityUpdates,
    reportStatusUpdates,
    communityActivity,
    achievementAlerts,
    weeklySummary,
    monthlySummary,
    emailNotifications,
    smsNotifications,
    setField,
  } = useSettingsStore();

  return (
    <div>
      <SettingsSection title="Channels" description="Choose how you receive updates.">
        <SettingsToggle
          label="Push Notifications"
          description="Instant alerts on your device"
          enabled={pushEnabled}
          onChange={(v) => setField("pushEnabled", v)}
        />
        <SettingsToggle
          label="Email Notifications"
          description="Summaries and important updates to your inbox"
          enabled={emailNotifications}
          onChange={(v) => setField("emailNotifications", v)}
        />
        <SettingsToggle
          label="SMS Notifications"
          description="Text messages for critical alerts only"
          enabled={smsNotifications}
          onChange={(v) => setField("smsNotifications", v)}
        />
      </SettingsSection>

      <SettingsSection title="Alert Types" description="What events trigger notifications.">
        <SettingsToggle
          label="Road Hazard Alerts"
          description="Active hazards in your area"
          enabled={roadHazardAlerts}
          onChange={(v) => setField("roadHazardAlerts", v)}
        />
        <SettingsToggle
          label="Nearby Incident Alerts"
          description="Incidents reported near your location"
          enabled={nearbyIncidentAlerts}
          onChange={(v) => setField("nearbyIncidentAlerts", v)}
        />
        <SettingsToggle
          label="Authority Updates"
          description="Government and authority responses"
          enabled={authorityUpdates}
          onChange={(v) => setField("authorityUpdates", v)}
        />
        <SettingsToggle
          label="Report Status Updates"
          description="Changes to your submitted reports"
          enabled={reportStatusUpdates}
          onChange={(v) => setField("reportStatusUpdates", v)}
        />
        <SettingsToggle
          label="Community Activity"
          description="Likes, comments, and mentions"
          enabled={communityActivity}
          onChange={(v) => setField("communityActivity", v)}
        />
        <SettingsToggle
          label="Achievement Alerts"
          description="Badges and milestones earned"
          enabled={achievementAlerts}
          onChange={(v) => setField("achievementAlerts", v)}
        />
      </SettingsSection>

      <SettingsSection title="Digests" description="Periodic summary reports.">
        <SettingsToggle
          label="Weekly Summary"
          description="Weekly roundup of activity in your area"
          enabled={weeklySummary}
          onChange={(v) => setField("weeklySummary", v)}
        />
        <SettingsToggle
          label="Monthly Summary"
          description="Monthly safety report and stats"
          enabled={monthlySummary}
          onChange={(v) => setField("monthlySummary", v)}
        />
      </SettingsSection>
    </div>
  );
}

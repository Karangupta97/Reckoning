"use client";

import { Suspense, useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/components/user/ThemeProvider";
import { useCitizenProfile } from "@/components/user/CitizenProfileProvider";
import type { CitizenProfile } from "@/components/user/CitizenProfileProvider";

type SettingsSection =
  | "account"
  | "notifications"
  | "appearance"
  | "privacy"
  | "language"
  | "data"
  | "about";

const NAV: { id: SettingsSection; label: string }[] = [
  { id: "account", label: "Account Info" },
  { id: "notifications", label: "Notifications" },
  { id: "appearance", label: "Appearance" },
  { id: "privacy", label: "Privacy & Security" },
  { id: "language", label: "Language" },
  { id: "data", label: "Data Management" },
  { id: "about", label: "About" },
];

function isSettingsSection(value: string | null): value is SettingsSection {
  return NAV.some((item) => item.id === value);
}

function SettingsIcon({ section }: { section: SettingsSection }) {
  const p = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  switch (section) {
    case "account":
      return (
        <svg {...p}>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "notifications":
      return (
        <svg {...p}>
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      );
    case "appearance":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.41 1.41M18.36 18.36l1.41 1.41M1 12h2M21 12h2" />
        </svg>
      );
    case "privacy":
      return (
        <svg {...p}>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      );
    case "language":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      );
    case "data":
      return (
        <svg {...p}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
}

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`rk-toggle ${on ? "on" : ""}`}
      aria-pressed={on}
      aria-label={label}
      onClick={onChange}
    />
  );
}

function ToggleRow({
  title,
  description,
  on,
  onChange,
}: {
  title: string;
  description: string;
  on: boolean;
  onChange: () => void;
}) {
  return (
    <div className="rk-settings-toggle-row">
      <div>
        <p className="rk-settings-toggle-label">{title}</p>
        <p className="rk-settings-toggle-desc">{description}</p>
      </div>
      <Toggle on={on} onChange={onChange} label={title} />
    </div>
  );
}

function SettingsPageContent() {
  const { theme, setTheme } = useTheme();
  const { profile, initials, saveProfile, verified, memberSince } = useCitizenProfile();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const section: SettingsSection = isSettingsSection(sectionParam) ? sectionParam : "account";
  const [draft, setDraft] = useState<CitizenProfile>(profile);
  const [saveMessage, setSaveMessage] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [emailReports, setEmailReports] = useState(true);
  const [emailStatus, setEmailStatus] = useState(true);
  const [emailBudget, setEmailBudget] = useState(false);
  const [emailCommunity, setEmailCommunity] = useState(true);

  const [pushReports, setPushReports] = useState(true);
  const [pushStatus, setPushStatus] = useState(true);
  const [pushEscalation, setPushEscalation] = useState(true);
  const [pushNews, setPushNews] = useState(false);

  const [publicProfile, setPublicProfile] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const unreadNotificationCount = useMemo(
    () =>
      [
        emailReports,
        emailStatus,
        emailBudget,
        emailCommunity,
        pushReports,
        pushStatus,
        pushEscalation,
        pushNews,
      ].filter(Boolean).length,
    [emailReports, emailStatus, emailBudget, emailCommunity, pushReports, pushStatus, pushEscalation, pushNews],
  );

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  useEffect(() => {
    if (section !== "account" && isEditingProfile) {
      setDraft(profile);
      setIsEditingProfile(false);
      setSaveMessage("");
    }
  }, [section, isEditingProfile, profile]);

  const updateDraft = useCallback(
    (field: keyof CitizenProfile, value: string) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleEditProfile = useCallback(() => {
    router.replace(`${pathname}?section=account`, { scroll: false });
    setIsEditingProfile(true);
  }, [pathname, router]);

  const handleCancelEdit = useCallback(() => {
    setDraft(profile);
    setIsEditingProfile(false);
    setSaveMessage("");
  }, [profile]);

  const handleSave = useCallback(() => {
    saveProfile(draft);
    setIsEditingProfile(false);
    setSaveMessage("Profile saved successfully");
    setTimeout(() => setSaveMessage(""), 3000);
  }, [draft, saveProfile]);

  const handleChangePhoto = useCallback(() => {
    photoInputRef.current?.click();
  }, []);

  const detailRef = useRef<HTMLDivElement>(null);

  const handleSectionChange = useCallback(
    (id: SettingsSection) => {
      router.replace(`${pathname}?section=${id}`, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    const detail = detailRef.current;
    if (!detail) return;

    if (window.matchMedia("(min-width: 1025px)").matches) {
      detail.scrollTop = 0;
      return;
    }

    detail.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [section]);

  return (
    <div className="rk-settings-page">
      <div className="rk-settings-body">
        <div className="rk-settings-sidebar">
          <div className="rk-settings-top">
            <nav className="rk-breadcrumb" aria-label="Breadcrumb">
              <Link href="/user/dashboard">Overview</Link>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span>Settings</span>
            </nav>

            <div className="rk-settings-hero">
              <div className="rk-settings-hero-user">
                <div className="rk-settings-hero-avatar">{initials}</div>
                <div className="rk-settings-hero-text">
                  <h1 className="rk-settings-hero-title">Settings</h1>
                  <p className="rk-settings-hero-name">{profile.name}</p>
                  <p className="rk-settings-hero-member">Member since {memberSince}</p>
                  <p className="rk-settings-hero-email">{profile.email}</p>
                  {section === "notifications" && (
                    <p className="rk-settings-hero-unread">
                      <span>{unreadNotificationCount}</span> unread notifications
                    </p>
                  )}
                </div>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="rk-settings-photo-input"
                aria-hidden
                tabIndex={-1}
                onChange={() => {
                  /* Photo upload can be wired to storage later */
                }}
              />
              <div className="rk-settings-hero-actions">
                {saveMessage ? (
                  <span className="rk-settings-save-msg" role="status">
                    {saveMessage}
                  </span>
                ) : null}
                {isEditingProfile ? (
                  <>
                    <button type="button" className="rk-btn rk-btn-primary" onClick={handleSave}>
                      Save Changes
                    </button>
                    <button type="button" className="rk-btn rk-btn-outline" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="rk-btn rk-btn-primary rk-settings-hero-btn"
                      onClick={handleEditProfile}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      className="rk-btn rk-btn-outline rk-settings-hero-btn"
                      onClick={handleChangePhoto}
                    >
                      Change Photo
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <nav className="rk-settings-nav-card" aria-label="Settings categories">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`rk-settings-nav-item ${section === item.id ? "active" : ""}`}
                aria-current={section === item.id ? "page" : undefined}
                onClick={() => handleSectionChange(item.id)}
              >
                <SettingsIcon section={item.id} />
                {item.label}
                <svg
                  className="rk-settings-nav-chevron"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </nav>

          <div className="rk-settings-aside-footer">
            <button type="button" className="rk-settings-logout-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log out
            </button>

            <div className="rk-settings-help-card">
              <div className="rk-settings-help-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <h3 className="rk-settings-help-title">Need help?</h3>
              <p className="rk-settings-help-text">
                Our civic support team responds within 24 hours for report and budget queries.
              </p>
              <button type="button" className="rk-btn rk-btn-primary rk-settings-help-cta">
                Contact Support
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="rk-settings-detail" ref={detailRef} id="rk-settings-detail">
          <p className="rk-settings-detail-label" aria-live="polite">
            {NAV.find((item) => item.id === section)?.label}
          </p>
          {section === "account" && (
            <div className={`rk-settings-card${isEditingProfile ? " rk-settings-card--editing" : ""}`}>
              <div className="rk-settings-card-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <h2 className="rk-settings-card-title">Account Information</h2>
              </div>

              <div className="rk-settings-profile-block">
                <div className="rk-settings-profile-avatar-lg">{initials}</div>
                <div className="rk-settings-profile-meta">
                  <h3>{isEditingProfile ? draft.name : profile.name}</h3>
                  <p className="rk-settings-profile-member">Member since {memberSince}</p>
                  <p>{isEditingProfile ? draft.email : profile.email}</p>
                </div>
              </div>

              <div className="rk-settings-field">
                <label htmlFor="settings-name">Full Name</label>
                <input
                  id="settings-name"
                  type="text"
                  value={draft.name}
                  readOnly={!isEditingProfile}
                  onChange={(e) => updateDraft("name", e.target.value)}
                />
              </div>
              <div className="rk-settings-field">
                <label htmlFor="settings-email">Email Address</label>
                <input
                  id="settings-email"
                  type="email"
                  value={draft.email}
                  readOnly={!isEditingProfile}
                  onChange={(e) => updateDraft("email", e.target.value)}
                />
              </div>
              <div className="rk-settings-field">
                <label htmlFor="settings-phone">Phone Number</label>
                <input
                  id="settings-phone"
                  type="tel"
                  value={draft.phone}
                  readOnly={!isEditingProfile}
                  onChange={(e) => updateDraft("phone", e.target.value)}
                />
              </div>
              <div className="rk-settings-field">
                <label htmlFor="settings-nationality">Nationality</label>
                <input
                  id="settings-nationality"
                  type="text"
                  value={draft.nationality}
                  readOnly
                />
              </div>
              <div className="rk-settings-field">
                <label htmlFor="settings-ward">Ward / District</label>
                <input
                  id="settings-ward"
                  type="text"
                  value={draft.ward}
                  readOnly={!isEditingProfile}
                  onChange={(e) => updateDraft("ward", e.target.value)}
                />
              </div>

              <div className="rk-settings-verified">
                {verified && (
                  <span className="rk-settings-verified-badge">Verified</span>
                )}
              </div>
            </div>
          )}

          {section === "notifications" && (
            <>
              <div className="rk-settings-card rk-settings-card--notifications">
                <div className="rk-settings-card-head">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <h2 className="rk-settings-card-title">Email Notifications</h2>
                </div>
                <ToggleRow
                  title="Report updates"
                  description="When your road defect reports change status"
                  on={emailReports}
                  onChange={() => setEmailReports((v) => !v)}
                />
                <ToggleRow
                  title="Status & SLA alerts"
                  description="Escalations and deadline reminders"
                  on={emailStatus}
                  onChange={() => setEmailStatus((v) => !v)}
                />
                <ToggleRow
                  title="Budget transparency"
                  description="Ward spending and anomaly publications"
                  on={emailBudget}
                  onChange={() => setEmailBudget((v) => !v)}
                />
                <ToggleRow
                  title="Community activity"
                  description="Updates from your ward and district"
                  on={emailCommunity}
                  onChange={() => setEmailCommunity((v) => !v)}
                />
              </div>

              <div className="rk-settings-card rk-settings-card--notifications">
                <div className="rk-settings-card-head">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                  <h2 className="rk-settings-card-title">Push Notifications</h2>
                </div>
                <ToggleRow
                  title="New report confirmations"
                  description="Instant ack when you submit a defect"
                  on={pushReports}
                  onChange={() => setPushReports((v) => !v)}
                />
                <ToggleRow
                  title="Resolution updates"
                  description="When repairs are verified by AI inspection"
                  on={pushStatus}
                  onChange={() => setPushStatus((v) => !v)}
                />
                <ToggleRow
                  title="Critical escalations"
                  description="High-severity incidents in your area"
                  on={pushEscalation}
                  onChange={() => setPushEscalation((v) => !v)}
                />
                <ToggleRow
                  title="Platform news"
                  description="Reckoning AI product and policy updates"
                  on={pushNews}
                  onChange={() => setPushNews((v) => !v)}
                />
              </div>
            </>
          )}

          {section === "appearance" && (
            <div className="rk-settings-card">
              <div className="rk-settings-card-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2" />
                </svg>
                <h2 className="rk-settings-card-title">Appearance</h2>
              </div>
              <p className="rk-settings-toggle-desc rk-appearance-intro">
                Synced with the top bar toggle. Pick a theme below.
              </p>

              <div className="rk-settings-theme-stack">
                <button
                  type="button"
                  className={`rk-settings-theme-block ${theme === "light" ? "active" : ""}`}
                  onClick={() => setTheme("light")}
                >
                  <div className="rk-settings-theme-block-preview light" />
                  <div className="rk-settings-theme-block-info">
                    <span className="rk-settings-theme-block-title">Light</span>
                    <span className="rk-settings-theme-block-desc">
                      Warm morning · cream surfaces and golden highlights
                    </span>
                  </div>
                  {theme === "light" && <span className="rk-settings-theme-check">Selected</span>}
                </button>

                <button
                  type="button"
                  className={`rk-settings-theme-block ${theme === "dark" ? "active" : ""}`}
                  onClick={() => setTheme("dark")}
                >
                  <div className="rk-settings-theme-block-preview dark" />
                  <div className="rk-settings-theme-block-info">
                    <span className="rk-settings-theme-block-title">Dark</span>
                    <span className="rk-settings-theme-block-desc">
                      Evening vibe · purple glow and glass panels
                    </span>
                  </div>
                  {theme === "dark" && <span className="rk-settings-theme-check">Selected</span>}
                </button>
              </div>
            </div>
          )}

          {section === "privacy" && (
            <div className="rk-settings-card">
              <div className="rk-settings-card-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <h2 className="rk-settings-card-title">Privacy & Security</h2>
              </div>
              <ToggleRow
                title="Public profile"
                description="Show contribution stats on community leaderboards"
                on={publicProfile}
                onChange={() => setPublicProfile((v) => !v)}
              />
              <ToggleRow
                title="Share location on reports"
                description="Attach GPS to uploads for faster routing"
                on={shareLocation}
                onChange={() => setShareLocation((v) => !v)}
              />
              <ToggleRow
                title="Two-factor authentication"
                description="Extra security for account sign-in"
                on={twoFactor}
                onChange={() => setTwoFactor((v) => !v)}
              />
              <div className="rk-settings-actions-row" style={{ marginTop: 20 }}>
                <button type="button" className="rk-btn rk-btn-outline">
                  View Privacy Policy
                </button>
                <button type="button" className="rk-btn rk-btn-outline">
                  Download my data
                </button>
              </div>
            </div>
          )}

          {section === "language" && (
            <div className="rk-settings-card">
              <div className="rk-settings-card-head">
                <SettingsIcon section="language" />
                <h2 className="rk-settings-card-title">Language</h2>
              </div>
              <div className="rk-settings-field">
                <label htmlFor="settings-lang">Display language</label>
                <select id="settings-lang" defaultValue="en-IN">
                  <option value="en-IN">English (India)</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                </select>
              </div>
            </div>
          )}

          {section === "data" && (
            <div className="rk-settings-card">
              <div className="rk-settings-card-head">
                <SettingsIcon section="data" />
                <h2 className="rk-settings-card-title">Data Management</h2>
              </div>
              <p className="rk-settings-toggle-desc" style={{ marginBottom: 16 }}>
                Manage your reports, uploads, and offline queue stored on this device.
              </p>
              <div className="rk-settings-actions-row">
                <button type="button" className="rk-btn rk-btn-outline">
                  Export all reports
                </button>
                <button type="button" className="rk-btn rk-btn-outline">
                  Clear offline queue
                </button>
              </div>
            </div>
          )}

          {section === "about" && (
            <div className="rk-settings-card">
              <div className="rk-settings-card-head">
                <SettingsIcon section="about" />
                <h2 className="rk-settings-card-title">About Reckoning AI</h2>
              </div>
              <p className="rk-settings-toggle-desc" style={{ marginBottom: 12 }}>
                AI-powered road defect reporting, complaint tracking, and budget transparency for
                civic accountability.
              </p>
              <p className="rk-text-muted rk-mono" style={{ fontSize: 12 }}>
                Version 1.0.0 · Pune Smart City Pilot
              </p>
              <div className="rk-settings-actions-row" style={{ marginTop: 20 }}>
                <button type="button" className="rk-btn rk-btn-outline">
                  Terms of Service
                </button>
                <button type="button" className="rk-btn rk-btn-outline">
                  Open source licenses
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="rk-settings-page" aria-busy="true" />}>
      <SettingsPageContent />
    </Suspense>
  );
}

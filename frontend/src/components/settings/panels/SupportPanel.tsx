"use client";

import {
  ExternalLink,
  MessageCircle,
  Bug,
  FileText,
  Lightbulb,
  HelpCircle,
  Scale,
  Shield,
  Code,
} from "lucide-react";
import { SettingsSection } from "../SettingsSection";

const HELP_LINKS = [
  { icon: HelpCircle, label: "Help Center", description: "Browse guides and tutorials", href: "#" },
  { icon: FileText, label: "FAQ", description: "Frequently asked questions", href: "#" },
  { icon: MessageCircle, label: "Contact Support", description: "Get help from our team", href: "#" },
];

const FEEDBACK_LINKS = [
  { icon: Bug, label: "Report a Bug", description: "Help us fix issues", href: "#" },
  { icon: Lightbulb, label: "Feature Request", description: "Suggest improvements", href: "#" },
];

const LEGAL_LINKS = [
  { icon: Scale, label: "Terms & Conditions", href: "#" },
  { icon: Shield, label: "Privacy Policy", href: "#" },
  { icon: Code, label: "Open Source Licenses", href: "#" },
];

export function SupportPanel() {
  return (
    <div>
      <SettingsSection title="Help" description="Get assistance with the app.">
        {HELP_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 py-3.5 group min-h-[52px]"
            >
              <span className="shrink-0 w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors">
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{item.label}</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">{item.description}</p>
              </div>
              <ExternalLink size={13} className="shrink-0 text-[var(--color-text-muted)]/60" />
            </a>
          );
        })}
      </SettingsSection>

      <SettingsSection title="Feedback" description="Help us improve Reckoning.">
        {FEEDBACK_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 py-3.5 group min-h-[52px]"
            >
              <span className="shrink-0 w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors">
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{item.label}</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">{item.description}</p>
              </div>
              <ExternalLink size={13} className="shrink-0 text-[var(--color-text-muted)]/60" />
            </a>
          );
        })}
      </SettingsSection>

      <SettingsSection title="Legal">
        {LEGAL_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 py-3.5 group min-h-[48px]"
            >
              <span className="shrink-0 w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors">
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <p className="flex-1 text-[13px] font-medium text-[var(--color-text-primary)]">{item.label}</p>
              <ExternalLink size={13} className="shrink-0 text-[var(--color-text-muted)]/60" />
            </a>
          );
        })}
      </SettingsSection>

      <SettingsSection title="About">
        <div className="py-3.5 space-y-2">
          {[
            { label: "App Version", value: "0.1.0" },
            { label: "Platform", value: "Progressive Web App" },
            { label: "Build", value: "2024.06.07" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1">
              <span className="text-[13px] text-[var(--color-text-secondary)]">{item.label}</span>
              <span className="text-[12px] text-[var(--color-text-muted)] font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}

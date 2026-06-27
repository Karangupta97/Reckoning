"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Copy, Check, Zap, ShieldCheck } from "lucide-react";

interface DemoCredential {
  role: string;
  jurisdiction: string;
  email: string;
  password: string;
}

const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    role: "District Admin",
    jurisdiction: "Chennai",
    email: "district.demo@reckoning.dev",
    password: "Demo@1234",
  },
  {
    role: "Sub-District Admin",
    jurisdiction: "Velachery Taluk",
    email: "subdistrict.demo@reckoning.dev",
    password: "Demo@1234",
  },
];

interface AdminDemoPanelProps {
  /** Called when user clicks "Login as [Role]" — fills and submits the form. */
  onQuickFill: (email: string, password: string) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API may be blocked in some contexts; fail silently
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors duration-150"
      style={{
        color: copied ? "var(--color-success)" : "var(--color-text-muted)",
      }}
      aria-label="Copy to clipboard"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export function AdminDemoPanel({ onQuickFill }: AdminDemoPanelProps) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;

  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      {/* Toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border transition-colors duration-150"
        style={{
          borderColor: "color-mix(in srgb, var(--color-text-muted) 30%, var(--color-border))",
          background: "color-mix(in srgb, var(--color-text-muted) 4%, var(--color-card))",
          color: "var(--color-text-secondary)",
        }}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={13} style={{ color: "var(--color-text-muted)" }} />
          <span className="text-xs font-medium">Demo Credentials</span>
          <span
            className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-full"
            style={{
              background: "color-mix(in srgb, var(--color-text-muted) 12%, transparent)",
              color: "var(--color-text-muted)",
            }}
          >
            DEMO
          </span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: "flex" }}
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      {/* Slide-down panel */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="mt-1.5 rounded-xl border divide-y"
              style={{
                borderColor: "color-mix(in srgb, var(--color-text-muted) 25%, var(--color-border))",
                background: "var(--color-card)",
                // divider color
                ["--tw-divide-opacity" as string]: "1",
              }}
            >
              {DEMO_CREDENTIALS.map((cred) => (
                <div key={cred.email} className="p-3.5">
                  {/* Role + jurisdiction */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {cred.role}
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {cred.jurisdiction}
                      </p>
                    </div>
                  </div>

                  {/* Email row */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="flex-1 text-[11px] font-mono truncate"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {cred.email}
                    </span>
                    <CopyButton text={cred.email} />
                  </div>

                  {/* Password row */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <span
                      className="flex-1 text-[11px] font-mono"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {cred.password}
                    </span>
                    <CopyButton text={cred.password} />
                  </div>

                  {/* Quick-fill button */}
                  <button
                    type="button"
                    onClick={() => onQuickFill(cred.email, cred.password)}
                    className="w-full h-8 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all duration-150 border"
                    style={{
                      borderColor: "color-mix(in srgb, teal 30%, var(--color-border))",
                      background:
                        "color-mix(in srgb, teal 8%, var(--color-card))",
                      color: "#0f766e", // teal-700
                    }}
                  >
                    <Zap size={11} />
                    Login as {cred.role}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

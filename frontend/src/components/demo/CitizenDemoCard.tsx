"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, User, Loader2 } from "lucide-react";

interface CitizenDemoCardProps {
  /** Called to fill the email field in the parent form. */
  onFillEmail: (email: string) => void;
  /** Called to trigger the OTP request + OTP auto-submit flow. */
  onDemoLogin: () => Promise<void>;
}

const DEMO_EMAIL = "demo@reckoning.dev";

export function CitizenDemoCard({ onFillEmail, onDemoLogin }: CitizenDemoCardProps) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    onFillEmail(DEMO_EMAIL);
    try {
      await onDemoLogin();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Demo login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mt-5"
    >
      <div
        className="rounded-xl border px-4 py-3.5"
        style={{
          borderColor: "color-mix(in srgb, var(--color-amber) 35%, var(--color-border))",
          background: "color-mix(in srgb, var(--color-amber) 6%, var(--color-card))",
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
              style={{
                background: "color-mix(in srgb, var(--color-amber) 18%, transparent)",
              }}
            >
              <User size={13} style={{ color: "var(--color-amber)" }} />
            </div>
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Demo Account
            </span>
          </div>
          <span
            className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
            style={{
              background: "color-mix(in srgb, var(--color-amber) 18%, transparent)",
              color: "var(--color-amber)",
            }}
          >
            DEMO
          </span>
        </div>

        {/* Email row */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs font-mono"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {DEMO_EMAIL}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: "color-mix(in srgb, var(--color-text-muted) 12%, transparent)",
              color: "var(--color-text-muted)",
            }}
          >
            OTP: 123456
          </span>
        </div>

        {/* Error */}
        {error !== null && (
          <p className="text-xs mb-2" style={{ color: "var(--color-danger)" }}>
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="btn-amber w-full h-9 flex items-center justify-center gap-2 text-xs disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Signing in as Demo…
            </>
          ) : (
            <>
              <Zap size={13} />
              Login as Demo Citizen
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

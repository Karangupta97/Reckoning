'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function LogoutPage() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoading || isDone) return;
    setIsLoading(true);

    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ allDevices: false }),
      });
    } catch {
      // Network error — clear local session regardless
    } finally {
      clearSession();
      setIsLoading(false);
      setIsDone(true);
      // Small delay so the success state is visible before redirect
      setTimeout(() => {
        router.replace('/login');
      }, 1500);
    }
  }, [isLoading, isDone, accessToken, clearSession, router]);

  const handleCancel = () => {
    router.back();
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--color-amber) 8%, var(--color-page)), var(--color-page))',
      }}
      aria-label="Logout confirmation"
    >
      {/* Subtle decorative ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{
            background:
              'radial-gradient(circle, var(--color-amber) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="w-full max-w-[400px]">
        <div
          className="neu-card-lg p-8"
          style={{
            /* Subtle glassmorphism on top of the neumorphic card */
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-heading"
          aria-describedby="logout-description"
        >
          {/* ── Logo ── */}
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/android-chrome-192x192.png"
              alt="Reckoning"
              width={44}
              height={44}
              className="rounded-xl mb-3"
              priority
            />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Reckoning
            </span>
          </div>

          {/* ── Icon ── */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  'color-mix(in srgb, var(--color-amber) 12%, var(--color-surface))',
                boxShadow:
                  'inset 2px 2px 5px color-mix(in srgb, var(--color-amber) 8%, transparent), inset -2px -2px 5px rgba(255,255,255,0.04)',
              }}
              aria-hidden="true"
            >
              {isDone ? (
                <ShieldCheck
                  size={36}
                  strokeWidth={1.5}
                  className="text-[var(--color-success)]"
                />
              ) : (
                <LogOut
                  size={36}
                  strokeWidth={1.5}
                  className="text-[var(--color-amber)]"
                />
              )}
            </div>
          </div>

          {/* ── Heading ── */}
          <div className="text-center mb-2">
            <h1
              id="logout-heading"
              className="text-xl font-semibold text-[var(--color-text-primary)]"
            >
              {isDone ? 'You\u2019ve been signed out' : 'Sign out of Reckoning?'}
            </h1>
          </div>

          {/* ── Description ── */}
          <p
            id="logout-description"
            className="text-sm text-[var(--color-text-secondary)] text-center mb-8 leading-relaxed"
          >
            {isDone ? (
              'Your session has been securely closed. Redirecting you to the login page…'
            ) : user?.fullName ? (
              <>
                You&apos;re signed in as{' '}
                <span className="font-medium text-[var(--color-text-primary)]">
                  {user.fullName}
                </span>
                . Signing out will end your current session on this device.
              </>
            ) : (
              'Signing out will end your current session on this device.'
            )}
          </p>

          {/* ── Actions ── */}
          {!isDone && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoading}
                aria-busy={isLoading}
                className="btn-amber w-full h-11 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    <span>Signing out…</span>
                  </>
                ) : (
                  <>
                    <LogOut size={16} aria-hidden="true" />
                    <span>Yes, sign me out</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="btn-outline w-full h-11 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                aria-label="Cancel and go back"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                <span>Cancel</span>
              </button>
            </div>
          )}

          {/* ── Success progress bar ── */}
          {isDone && (
            <div
              className="w-full h-1 rounded-full overflow-hidden"
              style={{ background: 'var(--color-surface)' }}
              role="progressbar"
              aria-label="Redirecting"
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full"
                style={{
                  background: 'var(--color-success)',
                  animation: 'progress-fill 1.5s ease-in-out forwards',
                }}
              />
            </div>
          )}

          {/* ── Secure session notice ── */}
          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <ShieldCheck size={12} aria-hidden="true" />
            Your session is protected with secure authentication
          </p>
        </div>

        {/* ── Footer ── */}
        <nav
          className="mt-6 flex items-center justify-center gap-4 text-xs text-[var(--color-text-muted)]"
          aria-label="Footer links"
        >
          <Link
            href="/privacy-policy"
            className="hover:text-[var(--color-text-secondary)] transition-colors focus-visible:outline-[var(--color-amber)] focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
          >
            Privacy Policy
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href="/terms"
            className="hover:text-[var(--color-text-secondary)] transition-colors focus-visible:outline-[var(--color-amber)] focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
          >
            Terms of Service
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href="/support"
            className="hover:text-[var(--color-text-secondary)] transition-colors focus-visible:outline-[var(--color-amber)] focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
          >
            Support
          </Link>
        </nav>
      </div>

      {/* ── progress-fill keyframe ── */}
      <style>{`
        @keyframes progress-fill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </main>
  );
}

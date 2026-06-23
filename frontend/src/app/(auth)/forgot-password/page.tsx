'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowLeft, CheckCircle, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const { forgotPassword, error, clearError, isLoading } = useAuth();
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch {
      // Error message is exposed from useAuth
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-page)] flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <div className="neu-card-lg p-6 sm:p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/android-chrome-192x192.png"
              alt="Reckoning"
              width={48}
              height={48}
              className="rounded-xl mb-3"
            />
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Reckoning</h1>
          </div>

          {!sent ? (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-6"
              >
                <ArrowLeft size={14} />
                Back to Login
              </Link>

              <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-text-primary)] mb-1">
                Forgot Password?
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-8">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) clearError();
                    }}
                    placeholder="you@example.com"
                    className="w-full h-11 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-amber)] transition-shadow"
                  />
                </div>

                {error && (
                  <p className="text-sm text-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] px-3 py-2 rounded-lg border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-amber w-full h-11 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {isLoading ? 'Sending...' : (
                    <>Send Reset Link <Send size={15} /></>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] flex items-center justify-center">
                <CheckCircle size={28} className="text-[var(--color-success)]" />
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
                Check Your Email
              </h2>

              <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                We&apos;ve sent a password reset link to
              </p>
              <p className="text-sm font-medium text-[var(--color-text-primary)] mb-6">
                {email}
              </p>

              <p className="text-xs text-[var(--color-text-muted)] mb-8">
                Didn&apos;t receive it? Check spam or try again.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setSent(false)}
                  className="btn-outline w-full h-11 flex items-center justify-center text-sm"
                >
                  Try Again
                </button>

                <Link
                  href="/login"
                  className="btn-amber w-full h-11 flex items-center justify-center text-sm"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}

        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
          Protected by secure authentication.
        </p>
      </div>
    </main>
  );
}

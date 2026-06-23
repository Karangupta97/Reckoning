'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const { resetPassword, error: apiError, clearError, isLoading } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    clearError();

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token || !email) {
      setError('Invalid reset link. Please check your email and try again.');
      return;
    }

    try {
      await resetPassword(email, token, password);
      setSuccess(true);
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

          {!success ? (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-text-primary)] text-center mb-1">
                Reset Password
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] text-center mb-8">
                Choose a new password. Must be at least 8 characters.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                        if (apiError) clearError();
                      }}
                      placeholder="Enter new password"
                      className="w-full h-11 px-4 pr-11 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-amber)] transition-shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError('');
                        if (apiError) clearError();
                      }}
                      placeholder="Confirm new password"
                      className="w-full h-11 px-4 pr-11 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-amber)] transition-shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {(error || apiError) && (
                  <p className="text-sm text-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] px-3 py-2 rounded-lg border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)]">
                    {error || apiError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-amber w-full h-11 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {isLoading ? 'Resetting...' : (
                    <>Reset Password <ArrowRight size={16} /></>
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
                Password Updated
              </h2>

              <p className="text-sm text-[var(--color-text-secondary)] mb-8">
                Your password has been reset. You can now sign in with your new password.
              </p>

              <Link
                href="/login"
                className="btn-amber w-full h-11 flex items-center justify-center gap-2 text-sm"
              >
                Sign In <ArrowRight size={16} />
              </Link>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[var(--color-page)] flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md text-center text-sm text-[var(--color-text-secondary)]">
          Loading reset password page...
        </div>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

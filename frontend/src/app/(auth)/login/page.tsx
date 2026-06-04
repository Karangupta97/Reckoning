'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      console.log('Login submitted');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-page)] flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <div className="neu-card-lg p-6 sm:p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-amber)] text-[#1C2B3A] flex items-center justify-center mb-3">
              <ShieldCheck size={22} strokeWidth={2} />
            </div>
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Reckoning</h1>
          </div>

          {/* Heading */}
          <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-text-primary)] text-center mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mb-8">
            Sign in to continue to your dashboard.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full h-11 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-amber)] transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[var(--color-text-secondary)] cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-[var(--color-border)] accent-[var(--color-amber)]" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-[var(--color-amber)] font-medium hover:underline">
                Forgot?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-amber w-full h-11 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {loading ? 'Signing in...' : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Don&apos;t have an account?
            </p>
            <Link
              href="/register"
              className="btn-outline mt-3 w-full h-11 flex items-center justify-center text-sm"
            >
              Create Account
            </Link>
          </div>

        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
          Protected by secure authentication.
        </p>
      </div>
    </main>
  );
}

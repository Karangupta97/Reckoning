'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      console.log('Register');
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
            <Image
              src="/android-chrome-192x192.png"
              alt="Reckoning"
              width={48}
              height={48}
              className="rounded-xl mb-3"
            />
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Reckoning</h1>
          </div>

          {/* Heading */}
          <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-text-primary)] text-center mb-1">
            Create Account
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mb-8">
            Join Reckoning and help improve your community.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Enter your name"
                className="w-full h-11 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-amber)] transition-shadow"
              />
            </div>

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
                  placeholder="Create password"
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
                  placeholder="Confirm password"
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

            <button
              type="submit"
              disabled={loading}
              className="btn-amber w-full h-11 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {loading ? 'Creating Account...' : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Already have an account?
            </p>
            <Link
              href="/login"
              className="btn-outline mt-3 w-full h-11 flex items-center justify-center text-sm"
            >
              Sign In
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

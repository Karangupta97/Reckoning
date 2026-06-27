'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CitizenDemoCard } from '@/components/demo/CitizenDemoCard';

const DEMO_EMAIL = 'demo@reckoning.dev';
const DEMO_PASSWORD = 'Demo@1234';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';
  const { login, error, isAuthenticated, hasHydrated, isLoading, validateCitizenSession } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Ref so demo handler can set fields and immediately submit without stale closure
  const emailRef = useRef(email);
  const passwordRef = useRef(password);
  emailRef.current = email;
  passwordRef.current = password;

  useEffect(() => {
    let cancelled = false;

    async function maybeRedirect() {
      if (!hasHydrated || !isAuthenticated) return;
      const valid = await validateCitizenSession();
      if (cancelled || !valid) return;
      router.replace('/dashboard');
    }

    void maybeRedirect();
    return () => { cancelled = true; };
  }, [hasHydrated, isAuthenticated, router, validateCitizenSession]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login(email.trim(), password, rememberMe);
      router.push(redirectTo);
    } catch {
      // error surfaced via useAuth
    }
  };

  /**
   * Demo login handler — fills email + password then calls the real login API.
   * The citizen demo account is pre-verified so no OTP step is needed.
   */
  const handleDemoLogin = async () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    // Use refs to get the just-set values synchronously
    await login(DEMO_EMAIL, DEMO_PASSWORD, false);
    router.push('/dashboard');
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="w-4 h-4 rounded border-[var(--color-border)] accent-[var(--color-amber)]"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-[var(--color-amber)] font-medium hover:underline">
                Forgot?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-amber w-full h-11 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>

            {error !== null ? <p className="text-sm text-red-500">{error}</p> : null}
          </form>

          {/* Demo Account Card */}
          <CitizenDemoCard
            onFillEmail={setEmail}
            onDemoLogin={handleDemoLogin}
          />

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

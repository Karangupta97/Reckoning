'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type RegisterStep = 'details' | 'otp';

function getPasswordError(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least one special character.';
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, resendOtp, verifyOtp, error, isLoading, clearError } = useAuth();
  const [step, setStep] = useState<RegisterStep>('details');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const canSubmitDetails =
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    !passwordError &&
    !confirmPasswordError &&
    !isLoading;

  useEffect(() => {
    if (step !== 'otp' || resendCooldown === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [step, resendCooldown]);

  useEffect(() => {
    setPasswordError(getPasswordError(password));

    if (confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      return;
    }

    setConfirmPasswordError(null);
  }, [confirmPassword, password]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (step === 'details') {
      const nextPasswordError = getPasswordError(password);
      if (nextPasswordError) {
        setPasswordError(nextPasswordError);
        return;
      }

      if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match.');
        return;
      }

      try {
        await register(name.trim(), email.trim(), password);
        setStep('otp');
        setOtp('');
        setResendCooldown(30);
        clearError();
      } catch {
        // Error message is exposed from useAuth.
      }
      return;
    }

    try {
      await verifyOtp(email.trim(), otp.trim());
      router.push('/dashboard');
    } catch {
      // Error message is exposed from useAuth.
    }
  };

  const handleResendOtp = async () => {
    try {
      await resendOtp(email.trim());
      setResendCooldown(30);
      clearError();
    } catch {
      // Error message is exposed from useAuth.
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
            {step === 'details' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
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
                      placeholder="Create password"
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
                  {passwordError ? (
                    <p className="mt-2 text-sm text-red-500">{passwordError}</p>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                      Use 8+ characters with at least one uppercase letter, one number, and one special character.
                    </p>
                  )}
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
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
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
                  {confirmPasswordError ? (
                    <p className="mt-2 text-sm text-red-500">{confirmPasswordError}</p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmitDetails}
                  className="btn-amber w-full h-11 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Creating Account...</>
                  ) : (
                    <>Create Account <ArrowRight size={16} /></>
                  )}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Enter the 6-digit code sent to {email || 'your email'}.
                </p>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full h-11 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-amber)] transition-shadow"
                    style={{ letterSpacing: '0.5em', textAlign: 'center' }}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading || resendCooldown > 0}
                    className="text-sm font-medium text-[var(--color-amber)] hover:underline disabled:opacity-60 disabled:no-underline"
                  >
                    {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-amber w-full h-11 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                  ) : (
                    <>Verify OTP <ArrowRight size={16} /></>
                  )}
                </button>
              </>
            )}

            {error ? <p className="text-sm text-red-500">{error}</p> : null}
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

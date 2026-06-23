'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Fingerprint, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password must not be empty"),
});

type LoginInputs = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, error: storeError, clearError } = useAdminAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [animationState, setAnimationState] = useState<'hidden' | 'visible' | 'shake'>('visible');
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Clear store errors when navigating to the page
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const onSubmit = async (data: LoginInputs) => {
    setLockoutSeconds(null);
    clearError();
    try {
      await login(data.email, data.password);
      
      const currentAdmin = useAdminAuthStore.getState().admin;
      if (currentAdmin) {
        if (currentAdmin.role === 'SUPER_ADMIN') {
          router.push('/admin/dashboard');
        } else if (currentAdmin.role === 'DISTRICT_ADMIN') {
          router.push('/admin/district');
        } else if (currentAdmin.role === 'SUB_DISTRICT_ADMIN') {
          router.push('/admin/sub-district');
        } else {
          router.push('/admin/login');
        }
      }
    } catch (err: any) {
      setAnimationState('shake');
      const responseData = err.response?.data;
      if (responseData?.error?.code === 'ACCOUNT_LOCKED') {
        const retryAfter = responseData.error.retryAfter || responseData.error.meta?.retryAfter;
        if (retryAfter) {
          setLockoutSeconds(Number(retryAfter));
        }
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, damping: 25, stiffness: 120 }
    },
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--color-page)] flex items-center justify-center px-4 py-8 font-sans transition-colors duration-300">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[var(--da-teal,#14b8a6)]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--color-amber)]/5 rounded-full blur-[150px] pointer-events-none" />
      
      <motion.div
        initial="hidden"
        animate={animationState}
        variants={cardVariants}
        onAnimationComplete={(definition) => {
          if (definition === 'shake') {
            setAnimationState('visible');
          }
        }}
        className="relative z-10 w-full max-w-[460px]"
      >
        <div className="neu-card-lg bg-[var(--color-card)] p-6 sm:p-8 shadow-neu-lg border-[var(--color-border)]">
          {/* Header */}
          <div className="flex flex-col items-center mb-7 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mb-4">
              <Fingerprint className="text-[var(--da-teal,#14b8a6)] w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
              RECKONING
            </h1>
            <p className="text-xs font-bold tracking-widest text-[var(--color-amber)] uppercase mt-1">
              Administrator Portal
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              Secure administrative access is required to proceed.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Lockout alert */}
            {lockoutSeconds !== null && lockoutSeconds > 0 ? (
              <div className="p-3.5 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)] rounded-xl flex items-start gap-2.5 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Too many failed attempts. Account locked. Try again in {Math.floor(lockoutSeconds / 60)}m {lockoutSeconds % 60}s.
                </span>
              </div>
            ) : storeError ? (
              <div className="p-3.5 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)] rounded-xl flex items-start gap-2.5 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{storeError}</span>
              </div>
            ) : null}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter admin email"
                {...register('email')}
                className="w-full h-12 px-4 rounded-xl bg-[var(--color-page)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--da-teal,#14b8a6)] transition-all"
              />
              {errors.email && (
                <p className="text-xs text-[var(--color-danger)] mt-1 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter account password"
                  {...register('password')}
                  className="w-full h-12 px-4 pr-12 rounded-xl bg-[var(--color-page)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--da-teal,#14b8a6)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[var(--color-danger)] mt-1 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || (lockoutSeconds !== null && lockoutSeconds > 0)}
              className="w-full h-12 rounded-xl bg-[var(--da-teal,#14b8a6)] text-white font-semibold transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-[var(--da-teal,#14b8a6)]/10 mt-6"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Secure indicator footer */}
          <div className="mt-8 text-center border-t border-[var(--color-border)] pt-4">
            <p className="text-[11px] text-[var(--color-text-muted)] tracking-wide font-medium">
              Protected by Enterprise-grade Security protocols
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
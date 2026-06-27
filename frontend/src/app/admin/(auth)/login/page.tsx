'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, ShieldAlert, Lock, Mail } from 'lucide-react';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { AdminDemoPanel } from '@/components/demo/AdminDemoPanel';

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
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

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
    } catch (err: unknown) {
      setAnimationState('shake');
      const responseData = (err as { response?: { data?: { error?: { code?: string; retryAfter?: number; meta?: { retryAfter?: number } } } } })?.response?.data;
      if (responseData?.error?.code === 'ACCOUNT_LOCKED') {
        const retryAfter = responseData.error.retryAfter ?? responseData.error.meta?.retryAfter;
        if (retryAfter !== undefined) {
          setLockoutSeconds(Number(retryAfter));
        }
      }
    }
  };

  /**
   * Quick-fill + submit for demo credentials — called from AdminDemoPanel.
   */
  const handleQuickFill = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    // Trigger form submit programmatically on next tick so RHF state settles
    setTimeout(() => {
      void handleSubmit(onSubmit)();
    }, 0);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring' as const, damping: 28, stiffness: 100 },
    },
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="admin-login-page relative min-h-screen flex items-center justify-center px-4 py-8 font-sans overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-teal-100/60 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[450px] h-[450px] bg-blue-100/40 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-indigo-50/50 rounded-full blur-[80px]" />
      </div>

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <motion.div
        initial="hidden"
        animate={animationState}
        variants={cardVariants}
        onAnimationComplete={(definition) => {
          if (definition === 'shake') setAnimationState('visible');
        }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="relative bg-white rounded-2xl border border-gray-200/80 p-8 sm:p-10 shadow-xl shadow-gray-200/50">
          {/* Top accent line */}
          <div className="absolute top-0 left-8 right-8 h-[2px] rounded-full bg-gradient-to-r from-transparent via-teal-500 to-transparent" />

          {/* Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="relative mb-5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-200">
                <Shield className="text-white w-7 h-7" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-[2.5px] border-white shadow-sm" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Portal</h1>
            <p className="text-sm text-gray-500 mt-2">Sign in to access the admin dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Lockout / error alert */}
            {lockoutSeconds !== null && lockoutSeconds > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-start gap-2.5 text-xs font-medium"
              >
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Too many failed attempts. Account locked. Try again in{' '}
                  {Math.floor(lockoutSeconds / 60)}m {lockoutSeconds % 60}s.
                </span>
              </motion.div>
            ) : storeError ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-start gap-2.5 text-xs font-medium"
              >
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{storeError}</span>
              </motion.div>
            ) : null}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 ml-1">Email</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail
                    className={`w-4 h-4 transition-colors duration-200 ${
                      focusedField === 'email' ? 'text-teal-500' : 'text-gray-400'
                    }`}
                  />
                </div>
                <input
                  type="email"
                  placeholder="admin@reckoning.app"
                  {...register('email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="admin-login-input w-full h-12 pl-11 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 ml-1">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock
                    className={`w-4 h-4 transition-colors duration-200 ${
                      focusedField === 'password' ? 'text-teal-500' : 'text-gray-400'
                    }`}
                  />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="admin-login-input w-full h-12 pl-11 pr-12 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || (lockoutSeconds !== null && lockoutSeconds > 0)}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold transition-all duration-200 hover:from-teal-600 hover:to-teal-700 hover:shadow-lg hover:shadow-teal-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Demo Credentials Panel */}
          <AdminDemoPanel onQuickFill={handleQuickFill} />

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[11px] text-gray-400 font-medium">
                Secured with enterprise-grade encryption
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .admin-login-page *:focus-visible {
          outline: none;
        }
        .admin-login-input:focus-visible {
          outline: none;
        }
      `}</style>
    </div>
  );
}

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { KeyRound, Eye, EyeOff, Check, X, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const acceptInviteSchema = z
  .object({
    password: z
      .string()
      .min(12, "Password must be at least 12 characters long")
      .regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter")
      .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
      .regex(/(?=.*\d)/, "Password must contain at least one number")
      .regex(/(?=.*[@$!%*?&_\-#^()\-+=])/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type AcceptInviteInputs = z.infer<typeof acceptInviteSchema>;

function AcceptInviteFormInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteInputs>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: AcceptInviteInputs) => {
    setApiError(null);
    if (!token) {
      setApiError("Invitation token is missing from URL.");
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/invitations/accept`,
        {
          token,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }
      );

      if (response.data?.success) {
        setIsSuccess(true);
      } else {
        setApiError("Failed to accept invitation.");
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error?.message || "An error occurred while accepting the invitation.";
      setApiError(errMsg);
    }
  };

  const hasMinLength = passwordValue.length >= 12;
  const hasLowercase = /(?=.*[a-z])/.test(passwordValue);
  const hasUppercase = /(?=.*[A-Z])/.test(passwordValue);
  const hasNumber = /(?=.*\d)/.test(passwordValue);
  const hasSpecial = /(?=.*[@$!%*?&_\-#^()\-+=])/.test(passwordValue);

  return (
    <div className="relative min-h-screen bg-[var(--color-page)] flex items-center justify-center px-4 py-8 font-sans transition-colors duration-300">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[var(--da-teal,#14b8a6)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[var(--color-amber)]/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="neu-card-lg bg-[var(--color-card)] p-6 sm:p-8 shadow-neu-lg border-[var(--color-border)]">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mb-4">
              <KeyRound className="text-[var(--da-teal,#14b8a6)] w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Accept Invitation
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Securely configure your administrative credentials
            </p>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-12 h-12 bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Account Activated Successfully!
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2 mb-6">
                Your password is set and active. You can now access the admin panel.
              </p>
              <button
                onClick={() => router.push('/admin/login')}
                className="w-full h-11 rounded-xl bg-[var(--da-teal,#14b8a6)] text-white font-semibold transition-all duration-200 hover:brightness-105 active:scale-[0.98] shadow-md shadow-[var(--da-teal,#14b8a6)]/10"
              >
                Go to Sign In
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {apiError && (
                <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)] rounded-xl flex items-start gap-2.5 text-xs">
                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Set administrative password"
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
                  <p className="text-xs text-[var(--color-danger)] mt-1.5 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Verify administrative password"
                    {...register('confirmPassword')}
                    className="w-full h-12 px-4 pr-12 rounded-xl bg-[var(--color-page)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--da-teal,#14b8a6)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-[var(--color-danger)] mt-1.5 font-medium">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Password Checklist UI */}
              <div className="p-4 bg-[var(--color-page)] rounded-xl border border-[var(--color-border)] space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
                  Password Strength Requirements
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium text-[var(--color-text-secondary)]">
                  <div className="flex items-center gap-1.5">
                    {hasMinLength ? (
                      <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    )}
                    <span className={hasMinLength ? 'text-[var(--color-text-primary)]' : ''}>Min 12 characters</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasLowercase ? (
                      <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    )}
                    <span className={hasLowercase ? 'text-[var(--color-text-primary)]' : ''}>At least 1 lowercase</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasUppercase ? (
                      <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    )}
                    <span className={hasUppercase ? 'text-[var(--color-text-primary)]' : ''}>At least 1 uppercase</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasNumber ? (
                      <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    )}
                    <span className={hasNumber ? 'text-[var(--color-text-primary)]' : ''}>At least 1 digit</span>
                  </div>

                  <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
                    {hasSpecial ? (
                      <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    )}
                    <span className={hasSpecial ? 'text-[var(--color-text-primary)]' : ''}>At least 1 special char (@$!%*?&_ etc.)</span>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[var(--da-teal,#14b8a6)] text-white font-semibold transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-[var(--da-teal,#14b8a6)]/10"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <span>Activate Account</span>
                )}
              </button>
            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-page)] text-[var(--color-text-primary)]">
        <div className="w-12 h-12 border-4 border-[var(--da-teal,#14b8a6)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AcceptInviteFormInner />
    </Suspense>
  );
}

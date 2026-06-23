'use client';

import React, { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { useRouter } from 'next/navigation';
import { AdminRole } from '@/types/admin';

interface AdminGuardProps {
  allowedRoles: AdminRole[];
  children: React.ReactNode;
}

export function AdminGuard({ allowedRoles, children }: AdminGuardProps) {
  const { admin, accessToken, isLoading: storeLoading } = useAdminAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || storeLoading) return;

    if (!admin || !accessToken) {
      router.replace('/admin/login');
      return;
    }

    if (!allowedRoles.includes(admin.role)) {
      // Role is insufficient, silently redirect to their appropriate role-based dashboard
      if (admin.role === 'SUPER_ADMIN') {
        router.replace('/admin/dashboard');
      } else if (admin.role === 'DISTRICT_ADMIN') {
        router.replace('/admin/district');
      } else if (admin.role === 'SUB_DISTRICT_ADMIN') {
        router.replace('/admin/sub-district');
      } else {
        router.replace('/admin/login');
      }
      return;
    }

    setCheckingAuth(false);
  }, [admin, accessToken, storeLoading, allowedRoles, router, mounted]);

  if (!mounted || storeLoading || checkingAuth) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-page)] text-[var(--color-text-primary)] font-sans">
        <div className="w-12 h-12 border-4 border-[var(--da-teal,#14b8a6)] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium tracking-wide opacity-80">
          Verifying administrative credentials...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export function withAdminGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: AdminRole[]
) {
  return function GuardedComponent(props: P) {
    return (
      <AdminGuard allowedRoles={allowedRoles}>
        <Component {...props} />
      </AdminGuard>
    );
  };
}

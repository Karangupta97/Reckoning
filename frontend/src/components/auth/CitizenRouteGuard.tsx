"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";

type CitizenRouteGuardProps = {
  children: React.ReactNode;
};

export function CitizenRouteGuard({ children }: CitizenRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    hasHydrated,
    isAuthenticated,
    validateCitizenSession,
  } = useAuth();

  const [canRender, setCanRender] = useState(false);

  const loginPath = useMemo(() => {
    const redirect = encodeURIComponent(pathname || "/dashboard");
    return `/login?redirect=${redirect}`;
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function guard() {
      if (!hasHydrated) {
        return;
      }

      if (!isAuthenticated) {
        router.replace(loginPath);
        return;
      }

      const valid = await validateCitizenSession();
      if (cancelled) {
        return;
      }

      if (!valid) {
        router.replace(loginPath);
        return;
      }

      setCanRender(true);
    }

    void guard();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, isAuthenticated, loginPath, router, validateCitizenSession]);

  if (!canRender) {
    return (
      <div className="min-h-screen bg-[var(--color-page)] flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}

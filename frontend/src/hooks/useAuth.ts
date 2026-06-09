"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Minimal auth hook used by citizen-facing components.
 *
 * Provides a `logout` function that attempts to call the backend logout
 * endpoint (best-effort) and then redirects to the sign-in page.
 */
export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allDevices: false }),
        },
      );
    } catch {
      // Network error — still proceed to redirect
    } finally {
      setIsLoading(false);
      router.push("/");
    }
  }, [router]);

  return { logout, isLoading };
}

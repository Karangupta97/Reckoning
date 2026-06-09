"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type ApiErrorShape = {
  error?: {
    message?: string;
  };
  message?: string;
  data?: {
    message?: string;
  };
};

type LoginResponse = {
  success?: boolean;
  data?: AuthSession;
} & Partial<AuthSession>;

type RegistrationResponse = {
  message?: string;
  expiresInMinutes?: number;
  data?: {
    message?: string;
    expiresInMinutes?: number;
  };
};

type CurrentUserResponse = {
  success?: boolean;
  data?: {
    user?: AuthUser;
  };
  user?: AuthUser;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const DEFAULT_COUNTRY = "INDIA";

function authUrl(path: string): string {
  return `${API_BASE_URL}/api/auth${path}`;
}

async function readResponseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

function extractMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const data = payload as ApiErrorShape;
  return data.error?.message ?? data.message ?? data.data?.message ?? fallback;
}

function isAuthSession(payload: unknown): payload is AuthSession {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<AuthSession>;
  return (
    typeof candidate.accessToken === "string" &&
    typeof candidate.refreshToken === "string" &&
    typeof candidate.user === "object" &&
    candidate.user !== null
  );
}

function unwrapLoginSession(payload: unknown): AuthSession | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as LoginResponse;
  if (data.data && isAuthSession(data.data)) {
    return data.data;
  }

  if (isAuthSession(data)) {
    return data;
  }

  return null;
}

function unwrapRegistrationResponse(payload: unknown): RegistrationResponse | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as RegistrationResponse;
  if (typeof data.message === "string" || typeof data.expiresInMinutes === "number") {
    return data;
  }

  if (data.data) {
    return data.data;
  }

  return null;
}

function unwrapCurrentUser(payload: unknown): AuthUser | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as CurrentUserResponse;
  if (data.data?.user) {
    return data.data.user;
  }

  if (data.user) {
    return data.user;
  }

  return null;
}

/**
 * Shared auth hook used by citizen-facing components.
 *
 * Wraps the backend auth endpoints and keeps the current session in the
 * persisted auth store so pages can redirect when a valid session already
 * exists.
 */
export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const isAuthenticated = Boolean(accessToken && refreshToken);

  const runRequest = useCallback(async <T,>(request: () => Promise<Response>, fallbackMessage: string): Promise<T> => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await request();
      const payload = await readResponseJson(response);

      if (!response.ok) {
        throw new Error(extractMessage(payload, fallbackMessage));
      }

      return payload as T;
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : fallbackMessage;
      setError(message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    void rememberMe;

    const payload = await runRequest<LoginResponse>(
      () =>
        fetch(authUrl("/login"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            deviceInfo: {
              userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
              platform: typeof navigator !== "undefined" ? navigator.platform : undefined,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          }),
        }),
      "Unable to sign in. Please try again.",
    );

    const session = unwrapLoginSession(payload);

    if (!session) {
      throw new Error("Unable to sign in. Please try again.");
    }

    setSession(session);
    return session;
  }, [runRequest, setSession]);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const payload = await runRequest<RegistrationResponse>(
      () =>
        fetch(authUrl("/register"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            email,
            password,
            country: DEFAULT_COUNTRY,
          }),
        }),
      "Unable to create your account. Please try again.",
    );

    const response = unwrapRegistrationResponse(payload);

    return response ?? { message: "OTP sent to email", expiresInMinutes: 0 };
  }, [runRequest]);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    const payload = await runRequest<{ data?: AuthSession } & Partial<AuthSession>>(
      () =>
        fetch(authUrl("/verify-otp"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        }),
      "Unable to verify the code. Please try again.",
    );

    const session = isAuthSession(payload.data) ? payload.data : isAuthSession(payload) ? payload : null;

    if (!session) {
      throw new Error("Unable to verify the code. Please try again.");
    }

    setSession(session);
    return session;
  }, [runRequest, setSession]);

  const resendOtp = useCallback(async (email: string) => {
    const payload = await runRequest<RegistrationResponse>(
      () =>
        fetch(authUrl("/resend-otp"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }),
      "Unable to resend the code. Please try again.",
    );

    const response = unwrapRegistrationResponse(payload);

    return response ?? { message: "OTP sent to email", expiresInMinutes: 0 };
  }, [runRequest]);

  const validateCitizenSession = useCallback(async (): Promise<boolean> => {
    if (!accessToken) {
      clearSession();
      return false;
    }

    setIsLoading(true);

    try {
      const response = await fetch(authUrl("/me"), {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = await readResponseJson(response);

      if (!response.ok) {
        clearSession();
        return false;
      }

      const currentUser = unwrapCurrentUser(payload);
      if (!currentUser || currentUser.role !== "CITIZEN") {
        clearSession();
        return false;
      }

      setUser(currentUser);
      return true;
    } catch {
      clearSession();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, clearSession, setUser]);

  const logout = useCallback(() => {
    // Navigate to the dedicated logout confirmation page.
    // The page handles the API call, session clearing, and redirect.
    router.push("/logout");
  }, [router]);

  return {
    login,
    logout,
    register,
    resendOtp,
    verifyOtp,
    isAuthenticated,
    hasHydrated,
    user,
    validateCitizenSession,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

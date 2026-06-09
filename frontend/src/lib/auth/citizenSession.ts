import { useAuthStore, type AuthUser } from "@/stores/authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export type CitizenAuthSession = {
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
  data?: CitizenAuthSession;
} & Partial<CitizenAuthSession>;

function mergeHeaders(baseHeaders: HeadersInit | undefined, accessToken: string | null): Headers {
  const headers = new Headers(baseHeaders);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    headers.delete("Authorization");
  }

  return headers;
}

export function authUrl(path: string): string {
  return `${API_BASE_URL}/api/auth${path}`;
}

export async function readResponseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

export function extractMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const data = payload as ApiErrorShape;
  return data.error?.message ?? data.message ?? data.data?.message ?? fallback;
}

export function isAuthSession(payload: unknown): payload is CitizenAuthSession {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<CitizenAuthSession>;
  return (
    typeof candidate.accessToken === "string" &&
    typeof candidate.refreshToken === "string" &&
    typeof candidate.user === "object" &&
    candidate.user !== null
  );
}

export function unwrapLoginSession(payload: unknown): CitizenAuthSession | null {
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

export async function refreshCitizenSession(): Promise<CitizenAuthSession | null> {
  const { refreshToken } = useAuthStore.getState();

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(authUrl("/refresh"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = await readResponseJson(response);
  if (!response.ok) {
    return null;
  }

  const session = unwrapLoginSession(payload);
  if (!session) {
    return null;
  }

  useAuthStore.getState().setSession(session);
  return session;
}

export async function fetchCitizenAuth(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const { accessToken } = useAuthStore.getState();

  const execute = (token: string | null) =>
    fetch(input, {
      ...init,
      credentials: "include",
      headers: mergeHeaders(init.headers, token),
    });

  let response = await execute(accessToken);

  if (response.status !== 401) {
    return response;
  }

  const refreshedSession = await refreshCitizenSession();
  if (!refreshedSession) {
    return response;
  }

  response = await execute(refreshedSession.accessToken);
  return response;
}
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AdminUser, AdminAuthResponse, AdminApiError } from "@/types/admin";
import axios from "axios";

interface AdminAuthState {
  admin: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AdminAuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
  setAdmin: (admin: AdminUser) => void;
}

type AdminAuthStore = AdminAuthState & AdminAuthActions;

function mapBackendError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { success?: boolean; error?: AdminApiError };
    if (data.error) {
      const code = data.error.code;
      const retryAfter = data.error.retryAfter || (data.error as any).meta?.retryAfter;
      if (code === "INVALID_CREDENTIALS") {
        return "Invalid email or password.";
      }
      if (code === "ACCOUNT_DISABLED") {
        return "This account has been disabled. Contact your administrator.";
      }
      if (code === "ACCOUNT_LOCKED") {
        if (retryAfter !== undefined) {
          const minutes = Math.ceil(retryAfter / 60);
          return `Too many failed attempts. Account locked. Try again in ${minutes} minutes.`;
        }
        return "Too many failed attempts. Account locked. Try again in X minutes.";
      }
      return data.error.message || "An unknown error occurred.";
    }
  }
  return (error as Error).message || "An unknown error occurred.";
}

export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set) => ({
      admin: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await axios.post<{ success: boolean; data: AdminAuthResponse }>(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/login`,
            { email, password }
          );
          if (res.data?.success && res.data?.data) {
            const { admin, accessToken, refreshToken } = res.data.data;
            set({ admin, accessToken, refreshToken, isLoading: false });
          } else {
            throw new Error("Invalid response format from server.");
          }
        } catch (error) {
          const errorMsg = mapBackendError(error);
          set({ error: errorMsg, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        const { refreshToken, accessToken } = useAdminAuthStore.getState();
        try {
          if (refreshToken) {
            const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
            await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/logout`,
              { refreshToken },
              { headers }
            );
          }
        } catch (error) {
          console.error("Logout request failed:", error);
        } finally {
          set({
            admin: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = useAdminAuthStore.getState();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        set({ isLoading: true, error: null });
        try {
          const res = await axios.post<{ success: boolean; data: AdminAuthResponse }>(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/refresh`,
            { refreshToken }
          );
          if (res.data?.success && res.data?.data) {
            const { admin, accessToken, refreshToken: newRefreshToken } = res.data.data;
            set({ admin, accessToken, refreshToken: newRefreshToken, isLoading: false });
          } else {
            throw new Error("Invalid response format from server during token refresh.");
          }
        } catch (error) {
          const errorMsg = mapBackendError(error);
          set({ error: errorMsg, isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      setAdmin: (admin) => set((state) => ({ admin: { ...state.admin, ...admin } })),
    }),
    {
      name: "reckoning-admin-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        admin: state.admin,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

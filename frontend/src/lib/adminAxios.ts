import axios from "axios";
import { useAdminAuthStore } from "@/stores/adminAuthStore";

export const adminAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

adminAxios.interceptors.request.use(
  (config) => {
    const accessToken = useAdminAuthStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

adminAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if the error response is 401 and we haven't already retried this request
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt silent token refresh
        await useAdminAuthStore.getState().refreshAccessToken();
        
        const newAccessToken = useAdminAuthStore.getState().accessToken;
        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        // Retry the original request with the new access token
        return adminAxios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out the admin and redirect to /admin/login
        await useAdminAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/admin/login";
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

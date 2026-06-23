import axios from "axios";
import { useAdminAuthStore } from "@/stores/adminAuthStore";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: true,
});

api.interceptors.request.use(
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

// Response interceptor — reject 401 errors without hard redirect.
// Auth layouts handle redirection to avoid race conditions and infinite loops.
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    return Promise.reject(error);
  }
);

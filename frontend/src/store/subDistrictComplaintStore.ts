/**
 * subDistrictComplaintStore.ts
 *
 * Zustand store for the sub-district admin complaints dashboard.
 * Fetches from GET /api/admin/subdistrict/complaints and supports status
 * update via PATCH /api/admin/subdistrict/complaints/:id/status.
 *
 * Uses adminAxios so Bearer token is attached automatically.
 */

import { create } from "zustand";
import { adminAxios } from "@/lib/adminAxios";

// ---------------------------------------------------------------------------
// Types (mirror backend SubDistrictComplaintItem)
// ---------------------------------------------------------------------------

export type ApiComplaintStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED"
  | "ESCALATED";

export type ApiSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AiResultView {
  annotatedImageUrl: string | null;
  confidence: number | null;
  suggestedCategory: string | null;
  suggestedSeverity: string | null;
}

export interface ApiComplaint {
  id: string;
  title: string | null;
  description: string | null;
  status: ApiComplaintStatus;
  severity: ApiSeverity;
  riskScore: number | null;
  latitude: number;
  longitude: number;
  mediaUrls: string[];
  createdAt: string; // ISO string from JSON
  citizenName: string;
  aiResult: AiResultView | null;
}

export interface SubDistrictComplaintFilters {
  status?: ApiComplaintStatus;
  sortBy?: "createdAt" | "severity";
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface SubDistrictComplaintState {
  complaints: ApiComplaint[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
  filters: SubDistrictComplaintFilters;

  // Actions
  setFilters: (f: Partial<SubDistrictComplaintFilters>) => void;
  fetchComplaints: (f?: Partial<SubDistrictComplaintFilters>) => Promise<void>;
  updateComplaintStatus: (
    id: string,
    status: ApiComplaintStatus
  ) => Promise<void>;
}

export const useSubDistrictComplaintStore = create<SubDistrictComplaintState>(
  (set, get) => ({
    complaints: [],
    total: 0,
    page: 1,
    limit: 20,
    isLoading: false,
    error: null,
    filters: {},

    setFilters: (f) => {
      set((s) => ({ filters: { ...s.filters, ...f } }));
    },

    fetchComplaints: async (overrides) => {
      set({ isLoading: true, error: null });
      try {
        const filters = { ...get().filters, ...overrides };
        const params: Record<string, string> = {};
        if (filters.status) params.status = filters.status;
        if (filters.sortBy) params.sortBy = filters.sortBy;
        if (filters.page) params.page = String(filters.page);
        if (filters.limit) params.limit = String(filters.limit);

        const res = await adminAxios.get<{
          success: boolean;
          data: {
            complaints: ApiComplaint[];
            total: number;
            page: number;
            limit: number;
          };
        }>("/api/admin/subdistrict/complaints", { params });

        const { complaints, total, page, limit } = res.data.data;
        set({ complaints, total, page, limit, isLoading: false });
      } catch (err: any) {
        let msg = "Failed to load complaints.";
        if (err?.response?.status === 403) {
          msg = "Your account is not assigned to a jurisdiction. Contact your District Admin.";
        } else if (err instanceof Error) {
          msg = err.message;
        }
        set({ isLoading: false, error: msg });
      }
    },

    updateComplaintStatus: async (id, status) => {
      try {
        const res = await adminAxios.patch<{
          success: boolean;
          data: ApiComplaint;
        }>(`/api/admin/subdistrict/complaints/${id}/status`, { status });

        const updated = res.data.data;
        set((s) => ({
          complaints: s.complaints.map((c) => (c.id === id ? updated : c)),
        }));
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to update status.";
        set({ error: msg });
        throw err; // let the page surface the error
      }
    },
  })
);

import { create } from "zustand";

export type HazardType =
  | "pothole"
  | "flooding"
  | "fallenTree"
  | "roadDebris"
  | "brokenSignal"
  | "other";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export type TrafficImpact = "none" | "minor" | "moderate" | "severe";

export type SafetyRisk = "low" | "medium" | "high" | "critical";

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  preview?: string;
  status: "uploading" | "complete" | "error";
}

export interface ReportFormData {
  // Step 1: Hazard Information
  hazardType: HazardType | "";
  severity: SeverityLevel | "";
  title: string;
  description: string;

  // Step 2: Location Information
  latitude: number | null;
  longitude: number | null;
  address: string;
  road: string;
  landmark: string;
  locationMethod: "auto" | "manual";

  // Step 3: Evidence
  files: UploadFile[];

  // Step 4: Additional Details
  incidentDate: string;
  incidentTime: string;
  trafficImpact: TrafficImpact | "";
  safetyRisk: SafetyRisk | "";
  isAnonymous: boolean;
}

export type ReportStep = 1 | 2 | 3 | 4 | 5;

interface ReportState {
  currentStep: ReportStep;
  formData: ReportFormData;
  isSubmitting: boolean;
  isSubmitted: boolean;
  draftSaved: boolean;

  setStep: (step: ReportStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateForm: (data: Partial<ReportFormData>) => void;
  addFile: (file: UploadFile) => void;
  removeFile: (id: string) => void;
  updateFileProgress: (id: string, progress: number) => void;
  updateFileStatus: (id: string, status: UploadFile["status"]) => void;
  setSubmitting: (v: boolean) => void;
  setSubmitted: (v: boolean) => void;
  setDraftSaved: (v: boolean) => void;
  resetForm: () => void;
}

const initialFormData: ReportFormData = {
  hazardType: "",
  severity: "",
  title: "",
  description: "",
  latitude: null,
  longitude: null,
  address: "",
  road: "",
  landmark: "",
  locationMethod: "auto",
  files: [],
  incidentDate: "",
  incidentTime: "",
  trafficImpact: "",
  safetyRisk: "",
  isAnonymous: false,
};

export const useReportStore = create<ReportState>((set) => ({
  currentStep: 1,
  formData: initialFormData,
  isSubmitting: false,
  isSubmitted: false,
  draftSaved: false,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () =>
    set((s) => ({
      currentStep: Math.min(s.currentStep + 1, 5) as ReportStep,
    })),
  prevStep: () =>
    set((s) => ({
      currentStep: Math.max(s.currentStep - 1, 1) as ReportStep,
    })),
  updateForm: (data) =>
    set((s) => ({ formData: { ...s.formData, ...data }, draftSaved: false })),
  addFile: (file) =>
    set((s) => ({
      formData: { ...s.formData, files: [...s.formData.files, file] },
      draftSaved: false,
    })),
  removeFile: (id) =>
    set((s) => ({
      formData: {
        ...s.formData,
        files: s.formData.files.filter((f) => f.id !== id),
      },
      draftSaved: false,
    })),
  updateFileProgress: (id, progress) =>
    set((s) => ({
      formData: {
        ...s.formData,
        files: s.formData.files.map((f) =>
          f.id === id ? { ...f, progress } : f
        ),
      },
    })),
  updateFileStatus: (id, status) =>
    set((s) => ({
      formData: {
        ...s.formData,
        files: s.formData.files.map((f) =>
          f.id === id ? { ...f, status } : f
        ),
      },
    })),
  setSubmitting: (v) => set({ isSubmitting: v }),
  setSubmitted: (v) => set({ isSubmitted: v }),
  setDraftSaved: (v) => set({ draftSaved: v }),
  resetForm: () =>
    set({
      currentStep: 1,
      formData: initialFormData,
      isSubmitting: false,
      isSubmitted: false,
      draftSaved: false,
    }),
}));

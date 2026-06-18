export const MAX_EVIDENCE_FILES = 5;
export const MAX_EVIDENCE_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const SUPPORTED_EVIDENCE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "video/mp4",
  "video/quicktime",
] as const;

export type SupportedEvidenceMimeType = (typeof SUPPORTED_EVIDENCE_MIME_TYPES)[number];

export type ReportStep = 1 | 2 | 3 | 4 | 5;

export type ReportHazardType =
  | "pothole"
  | "flooding"
  | "fallenTree"
  | "roadDebris"
  | "brokenSignal"
  | "other";

export type ReportSeverityLevel = "low" | "medium" | "high" | "critical";

export type ReportBackendCategory =
  | "POTHOLE"
  | "CRACKS_DAMAGE"
  | "FADED_LANE_MARKINGS"
  | "MISSING_BROKEN_SIGNBOARD"
  | "POOR_STREET_LIGHTING"
  | "ENCROACHMENT"
  | "OTHERS";

export type ReportBackendSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ReportLocationMode = "gps" | "manual" | "exif";

export type ReportAnalysisState = "idle" | "uploading" | "scanning" | "ready" | "failed";

export type SuggestedSource = "ai" | "manual";

export interface ReportEvidenceExifLocation {
  latitude: number;
  longitude: number;
  address?: string | null;
}

export interface ReportEvidenceFile {
  id: string;
  file: File | null;
  name: string;
  size: number;
  mimeType: string;
  previewUrl: string;
  uploadStatus: "local" | "uploading" | "uploaded" | "error";
  errorMessage?: string;
  mediaId?: string | null;
  uploadedUrl?: string | null;
  exifLocation?: ReportEvidenceExifLocation | null;
}

export interface ReportAiAnalysisResult {
  suggestedCategory: ReportHazardType | null;
  suggestedSeverity: ReportSeverityLevel | null;
  confidence: number | null;
  allDetectedIssues: string[];
  totalDetected: number;
  inferenceMs: number;
  annotatedImage: {
    url: string;
    expiresIn: number;
    s3Key: string;
  } | null;
  message: string;
}

export interface ReportLocationState {
  latitude: number | null;
  longitude: number | null;
  address: string;
  landmark: string;
  useExifLocation: boolean;
  locationMode: ReportLocationMode;
  exifLocation: ReportEvidenceExifLocation | null;
}

export interface ReportFieldSuggestionState {
  hazardType: SuggestedSource;
  severity: SuggestedSource;
  title: SuggestedSource;
  description: SuggestedSource;
}

export interface ReportFormState {
  currentStep: ReportStep;
  transitionDirection: 1 | -1;
  touchDevice: boolean;
  evidence: ReportEvidenceFile[];
  analysisState: ReportAnalysisState;
  analysisStatusIndex: number;
  analysisError: string | null;
  aiResult: ReportAiAnalysisResult | null;
  hazardType: ReportHazardType | "";
  severity: ReportSeverityLevel | "";
  title: string;
  description: string;
  fieldSuggestions: ReportFieldSuggestionState;
  location: ReportLocationState;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submittedReportId: string | null;
  submittedTicketNumber: string | null;
  draftSavedAt: string | null;
  toastMessage: string | null;
}

export interface ReportDraftSnapshot {
  currentStep: ReportStep;
  analysisState: ReportAnalysisState;
  analysisError: string | null;
  aiResult: ReportAiAnalysisResult | null;
  hazardType: ReportHazardType | "";
  severity: ReportSeverityLevel | "";
  title: string;
  description: string;
  fieldSuggestions: ReportFieldSuggestionState;
  location: ReportLocationState;
  evidence: Array<
    Omit<ReportEvidenceFile, "file" | "previewUrl"> & {
      file: null;
      previewUrl: string;
    }
  >;
}

export const REPORT_STEP_LABELS: Record<ReportStep, string> = {
  1: "Evidence",
  2: "AI Analysis",
  3: "Hazard Info",
  4: "Location",
  5: "Review & Submit",
};

export const DEFAULT_FIELD_SUGGESTIONS: ReportFieldSuggestionState = {
  hazardType: "manual",
  severity: "manual",
  title: "manual",
  description: "manual",
};

export const HAZARD_OPTIONS: Array<{ value: ReportHazardType; label: string; backendCategory: ReportBackendCategory }> = [
  { value: "pothole", label: "Pothole", backendCategory: "POTHOLE" },
  { value: "flooding", label: "Flooding", backendCategory: "OTHERS" },
  { value: "fallenTree", label: "Fallen Tree", backendCategory: "OTHERS" },
  { value: "roadDebris", label: "Road Debris", backendCategory: "CRACKS_DAMAGE" },
  { value: "brokenSignal", label: "Broken Signal", backendCategory: "MISSING_BROKEN_SIGNBOARD" },
  { value: "other", label: "Other", backendCategory: "OTHERS" },
];

export const SEVERITY_OPTIONS: Array<{ value: ReportSeverityLevel; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const HAZARD_LABEL_BY_VALUE: Record<ReportHazardType, string> = Object.fromEntries(
  HAZARD_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ReportHazardType, string>;

export const BACKEND_CATEGORY_BY_HAZARD: Record<ReportHazardType, ReportBackendCategory> = Object.fromEntries(
  HAZARD_OPTIONS.map((option) => [option.value, option.backendCategory]),
) as Record<ReportHazardType, ReportBackendCategory>;

export const HAZARD_BY_BACKEND_CATEGORY: Record<ReportBackendCategory, ReportHazardType> = {
  POTHOLE: "pothole",
  CRACKS_DAMAGE: "roadDebris",
  FADED_LANE_MARKINGS: "other",
  MISSING_BROKEN_SIGNBOARD: "brokenSignal",
  POOR_STREET_LIGHTING: "other",
  ENCROACHMENT: "other",
  OTHERS: "other",
};

export const BACKEND_SEVERITY_BY_HUMAN: Record<ReportSeverityLevel, ReportBackendSeverity> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "CRITICAL",
};

export const SEVERITY_BY_BACKEND: Record<ReportBackendSeverity, ReportSeverityLevel> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

export const DEFAULT_LOCATION_STATE: ReportLocationState = {
  latitude: null,
  longitude: null,
  address: "",
  landmark: "",
  useExifLocation: false,
  locationMode: "manual",
  exifLocation: null,
};

export function createInitialReportState(): ReportFormState {
  return {
    currentStep: 1,
    transitionDirection: 1,
    touchDevice: false,
    evidence: [],
    analysisState: "idle",
    analysisStatusIndex: 0,
    analysisError: null,
    aiResult: null,
    hazardType: "",
    severity: "",
    title: "",
    description: "",
    fieldSuggestions: DEFAULT_FIELD_SUGGESTIONS,
    location: DEFAULT_LOCATION_STATE,
    isSubmitting: false,
    isSubmitted: false,
    submittedReportId: null,
    submittedTicketNumber: null,
    draftSavedAt: null,
    toastMessage: null,
  };
}

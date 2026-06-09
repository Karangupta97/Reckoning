import type {
  ReportAiAnalysisResult,
  ReportHazardType,
  ReportSeverityLevel,
  ReportBackendCategory,
  ReportBackendSeverity,
} from "./reportTypes";
import { fetchCitizenAuth, readResponseJson, extractMessage } from "@/lib/auth/citizenSession";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface UploadMediaResponseItem {
  mediaId: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface AiDetectResponse {
  suggestedCategory: ReportBackendCategory | null;
  suggestedSeverity: ReportBackendSeverity | null;
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

export interface ComplaintSubmissionInput {
  category: ReportBackendCategory;
  latitude: number;
  longitude: number;
  mediaIds: string[];
  description?: string;
  suggestedFix?: string;
  roadName?: string;
  roadNumber?: string;
  landmark?: string;
  direction?: string;
  isAnonymous?: boolean;
  aiCategory?: ReportBackendCategory | null;
  aiConfidence?: number | null;
  aiRawResult?: Record<string, unknown> | null;
}

export interface ComplaintSubmissionResponse {
  id: string;
  ticketNumber: string;
}

export interface ReverseGeocodeResult {
  label: string;
  roadName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

function apiUrl(path: string): string {
  return `${API_BASE_URL}/api${path}`;
}

export async function uploadReportMedia(params: {
  files: File[];
  accessToken: string | null;
}): Promise<UploadMediaResponseItem[]> {
  const formData = new FormData();
  for (const file of params.files) {
    formData.append("files", file);
  }

  const response = await fetchCitizenAuth(apiUrl("/upload"), {
    method: "POST",
    body: formData,
  });

  const payload = await readResponseJson(response) as { success?: boolean; data?: { media?: UploadMediaResponseItem[] } };
  if (!response.ok) {
    throw new Error(extractMessage(payload, "Unable to upload evidence. Please try again."));
  }

  const media = payload.data?.media ?? [];
  if (media.length === 0) {
    throw new Error("Unable to upload evidence. Please try again.");
  }

  return media;
}

export async function analyzeReportMedia(params: {
  fileId: string;
  accessToken: string | null;
}): Promise<ReportAiAnalysisResult> {
  const response = await fetchCitizenAuth(apiUrl("/ai/detect"), {
    method: "POST",
    body: JSON.stringify({ fileId: params.fileId }),
  });

  const payload = await readResponseJson(response) as { success?: boolean; data?: AiDetectResponse; error?: { message?: string }; message?: string };

  if (!response.ok) {
    throw new Error(extractMessage(payload, "AI analysis is temporarily unavailable."));
  }

  const data = payload.data;
  if (!data) {
    throw new Error("AI analysis is temporarily unavailable.");
  }
  return {
    suggestedCategory: data.suggestedCategory as ReportAiAnalysisResult["suggestedCategory"],
    suggestedSeverity: data.suggestedSeverity as ReportAiAnalysisResult["suggestedSeverity"],
    confidence: data.confidence,
    allDetectedIssues: data.allDetectedIssues ?? [],
    totalDetected: data.totalDetected ?? 0,
    inferenceMs: data.inferenceMs ?? 0,
    annotatedImage: data.annotatedImage ?? null,
    message: data.message ?? "AI analysis completed.",
  };
}

export async function submitRoadHazardReport(params: {
  payload: ComplaintSubmissionInput;
  accessToken: string | null;
}): Promise<ComplaintSubmissionResponse> {
  const response = await fetchCitizenAuth(apiUrl("/complaints"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params.payload),
  });

  const payload = await readResponseJson(response) as {
    success?: boolean;
    data?: ComplaintSubmissionResponse;
    error?: { message?: string };
    message?: string;
  };

  if (!response.ok) {
    throw new Error(extractMessage(payload, "Unable to submit your report. Please try again."));
  }

  if (!payload.data?.id || !payload.data.ticketNumber) {
    throw new Error("Unable to submit your report. Please try again.");
  }

  return payload.data;
}

export async function reverseGeocodeLocation(params: {
  latitude: number;
  longitude: number;
}): Promise<ReverseGeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(params.latitude));
  url.searchParams.set("lon", String(params.longitude));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    display_name?: string;
    address?: {
      road?: string;
      neighbourhood?: string;
      suburb?: string;
      city?: string;
      town?: string;
      village?: string;
      state?: string;
      country?: string;
    };
  };

  const label = payload.display_name ?? "Dropped pin";
  return {
    label,
    roadName: payload.address?.road ?? payload.address?.neighbourhood ?? payload.address?.suburb ?? null,
    city: payload.address?.city ?? payload.address?.town ?? payload.address?.village ?? null,
    state: payload.address?.state ?? null,
    country: payload.address?.country ?? null,
  };
}

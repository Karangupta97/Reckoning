import type {
  ReportAiAnalysisResult,
  ReportHazardType,
  ReportSeverityLevel,
  ReportBackendCategory,
  ReportBackendSeverity,
} from "./reportTypes";
import { fetchCitizenAuth, readResponseJson, extractMessage, refreshCitizenSession } from "@/lib/auth/citizenSession";

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
  /** S3 key for the annotated result image — stored permanently, no re-upload needed. */
  aiAnnotatedImageKey?: string | null;
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
    headers: {
      "Content-Type": "application/json",
    },
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
  // Hard 60-second deadline — the complaint submission path includes AI
  // inference, PostGIS authority lookup, S3 annotation upload, and queue
  // enqueue jobs. The backend keepAliveTimeout is 65 s, so this fires first
  // and gives a clean user-facing error rather than an ECONNRESET.
  const abort = new AbortController();
  const timeoutId = setTimeout(() => abort.abort(), 60_000);

  // Log the payload shape so we can catch field-shape mismatches quickly.
  console.debug("[submitRoadHazardReport] payload →", JSON.stringify(params.payload, null, 2));

  // Proactively refresh the session before submission. The user may have spent
  // 10+ minutes filling the form (uploading images, running AI, selecting
  // location), so the access token could have expired. Refreshing here ensures
  // the submission request has a fresh token without relying on the 401-retry
  // path (which can fail if parallel requests already rotated the refresh token).
  await refreshCitizenSession().catch(() => {
    // Non-fatal: if refresh fails, fetchCitizenAuth will still attempt its own
    // 401 → refresh → retry cycle.
    console.debug("[submitRoadHazardReport] Proactive refresh failed; proceeding with current token.");
  });

  let response: Response;
  try {
    response = await fetchCitizenAuth(apiUrl("/complaints"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params.payload),
      signal: abort.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out after 60 seconds. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await readResponseJson(response) as {
    success?: boolean;
    data?: ComplaintSubmissionResponse;
    error?: { message?: string };
    message?: string;
  };

  if (!response.ok) {
    const msg = extractMessage(payload, "Unable to submit your report. Please try again.");
    console.error("[submitRoadHazardReport] API error →", response.status, msg, payload);
    throw new Error(msg);
  }

  if (!payload.data?.id || !payload.data.ticketNumber) {
    console.error("[submitRoadHazardReport] Unexpected response shape →", payload);
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

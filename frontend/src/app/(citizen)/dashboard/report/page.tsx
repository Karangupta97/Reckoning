"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import {
  BACKEND_CATEGORY_BY_HAZARD,
  DEFAULT_LOCATION_STATE,
  SUPPORTED_EVIDENCE_MIME_TYPES,
  createInitialReportState,
  type ReportAiAnalysisResult,
  type ReportBackendCategory,
  type ReportEvidenceFile,
  type ReportFormState,
  type ReportHazardType,
  type ReportLocationState,
  type ReportSeverityLevel,
  type ReportStep,
  type ReportDraftSnapshot,
} from "@/components/report";
import { ReportHazardForm } from "@/components/report";
import {
  analyzeReportMedia,
  submitRoadHazardReport,
  uploadReportMedia,
  type ComplaintSubmissionInput,
} from "@/components/report/reportApi";

type ReportAction =
  | { type: "RESTORE_DRAFT"; state: Partial<ReportFormState> }
  | { type: "SET_TOUCH_DEVICE"; touchDevice: boolean }
  | { type: "SET_STEP"; step: ReportStep; direction: 1 | -1 }
  | { type: "SET_ANALYSIS_STATE"; analysisState: ReportFormState["analysisState"] }
  | { type: "SET_ANALYSIS_STATUS_INDEX"; analysisStatusIndex: number }
  | { type: "SET_ANALYSIS_ERROR"; analysisError: string | null }
  | { type: "SET_AI_RESULT"; aiResult: ReportAiAnalysisResult | null }
  | { type: "SET_HAZARD_TYPE"; hazardType: ReportHazardType | "" }
  | { type: "SET_SEVERITY"; severity: ReportSeverityLevel | "" }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_DESCRIPTION"; description: string }
  | { type: "SET_LOCATION"; patch: Partial<ReportLocationState> }
  | { type: "ADD_EVIDENCE"; evidence: ReportEvidenceFile[] }
  | { type: "UPDATE_EVIDENCE"; evidence: ReportEvidenceFile[] }
  | { type: "REMOVE_EVIDENCE"; evidenceId: string }
  | { type: "SET_SUBMITTING"; isSubmitting: boolean }
  | { type: "SET_SUBMITTED"; submittedReportId: string; submittedTicketNumber: string }
  | { type: "SET_TOAST"; toastMessage: string | null }
  | { type: "SET_FIELD_SUGGESTIONS"; fieldSuggestions: ReportFormState["fieldSuggestions"] }
  | { type: "RESET_ANALYSIS_ERROR" };

const MAX_UPLOAD_FILES = 5;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function reducer(state: ReportFormState, action: ReportAction): ReportFormState {
  switch (action.type) {
    case "RESTORE_DRAFT":
      return {
        ...state,
        ...action.state,
        location: {
          ...DEFAULT_LOCATION_STATE,
          ...action.state.location,
        },
      };
    case "SET_TOUCH_DEVICE":
      return { ...state, touchDevice: action.touchDevice };
    case "SET_STEP":
      return { ...state, currentStep: action.step, transitionDirection: action.direction };
    case "SET_ANALYSIS_STATE":
      return { ...state, analysisState: action.analysisState };
    case "SET_ANALYSIS_STATUS_INDEX":
      return { ...state, analysisStatusIndex: action.analysisStatusIndex };
    case "SET_ANALYSIS_ERROR":
      return { ...state, analysisError: action.analysisError };
    case "SET_AI_RESULT":
      return { ...state, aiResult: action.aiResult };
    case "SET_HAZARD_TYPE":
      return { ...state, hazardType: action.hazardType, fieldSuggestions: { ...state.fieldSuggestions, hazardType: action.hazardType === state.hazardType ? state.fieldSuggestions.hazardType : "manual" } };
    case "SET_SEVERITY":
      return { ...state, severity: action.severity, fieldSuggestions: { ...state.fieldSuggestions, severity: action.severity === state.severity ? state.fieldSuggestions.severity : "manual" } };
    case "SET_TITLE":
      return { ...state, title: action.title, fieldSuggestions: { ...state.fieldSuggestions, title: state.fieldSuggestions.title === "ai" ? "manual" : state.fieldSuggestions.title } };
    case "SET_DESCRIPTION":
      return { ...state, description: action.description, fieldSuggestions: { ...state.fieldSuggestions, description: state.fieldSuggestions.description === "ai" ? "manual" : state.fieldSuggestions.description } };
    case "SET_LOCATION":
      return { ...state, location: { ...state.location, ...action.patch } };
    case "ADD_EVIDENCE":
      return { ...state, evidence: [...state.evidence, ...action.evidence] };
    case "UPDATE_EVIDENCE":
      return { ...state, evidence: action.evidence };
    case "REMOVE_EVIDENCE":
      return { ...state, evidence: state.evidence.filter((item) => item.id !== action.evidenceId) };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.isSubmitting };
    case "SET_SUBMITTED":
      return {
        ...state,
        isSubmitting: false,
        isSubmitted: true,
        submittedReportId: action.submittedReportId,
        submittedTicketNumber: action.submittedTicketNumber,
      };
    case "SET_TOAST":
      return { ...state, toastMessage: action.toastMessage };
    case "SET_FIELD_SUGGESTIONS":
      return { ...state, fieldSuggestions: action.fieldSuggestions };
    case "RESET_ANALYSIS_ERROR":
      return { ...state, analysisError: null };
    default:
      return state;
  }
}

function isTouchDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

function createFileId(): string {
  return `evidence-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatDraftSnapshot(state: ReportFormState): ReportDraftSnapshot {
  return {
    currentStep: state.currentStep,
    analysisState: state.analysisState,
    analysisError: state.analysisError,
    aiResult: state.aiResult,
    hazardType: state.hazardType,
    severity: state.severity,
    title: state.title,
    description: state.description,
    fieldSuggestions: state.fieldSuggestions,
    location: state.location,
    evidence: [],
  };
}

function buildAiSuggestionText(category: ReportHazardType | null): { title: string; description: string } {
  if (!category) {
    return {
      title: "Reported road hazard",
      description: "AI analysis did not detect a dominant hazard, so the report can be reviewed manually.",
    };
  }

  const label =
    category === "pothole"
      ? "Pothole"
      : category === "flooding"
        ? "Flooding"
        : category === "fallenTree"
          ? "Fallen tree"
          : category === "roadDebris"
            ? "Road debris"
            : category === "brokenSignal"
              ? "Broken signal"
              : "Road hazard";

  return {
    title: `${label} detected near the reported location`,
    description: `AI detected a ${label.toLowerCase()} and flagged it for review. Please confirm the location and severity before submission.`,
  };
}

function readAscii(view: DataView, start: number, length: number): string {
  let result = "";
  for (let offset = 0; offset < length; offset += 1) {
    result += String.fromCharCode(view.getUint8(start + offset));
  }
  return result;
}

function getUint16(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint16(offset, littleEndian);
}

function getUint32(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint32(offset, littleEndian);
}

function getRational(view: DataView, offset: number, littleEndian: boolean): number {
  const numerator = getUint32(view, offset, littleEndian);
  const denominator = getUint32(view, offset + 4, littleEndian);
  return denominator === 0 ? 0 : numerator / denominator;
}

async function extractExifGpsLocation(file: File): Promise<{ latitude: number; longitude: number; address?: string | null } | null> {
  if (!file.type.startsWith("image/")) {
    return null;
  }

  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);

  if (view.byteLength < 12 || view.getUint16(0, false) !== 0xffd8) {
    return null;
  }

  let offset = 2;
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = view.getUint8(offset + 1);
    const segmentSize = view.getUint16(offset + 2, false);

    if (marker === 0xe1) {
      const segmentStart = offset + 4;
      if (readAscii(view, segmentStart, 4) !== "Exif") {
        offset += 2 + segmentSize;
        continue;
      }

      const tiffStart = segmentStart + 6;
      const littleEndian = readAscii(view, tiffStart, 2) === "II";
      const firstIfdOffset = getUint32(view, tiffStart + 4, littleEndian);
      const ifd0Offset = tiffStart + firstIfdOffset;
      const ifd0Entries = getUint16(view, ifd0Offset, littleEndian);

      let gpsOffset = 0;
      for (let index = 0; index < ifd0Entries; index += 1) {
        const entryOffset = ifd0Offset + 2 + index * 12;
        const tag = getUint16(view, entryOffset, littleEndian);
        if (tag === 0x8825) {
          gpsOffset = getUint32(view, entryOffset + 8, littleEndian);
          break;
        }
      }

      if (!gpsOffset) {
        return null;
      }

      const gpsIfdOffset = tiffStart + gpsOffset;
      const gpsEntries = getUint16(view, gpsIfdOffset, littleEndian);
      let latitudeRef = "";
      let longitudeRef = "";
      let latitudeValues: number[] = [];
      let longitudeValues: number[] = [];

      for (let index = 0; index < gpsEntries; index += 1) {
        const entryOffset = gpsIfdOffset + 2 + index * 12;
        const tag = getUint16(view, entryOffset, littleEndian);
        const type = getUint16(view, entryOffset + 2, littleEndian);
        const count = getUint32(view, entryOffset + 4, littleEndian);
        const valueOffset = getUint32(view, entryOffset + 8, littleEndian);
        const dataOffset = tiffStart + valueOffset;

        if (tag === 1 && type === 2) {
          latitudeRef = readAscii(view, dataOffset, count).replace(/\0/g, "");
        }

        if (tag === 2 && type === 5 && count >= 3) {
          latitudeValues = [
            getRational(view, dataOffset, littleEndian),
            getRational(view, dataOffset + 8, littleEndian),
            getRational(view, dataOffset + 16, littleEndian),
          ];
        }

        if (tag === 3 && type === 2) {
          longitudeRef = readAscii(view, dataOffset, count).replace(/\0/g, "");
        }

        if (tag === 4 && type === 5 && count >= 3) {
          longitudeValues = [
            getRational(view, dataOffset, littleEndian),
            getRational(view, dataOffset + 8, littleEndian),
            getRational(view, dataOffset + 16, littleEndian),
          ];
        }
      }

      if (latitudeValues.length === 3 && longitudeValues.length === 3 && latitudeRef && longitudeRef) {
        const latitude = latitudeValues[0] + latitudeValues[1] / 60 + latitudeValues[2] / 3600;
        const longitude = longitudeValues[0] + longitudeValues[1] / 60 + longitudeValues[2] / 3600;

        return {
          latitude: latitudeRef.toUpperCase() === "S" ? -latitude : latitude,
          longitude: longitudeRef.toUpperCase() === "W" ? -longitude : longitude,
        };
      }
    }

    offset += 2 + segmentSize;
  }

  return null;
}



function toBackendPayload(state: ReportFormState): ComplaintSubmissionInput | null {
  if (state.location.latitude == null || state.location.longitude == null || !state.hazardType) {
    return null;
  }

  const mediaIds = state.evidence.filter((item) => item.mediaId).map((item) => item.mediaId as string);
  if (mediaIds.length === 0) {
    return null;
  }

  const aiCategory = state.aiResult?.suggestedCategory ? BACKEND_CATEGORY_BY_HAZARD[state.aiResult.suggestedCategory] : null;

  return {
    category: BACKEND_CATEGORY_BY_HAZARD[state.hazardType],
    latitude: state.location.latitude,
    longitude: state.location.longitude,
    mediaIds,
    description: state.description.trim() || undefined,
    roadName: state.location.address ? state.location.address.split(",")[0].trim() : undefined,
    landmark: state.location.landmark.trim() || undefined,
    aiCategory,
    aiConfidence: state.aiResult?.confidence ?? null,
    aiRawResult: state.aiResult
      ? {
          suggestedCategory: state.aiResult.suggestedCategory,
          suggestedSeverity: state.aiResult.suggestedSeverity,
          confidence: state.aiResult.confidence,
          allDetectedIssues: state.aiResult.allDetectedIssues,
          totalDetected: state.aiResult.totalDetected,
          inferenceMs: state.aiResult.inferenceMs,
          message: state.aiResult.message,
          annotatedImage: state.aiResult.annotatedImage,
          mediaResults: state.evidence.map((item) => ({
            mediaId: item.mediaId,
            url: item.uploadedUrl,
            aiResult: item.aiResult ?? null,
          })),
        }
      : null,
  };
}

function readStoredDraft(): Partial<ReportFormState> | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem("report-draft");
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as ReportDraftSnapshot;
    return {
      currentStep: 1,
      analysisState: parsed.analysisState ?? "idle",
      analysisError: parsed.analysisError ?? null,
      aiResult: parsed.aiResult ?? null,
      hazardType: parsed.hazardType ?? "",
      severity: parsed.severity ?? "",
      title: parsed.title ?? "",
      description: parsed.description ?? "",
      fieldSuggestions: parsed.fieldSuggestions,
      location: parsed.location ?? DEFAULT_LOCATION_STATE,
    };
  } catch {
    return null;
  }
}

export default function ReportPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [state, dispatch] = useReducer(reducer, undefined, createInitialReportState);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  useEffect(() => {
    dispatch({ type: "SET_TOUCH_DEVICE", touchDevice: isTouchDevice() });
    const stored = readStoredDraft();
    if (stored) {
      dispatch({ type: "RESTORE_DRAFT", state: stored });
      setDraftSavedAt(new Date().toISOString());
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (state.isSubmitted) {
      return;
    }

    const draft = formatDraftSnapshot(state);
    localStorage.setItem("report-draft", JSON.stringify(draft));
    setDraftSavedAt(new Date().toISOString());
  }, [state]);

  useEffect(() => {
    if (state.analysisState !== "uploading" && state.analysisState !== "scanning") {
      return;
    }

    const timer = window.setInterval(() => {
      dispatch({ type: "SET_ANALYSIS_STATUS_INDEX", analysisStatusIndex: (state.analysisStatusIndex + 1) % 3 });
    }, 1600);

    return () => window.clearInterval(timer);
  }, [state.analysisState, state.analysisStatusIndex]);

  const canProceed = useMemo(() => {
    switch (state.currentStep) {
      case 1:
        return state.evidence.some((item) => !item.errorMessage);
      case 2:
        return state.analysisState === "ready" || state.analysisState === "failed";
      case 3:
        return Boolean(state.hazardType && state.severity && state.title.trim() && state.description.trim());
      case 4:
        return Boolean(state.location.latitude != null && state.location.longitude != null && state.location.address.trim());
      case 5:
        return Boolean(state.location.latitude != null && state.location.longitude != null && state.location.address.trim() && state.evidence.some((item) => item.mediaId));
      default:
        return false;
    }
  }, [state]);

  const jumpToStep = useCallback((step: ReportStep) => {
    dispatch({ type: "SET_STEP", step, direction: step > state.currentStep ? 1 : -1 });
  }, [state.currentStep]);

  const prevStep = useCallback(() => {
    if (state.currentStep === 1) {
      return;
    }

    dispatch({ type: "SET_STEP", step: (state.currentStep - 1) as ReportStep, direction: -1 });
  }, [state.currentStep]);

  const nextStep = useCallback(() => {
    if (state.currentStep === 2 && state.analysisState !== "ready" && state.analysisState !== "failed") {
      return;
    }

    if (state.currentStep < 5) {
      dispatch({ type: "SET_STEP", step: (state.currentStep + 1) as ReportStep, direction: 1 });
    }
  }, [state.analysisState, state.currentStep]);

  const updateLocation = useCallback((patch: Partial<ReportLocationState>) => {
    dispatch({ type: "SET_LOCATION", patch });
  }, []);

  const updateFieldSuggestions = useCallback((fieldSuggestions: ReportFormState["fieldSuggestions"]) => {
    dispatch({ type: "SET_FIELD_SUGGESTIONS", fieldSuggestions });
  }, []);

  const selectEvidence = useCallback(async (files: File[], source: "camera" | "gallery" | "drop") => {
    void source;

    const validSlots = state.evidence.length;
    const acceptedFiles: ReportEvidenceFile[] = [];

    for (const file of files) {
      if (validSlots + acceptedFiles.length >= MAX_UPLOAD_FILES) {
        dispatch({ type: "SET_TOAST", toastMessage: "Maximum 5 files reached" });
        break;
      }

      if (!SUPPORTED_EVIDENCE_MIME_TYPES.includes(file.type as (typeof SUPPORTED_EVIDENCE_MIME_TYPES)[number])) {
        dispatch({ type: "SET_TOAST", toastMessage: "Unsupported file type" });
        continue;
      }

      const fileId = createFileId();
      const previewUrl = URL.createObjectURL(file);
      const evidenceFile: ReportEvidenceFile = {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        previewUrl,
        uploadStatus: "local",
      };

      if (file.size > MAX_FILE_SIZE) {
        evidenceFile.uploadStatus = "error";
        evidenceFile.errorMessage = "File is larger than 25 MB.";
      }

      const exifLocation = await extractExifGpsLocation(file);
      if (exifLocation) {
        evidenceFile.exifLocation = exifLocation;
        if (!state.location.exifLocation) {
          dispatch({
            type: "SET_LOCATION",
            patch: {
              exifLocation,
            },
          });
        }
      }

      acceptedFiles.push(evidenceFile);
    }

    if (acceptedFiles.length > 0) {
      dispatch({ type: "ADD_EVIDENCE", evidence: acceptedFiles });
    }
  }, [state.evidence.length]);

  const removeEvidence = useCallback((evidenceId: string) => {
    const file = state.evidence.find((item) => item.id === evidenceId);
    if (file?.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(file.previewUrl);
    }

    dispatch({ type: "REMOVE_EVIDENCE", evidenceId });
  }, [state.evidence]);

  const dismissToast = useCallback(() => {
    dispatch({ type: "SET_TOAST", toastMessage: null });
    dispatch({ type: "SET_ANALYSIS_ERROR", analysisError: null });
  }, []);

  const runAnalysis = useCallback(async () => {
    const validFiles = state.evidence.filter((item) => item.file && !item.errorMessage).map((item) => item.file as File);
    if (validFiles.length === 0) {
      dispatch({ type: "SET_TOAST", toastMessage: "Add at least one supported file to continue." });
      return;
    }

    dispatch({ type: "SET_STEP", step: 2, direction: 1 });
    dispatch({ type: "SET_ANALYSIS_ERROR", analysisError: null });
    dispatch({ type: "SET_ANALYSIS_STATE", analysisState: "uploading" });

    try {
      const uploads = await uploadReportMedia({ files: validFiles, accessToken });

      const uploadedEvidence = state.evidence.map((item) => {
        if (!item.file || item.errorMessage) {
          return item;
        }

        const match = uploads.shift();
        if (!match) {
          return item;
        }

        return {
          ...item,
          mediaId: match.mediaId,
          uploadedUrl: match.url,
          uploadStatus: "uploaded" as const,
        };
      });

      dispatch({ type: "UPDATE_EVIDENCE", evidence: uploadedEvidence });
      dispatch({ type: "SET_ANALYSIS_STATE", analysisState: "scanning" });

      const imageItems = uploadedEvidence.filter((item) => item.mediaId && item.mimeType.startsWith("image/"));
      if (imageItems.length === 0) {
        throw new Error("Upload at least one image to analyse the hazard.");
      }

      const results: ReportAiAnalysisResult[] = [];
      for (const item of uploadedEvidence) {
        if (item.mediaId && item.mimeType.startsWith("image/")) {
          try {
            const res = await analyzeReportMedia({ fileId: item.mediaId, accessToken });
            item.aiResult = res;
            results.push(res);
          } catch (err) {
            console.warn("Analysis failed for image", item.mediaId, err);
          }
        }
      }

      dispatch({ type: "UPDATE_EVIDENCE", evidence: uploadedEvidence });

      if (results.length === 0) {
        throw new Error("AI analysis failed or is temporarily unavailable for your images.");
      }

      // Find the result with the highest confidence to be the primary AI result
      let bestResult = results[0];
      let maxConfidence = -1;
      for (const res of results) {
        if (res.confidence != null && res.confidence > maxConfidence) {
          maxConfidence = res.confidence;
          bestResult = res;
        }
      }

      const uiCategory = bestResult.suggestedCategory;

      // Combine severities: maximum severity level detected among all images
      const severityScores: Record<ReportSeverityLevel, number> = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
      };

      let maxSeverityScore = 0;
      let uiSeverity: ReportSeverityLevel | null = null;
      for (const res of results) {
        if (res.suggestedSeverity) {
          const score = severityScores[res.suggestedSeverity];
          if (score > maxSeverityScore) {
            maxSeverityScore = score;
            uiSeverity = res.suggestedSeverity;
          }
        }
      }

      if (!uiSeverity) {
        uiSeverity = "medium";
      }

      // Merge all detected issues and sum total counts
      const mergedIssues = Array.from(new Set(results.flatMap((r) => r.allDetectedIssues)));
      const mergedTotal = results.reduce((sum, r) => sum + r.totalDetected, 0);

      const finalAiResult = {
        ...bestResult,
        allDetectedIssues: mergedIssues,
        totalDetected: mergedTotal,
      };

      dispatch({ type: "SET_AI_RESULT", aiResult: finalAiResult });
      dispatch({ type: "SET_HAZARD_TYPE", hazardType: uiCategory ?? state.hazardType ?? "other" });
      dispatch({ type: "SET_SEVERITY", severity: uiSeverity });

      const suggestion = buildAiSuggestionText(uiCategory);
      dispatch({ type: "SET_TITLE", title: suggestion.title });
      dispatch({ type: "SET_DESCRIPTION", description: suggestion.description });
      updateFieldSuggestions({ hazardType: "ai", severity: "ai", title: "ai", description: "ai" });

      dispatch({ type: "SET_ANALYSIS_STATE", analysisState: "ready" });
      dispatch({ type: "SET_STEP", step: 3, direction: 1 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI analysis failed.";
      dispatch({ type: "SET_ANALYSIS_ERROR", analysisError: message });
      dispatch({ type: "SET_ANALYSIS_STATE", analysisState: "failed" });
      dispatch({ type: "SET_STEP", step: 2, direction: 1 });
    }
  }, [accessToken, state.evidence, state.hazardType, state.severity, updateFieldSuggestions]);

  const submitReport = useCallback(async () => {
    const payload = toBackendPayload(state);
    console.log("Submitting complaint payload:", payload);
    if (!payload) {
      dispatch({ type: "SET_TOAST", toastMessage: "Complete the required fields before submitting." });
      return;
    }

    dispatch({ type: "SET_SUBMITTING", isSubmitting: true });

    try {
      const response = await submitRoadHazardReport({ payload, accessToken });
      localStorage.removeItem("report-draft");
      dispatch({ type: "SET_SUBMITTED", submittedReportId: response.id, submittedTicketNumber: response.ticketNumber });
    } catch (error) {
      dispatch({ type: "SET_TOAST", toastMessage: error instanceof Error ? error.message : "Unable to submit your report." });
    } finally {
      dispatch({ type: "SET_SUBMITTING", isSubmitting: false });
    }
  }, [accessToken, state]);

  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--color-amber)_8%,transparent),transparent_35%),transparent] px-4 py-6 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto w-full max-w-3xl">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Report Road Hazard</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Use evidence, AI, and location context to file a production-grade road hazard report.</p>
        </div>

        <ReportHazardForm
          state={state}
          draftSavedAt={draftSavedAt}
          canProceed={canProceed}
          onJumpToStep={jumpToStep}
          onPrevStep={prevStep}
          onNextStep={nextStep}
          onSelectEvidence={selectEvidence}
          onRemoveEvidence={removeEvidence}
          onAnalyseEvidence={runAnalysis}
          onHazardTypeChange={(value) => dispatch({ type: "SET_HAZARD_TYPE", hazardType: value })}
          onSeverityChange={(value) => dispatch({ type: "SET_SEVERITY", severity: value })}
          onTitleChange={(value) => dispatch({ type: "SET_TITLE", title: value })}
          onDescriptionChange={(value) => dispatch({ type: "SET_DESCRIPTION", description: value })}
          onLocationChange={updateLocation}
          onSubmitReport={submitReport}
          onDismissToast={dismissToast}
          onTrackReport={() => router.push("/dashboard/my-reports")}
        />
      </motion.div>
    </div>
  );
}

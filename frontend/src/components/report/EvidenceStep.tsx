"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  FolderOpen,
  Upload,
  X,
  FileImage,
  FileVideo,
  TriangleAlert,
  Sparkles,
} from "lucide-react";
import {
  MAX_EVIDENCE_FILES,
  MAX_EVIDENCE_FILE_SIZE_BYTES,
  SUPPORTED_EVIDENCE_MIME_TYPES,
  type ReportAnalysisState,
  type ReportEvidenceFile,
  type SupportedEvidenceMimeType,
} from "./reportTypes";

const ACCEPT_ATTRIBUTE = SUPPORTED_EVIDENCE_MIME_TYPES.join(",");

interface EvidenceStepProps {
  touchDevice: boolean;
  evidenceFiles: ReportEvidenceFile[];
  analysisState: ReportAnalysisState;
  analysisError: string | null;
  onSelectFiles: (files: File[], source: "camera" | "gallery" | "drop") => void;
  onRemoveFile: (id: string) => void;
  onAnalyse: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

function isSupportedMimeType(value: string): value is SupportedEvidenceMimeType {
  return (SUPPORTED_EVIDENCE_MIME_TYPES as readonly string[]).includes(value);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EvidenceStep({
  touchDevice,
  evidenceFiles,
  analysisState,
  analysisError,
  onSelectFiles,
  onRemoveFile,
  onAnalyse,
}: EvidenceStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const liveCaptureRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const canAddMore = evidenceFiles.length < MAX_EVIDENCE_FILES;
  const hasFiles = evidenceFiles.length > 0;
  const isBusy = analysisState === "uploading" || analysisState === "scanning";

  const handleFiles = useCallback(
    (files: FileList | File[], source: "camera" | "gallery" | "drop") => {
      onSelectFiles(Array.from(files), source);
      if (liveCaptureRef.current) {
        liveCaptureRef.current.value = "";
      }
      if (galleryRef.current) {
        galleryRef.current.value = "";
      }
    },
    [onSelectFiles],
  );

  const acceptedCountLabel = useMemo(
    () => `${evidenceFiles.length}/${MAX_EVIDENCE_FILES} files`,
    [evidenceFiles.length],
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {touchDevice ? (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => liveCaptureRef.current?.click()}
            disabled={!canAddMore || isBusy}
            className={`relative flex min-h-[140px] flex-col justify-between rounded-3xl border p-4 text-left transition-all ${
              canAddMore && !isBusy
                ? "border-[var(--color-amber)] bg-[color-mix(in_srgb,var(--color-amber)_8%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-amber)_12%,transparent)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-[color-mix(in_srgb,var(--color-amber)_14%,transparent)] p-3 text-[var(--color-amber)]">
                <Camera size={22} />
              </div>
              {evidenceFiles.length > 0 && (
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                  {acceptedCountLabel}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Live Capture</h3>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Take Photo / Video</p>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Use your camera to capture the hazard right now.</p>
            </div>
            <input
              ref={liveCaptureRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              multiple
              className="sr-only"
              onChange={(event) => {
                if (event.target.files?.length) {
                  handleFiles(event.target.files, "camera");
                }
              }}
            />
          </button>

          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={!canAddMore || isBusy}
            className={`relative flex min-h-[140px] flex-col justify-between rounded-3xl border p-4 text-left transition-all ${
              canAddMore && !isBusy
                ? "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-amber)]/40 hover:bg-[var(--color-surface)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-[color-mix(in_srgb,var(--color-text-muted)_14%,transparent)] p-3 text-[var(--color-text-secondary)]">
                <FolderOpen size={22} />
              </div>
              {evidenceFiles.length > 0 && (
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                  {acceptedCountLabel}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Upload from Device</h3>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Choose from Gallery</p>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Select existing photos or videos from your device.</p>
            </div>
            <input
              ref={galleryRef}
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              multiple
              className="sr-only"
              onChange={(event) => {
                if (event.target.files?.length) {
                  handleFiles(event.target.files, "gallery");
                }
              }}
            />
          </button>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <div
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              if (event.dataTransfer.files.length) {
                handleFiles(event.dataTransfer.files, "drop");
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (canAddMore) {
                setIsDragging(true);
              }
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onClick={() => galleryRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                galleryRef.current?.click();
              }
            }}
            className={`group relative flex min-h-[250px] flex-col items-center justify-center gap-4 rounded-[1.75rem] border-2 border-dashed px-6 py-10 text-center transition-all ${
              isDragging
                ? "border-[var(--color-amber)] bg-[color-mix(in_srgb,var(--color-amber)_6%,transparent)] shadow-[var(--shadow-neu)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-amber)] hover:bg-[var(--color-card)]"
            } ${!canAddMore ? "opacity-65" : ""}`}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[color-mix(in_srgb,var(--color-amber)_12%,transparent)] text-[var(--color-amber)] transition-transform group-hover:scale-105">
              <Upload size={30} strokeWidth={1.8} />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                Drag photos or video, or tap to capture
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Drop files here or choose from your device. Accepts photos and video clips.
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Up to 5 files. Maximum 25 MB per file.
              </p>
            </div>
            <input
              ref={galleryRef}
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              multiple
              className="sr-only"
              onChange={(event) => {
                if (event.target.files?.length) {
                  handleFiles(event.target.files, "gallery");
                }
              }}
            />
          </div>
        </motion.div>
      )}

      <motion.p variants={itemVariants} className="text-xs text-[var(--color-text-muted)]">
        Our AI will auto-detect the hazard type from your evidence.
      </motion.p>

      {analysisError && (
        <motion.div
          variants={itemVariants}
          className="flex items-start gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] px-4 py-3"
        >
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-[var(--color-danger)]" />
          <p className="text-xs text-[var(--color-danger)]">{analysisError}</p>
        </motion.div>
      )}

      <AnimatePresence mode="popLayout">
        {evidenceFiles.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                Uploaded Evidence
              </p>
              {!canAddMore && (
                <span className="rounded-full border border-[color-mix(in_srgb,var(--color-amber)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-amber)_10%,transparent)] px-3 py-1 text-[11px] font-medium text-[var(--color-amber)]">
                  Maximum 5 files reached
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
              {evidenceFiles.map((file) => (
                <motion.div
                  key={file.id}
                  layout
                  className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm"
                >
                  <div className="aspect-square bg-[var(--color-surface)]">
                    {file.previewUrl ? (
                      <img src={file.previewUrl} alt={file.name} className="h-full w-full object-cover" />
                    ) : file.mimeType.startsWith("video/") ? (
                      <div className="flex h-full items-center justify-center">
                        <FileVideo size={24} className="text-[var(--color-text-muted)]" />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FileImage size={24} className="text-[var(--color-text-muted)]" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveFile(file.id)}
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-1 px-3 py-2">
                    <p className="truncate text-[11px] font-medium text-[var(--color-text-primary)]">{file.name}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{formatFileSize(file.size)}</p>
                    {file.errorMessage ? (
                      <p className="text-[10px] font-medium text-[var(--color-danger)]">{file.errorMessage}</p>
                    ) : file.uploadStatus === "uploaded" ? (
                      <p className="text-[10px] font-medium text-[var(--color-success)]">Uploaded</p>
                    ) : file.uploadStatus === "uploading" ? (
                      <p className="text-[10px] font-medium text-[var(--color-amber)]">Uploading…</p>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onAnalyse}
          disabled={!hasFiles || isBusy}
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold transition-all ${
            hasFiles && !isBusy ? "btn-amber" : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"
          }`}
        >
          {analysisState === "scanning" || analysisState === "uploading" ? (
            <>
              <Sparkles size={16} className="animate-pulse" />
              Analysing…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Analyse with AI →
            </>
          )}
        </button>
        <p className="text-xs text-[var(--color-text-muted)]">
          {canAddMore
            ? "Your selected media stays in a single upload set."
            : "Maximum 5 files reached."}
        </p>
      </div>
    </motion.div>
  );
}

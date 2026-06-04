"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Camera,
  X,
  FileImage,
  FileVideo,
  AlertCircle,
} from "lucide-react";
import { useReportStore, type UploadFile } from "@/store/reportStore";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.mp4";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function generateId() {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EvidenceStep() {
  const { formData, addFile, removeFile, updateFileProgress, updateFileStatus } =
    useReportStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = useCallback(
    (uploadFile: UploadFile) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          updateFileProgress(uploadFile.id, 100);
          updateFileStatus(uploadFile.id, "complete");
        } else {
          updateFileProgress(uploadFile.id, Math.floor(progress));
        }
      }, 200);
    },
    [updateFileProgress, updateFileStatus]
  );

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setError(`"${file.name}" is not a supported format. Use JPG, PNG, WEBP, or MP4.`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`"${file.name}" exceeds 10 MB limit.`);
          continue;
        }

        const id = generateId();
        const preview = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;

        const uploadFile: UploadFile = {
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          preview,
          status: "uploading",
        };

        addFile(uploadFile);
        simulateUpload(uploadFile);
      }
    },
    [addFile, simulateUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        processFiles(e.target.files);
      }
      e.target.value = "";
    },
    [processFiles]
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Upload Area */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Upload Evidence
        </label>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative flex flex-col items-center justify-center gap-4 p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
            isDragging
              ? "border-[var(--color-amber)] bg-[color-mix(in_srgb,var(--color-amber)_6%,transparent)] scale-[1.01]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-muted)]"
          }`}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload files by dropping them here or clicking to browse"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          {/* Upload icon */}
          <div className="w-16 h-16 rounded-2xl bg-[color-mix(in_srgb,var(--color-amber)_12%,transparent)] flex items-center justify-center">
            <Upload
              size={28}
              className="text-[var(--color-amber)]"
              strokeWidth={1.8}
            />
          </div>

          <div className="text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Drag and drop or{" "}
              <span className="font-semibold text-[var(--color-text-primary)] underline underline-offset-2">
                choose file
              </span>{" "}
              to upload.
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Supported: JPG, PNG, WEBP, MP4 &middot; Max 10 MB per file
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            onChange={handleFileSelect}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        {/* Camera Capture (mobile) */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="mt-3 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
        >
          <Camera size={18} strokeWidth={1.8} />
          <span className="text-sm font-medium">Capture with Camera</span>
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />

        <p className="mt-3 text-xs text-[var(--color-text-muted)] leading-relaxed">
          Upload clear photos or videos to help verify the reported hazard.
        </p>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 px-4 py-3 rounded-xl bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)]"
        >
          <AlertCircle size={16} className="text-[var(--color-danger)] mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--color-danger)]">{error}</p>
        </motion.div>
      )}

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {formData.files.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="space-y-3"
          >
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              Uploaded Files ({formData.files.length})
            </span>

            {formData.files.map((file) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm"
              >
                {/* Preview / Icon */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-surface)] flex items-center justify-center shrink-0">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : file.type.startsWith("video/") ? (
                    <FileVideo size={20} className="text-[var(--color-info)]" />
                  ) : (
                    <FileImage size={20} className="text-[var(--color-amber)]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {formatFileSize(file.size)}
                  </p>

                  {/* Progress bar */}
                  {file.status === "uploading" && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-[var(--color-amber)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${file.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--color-text-muted)] tabular-nums">
                        {file.progress}%
                      </span>
                    </div>
                  )}

                  {file.status === "complete" && (
                    <span className="text-[11px] text-[var(--color-success)] font-medium">
                      ✓ Uploaded
                    </span>
                  )}
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

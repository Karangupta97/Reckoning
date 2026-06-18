"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileText, Video, Image as ImageIcon } from "lucide-react";
import type { EvidenceFile } from "@/store/evidenceStore";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectType(file: File): EvidenceFile["type"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "pdf";
}

const ICON = { image: ImageIcon, pdf: FileText, video: Video };

interface EvidenceFilePickerProps {
  files: EvidenceFile[];
  onChange: (files: EvidenceFile[]) => void;
  maxFiles?: number;
}

export function EvidenceFilePicker({ files, onChange, maxFiles = 8 }: EvidenceFilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;
      const next: EvidenceFile[] = [...files];
      Array.from(fileList).forEach((file) => {
        if (next.length >= maxFiles) return;
        const type = detectType(file);
        const previewUrl = type === "image" ? URL.createObjectURL(file) : undefined;
        next.push({
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          label: file.name,
          type,
          size: formatSize(file.size),
          previewUrl,
        });
      });
      onChange(next);
    },
    [files, maxFiles, onChange]
  );

  const remove = (id: string) => {
    const removed = files.find((f) => f.id === id);
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    onChange(files.filter((f) => f.id !== id));
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors ${
          dragOver ? "border-cyan-400 bg-cyan-500/10" : "border-[var(--color-border)]"
        }`}
      >
        <Upload size={22} className="text-cyan-400" />
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
          Click or drag files to attach evidence
        </span>
        <span className="text-[10px] text-[var(--color-text-muted)]">Images, PDF, video · max {maxFiles} files</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {files.map((f) => {
            const Icon = ICON[f.type];
            return (
              <div
                key={f.id}
                className="relative aspect-video rounded-lg border overflow-hidden group"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
              >
                {f.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.previewUrl} alt={f.label} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon size={24} className="text-cyan-400 opacity-60" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove file"
                >
                  <X size={12} className="text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 px-2 py-1">
                  <p className="text-[9px] text-white truncate">{f.label}</p>
                  <p className="text-[8px] text-white/70">{f.type} · {f.size}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

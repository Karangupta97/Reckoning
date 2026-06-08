"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Upload,
  FileText,
  Camera,
  Calendar,
  DollarSign,
  Clipboard,
  AlertCircle,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

interface FormData {
  resolutionNotes: string;
  workPerformed: string;
  costIncurred: string;
  completionDate: string;
}

interface FormErrors {
  resolutionNotes?: string;
  completionDate?: string;
  afterImages?: string;
}

function FileUploadZone({
  label,
  required,
  hint,
  hasError,
}: {
  label: string;
  required?: boolean;
  hint: string;
  hasError?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<string[]>([]);

  return (
    <div>
      <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div
        className={`rounded-xl border-2 border-dashed px-4 py-6 flex flex-col items-center gap-2 transition-colors ${
          dragging ? "border-amber-500/50 bg-amber-500/8" : hasError ? "border-red-500/40 bg-red-500/5" : "border-[var(--color-border)] hover:border-amber-500/30 hover:bg-amber-500/4"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = Array.from(e.dataTransfer.files).map((f) => f.name);
          setFiles((prev) => [...prev, ...dropped]);
        }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl border"
          style={{
            borderColor: hasError ? "rgba(239,68,68,0.3)" : "var(--sda-border-amber)",
            background: hasError ? "rgba(239,68,68,0.1)" : "var(--sda-amber-glow)",
          }}
        >
          <Upload size={18} style={{ color: hasError ? "var(--color-danger)" : "var(--sda-amber)" }} />
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-[var(--color-text-primary)]">
            Drag & drop or{" "}
            <label className="cursor-pointer underline" style={{ color: "var(--sda-amber)" }}>
              browse
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const names = Array.from(e.target.files ?? []).map((f) => f.name);
                  setFiles((prev) => [...prev, ...names]);
                }}
              />
            </label>
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{hint}</p>
        </div>
        {files.length > 0 && (
          <div className="w-full mt-1 flex flex-wrap gap-1.5">
            {files.map((f, i) => (
              <span key={i} className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] border"
                style={{ borderColor: "var(--sda-border-amber)", background: "var(--sda-amber-glow)", color: "var(--sda-amber)" }}>
                <Camera size={9} />
                {f.length > 18 ? f.slice(0, 15) + "..." : f}
              </span>
            ))}
          </div>
        )}
      </div>
      {hasError && (
        <p className="mt-1 flex items-center gap-1 text-[10px] text-red-400">
          <AlertCircle size={10} /> After images are required to close the case.
        </p>
      )}
    </div>
  );
}

function SuccessState({ id }: { id: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 gap-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.4)" }}
      >
        <CheckCircle2 size={40} className="text-green-400" />
      </motion.div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Case Closed Successfully</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Complaint {id} has been resolved and the citizen has been notified.
        </p>
      </div>
      <Link href="/sub-district-admin/dashboard/complaints">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 h-10 px-6 rounded-lg border text-sm font-medium"
          style={{
            borderColor: "var(--sda-border-amber)",
            background: "color-mix(in srgb, var(--sda-amber) 12%, transparent)",
            color: "var(--sda-amber)",
          }}
        >
          Back to Complaints
        </motion.button>
      </Link>
    </motion.div>
  );
}

export default function ResolvePage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormData>({
    resolutionNotes: "",
    workPerformed: "",
    costIncurred: "",
    completionDate: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [afterImages, setAfterImages] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.resolutionNotes.trim()) newErrors.resolutionNotes = "Resolution notes are required.";
    if (!form.completionDate) newErrors.completionDate = "Completion date is required.";
    if (!afterImages) newErrors.afterImages = "After images are required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) setSubmitted(true);
  };

  if (submitted) return <SuccessState id={id ?? "CMP-1024"} />;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Link href={`/sub-district-admin/dashboard/complaints/${id}`}>
          <motion.button whileHover={{ x: -2 }} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <ArrowLeft size={16} /> Back
          </motion.button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Case Closure Workflow</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Complaint {id ?? "CMP-1024"}</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Left — Form fields */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <DashboardCard className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
                <Clipboard size={16} style={{ color: "var(--sda-amber)" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Resolution Details</h3>
              </div>

              {/* Resolution Notes */}
              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                  Resolution Notes <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.resolutionNotes}
                  onChange={(e) => setForm({ ...form, resolutionNotes: e.target.value })}
                  placeholder="Describe what was done to resolve this complaint..."
                  rows={4}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface)] resize-none focus:outline-none transition-colors ${
                    errors.resolutionNotes ? "border-red-500/40 focus:border-red-500/60" : "border-[var(--color-border)] focus:border-amber-500/40"
                  }`}
                />
                <AnimatePresence>
                  {errors.resolutionNotes && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-1 flex items-center gap-1 text-[10px] text-red-400">
                      <AlertCircle size={10} /> {errors.resolutionNotes}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Work Performed */}
              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Work Performed</label>
                <textarea
                  value={form.workPerformed}
                  onChange={(e) => setForm({ ...form, workPerformed: e.target.value })}
                  placeholder="Describe specific tasks: patching, resurfacing, material used..."
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] resize-none focus:outline-none focus:border-amber-500/40"
                />
              </div>

              {/* Cost + Date row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                    Cost Incurred (₹)
                  </label>
                  <div className="relative">
                    <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                      type="number"
                      value={form.costIncurred}
                      onChange={(e) => setForm({ ...form, costIncurred: e.target.value })}
                      placeholder="0.00"
                      className="w-full h-10 rounded-lg border pl-8 pr-3 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] focus:outline-none focus:border-amber-500/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                    Completion Date <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                      type="date"
                      value={form.completionDate}
                      onChange={(e) => setForm({ ...form, completionDate: e.target.value })}
                      className={`w-full h-10 rounded-lg border pl-8 pr-3 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface)] focus:outline-none transition-colors ${
                        errors.completionDate ? "border-red-500/40" : "border-[var(--color-border)] focus:border-amber-500/40"
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.completionDate && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mt-1 flex items-center gap-1 text-[10px] text-red-400">
                        <AlertCircle size={10} /> {errors.completionDate}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </DashboardCard>
          </motion.div>

          {/* Right — File uploads */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DashboardCard className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
                <Camera size={16} style={{ color: "var(--sda-amber)" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Evidence & Documents</h3>
              </div>

              <FileUploadZone
                label="Before Images"
                hint="Upload pre-work photos (JPG, PNG, max 10MB each)"
              />

              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                  After Images <span className="text-red-400">*</span>
                </label>
                <div
                  className={`rounded-xl border-2 border-dashed px-4 py-6 flex flex-col items-center gap-2 transition-colors cursor-pointer ${
                    errors.afterImages ? "border-red-500/40 bg-red-500/5" : "border-[var(--color-border)] hover:border-amber-500/30"
                  }`}
                  onClick={() => setAfterImages(true)}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{ borderColor: afterImages ? "rgba(34,197,94,0.4)" : "var(--sda-border-amber)", background: afterImages ? "rgba(34,197,94,0.1)" : "var(--sda-amber-glow)" }}
                  >
                    {afterImages ? <CheckCircle2 size={18} className="text-green-400" /> : <Upload size={18} style={{ color: "var(--sda-amber)" }} />}
                  </div>
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">
                    {afterImages ? "After images ready ✓" : "Click to upload after images"}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">Required — proof of completion (JPG, PNG)</p>
                </div>
                <AnimatePresence>
                  {errors.afterImages && !afterImages && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-1 flex items-center gap-1 text-[10px] text-red-400">
                      <AlertCircle size={10} /> {errors.afterImages}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <FileUploadZone
                label="Supporting Documents"
                hint="Work orders, material receipts, inspection reports (PDF, JPG)"
              />
            </DashboardCard>
          </motion.div>
        </div>

        {/* Action bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-3 mt-4"
        >
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 h-10 px-6 rounded-lg border text-sm font-medium transition-all"
            style={{
              borderColor: "var(--sda-border-amber)",
              background: "color-mix(in srgb, var(--sda-amber) 12%, transparent)",
              color: "var(--sda-amber)",
            }}
          >
            <CheckCircle2 size={15} />
            Close Case
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 h-10 px-5 rounded-lg border text-sm font-medium transition-all"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text-secondary)",
            }}
          >
            <FileText size={14} />
            Save Draft
          </motion.button>
          <Link href={`/sub-district-admin/dashboard/complaints/${id}`}>
            <button
              type="button"
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              Cancel
            </button>
          </Link>
        </motion.div>
      </form>
    </div>
  );
}

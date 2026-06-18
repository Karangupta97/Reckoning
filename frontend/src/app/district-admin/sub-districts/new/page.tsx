"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  Mail,
  Phone,
  User,
  Briefcase,
  Building2,
  MapPin,
  Map,
  Trash2,
  Save,
  Send,
  FileText,
  Info,
  AlertCircle,
  ChevronRight,
  Layers,
  SquareDashedBottom,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { DISTRICT_CONFIG } from "@/lib/district-config";

/* ─── Types ─────────────────────────────────────────────────── */
interface FormData {
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  subDistrictName: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  subDistrictName?: string;
  geofence?: string;
}

type GeofenceStatus = "not_drawn" | "drawing" | "drawn";

/* ─── Constants ─────────────────────────────────────────────── */
const DEPARTMENTS = [
  "Public Works",
  "Sanitation",
  "Water Supply",
  "Urban Planning",
  "Revenue",
  "Health",
  "Education",
  "Infrastructure",
];

const DESIGNATIONS = [
  "Sub-District Officer",
  "Tehsildar",
  "Block Development Officer",
  "Municipal Inspector",
  "Revenue Officer",
  "Field Supervisor",
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay },
});

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function NewSubDistrictAdminPage() {
  const [form, setForm] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    designation: "",
    department: "",
    subDistrictName: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData | "geofence", boolean>>>({});
  const [geofenceStatus, setGeofenceStatus] = useState<GeofenceStatus>("not_drawn");
  const [geofenceArea, setGeofenceArea] = useState<number | null>(null);
  const [geofenceVertices, setGeofenceVertices] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  /* ── Validation ── */
  const validate = useCallback((data: FormData, geoStatus: GeofenceStatus): FormErrors => {
    const e: FormErrors = {};
    if (!data.fullName.trim()) e.fullName = "Full name is required";
    else if (data.fullName.trim().length < 3) e.fullName = "Name must be at least 3 characters";

    if (!data.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Enter a valid email address";

    if (!data.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[+]?[\d\s\-()]{8,15}$/.test(data.phone)) e.phone = "Enter a valid phone number";

    if (!data.designation) e.designation = "Designation is required";
    if (!data.department) e.department = "Department is required";
    if (!data.subDistrictName.trim()) e.subDistrictName = "Sub-district name is required";
    if (geoStatus !== "drawn") e.geofence = "Please draw and save the geofence boundary";

    return e;
  }, []);

  const set = (key: keyof FormData, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (touched[key]) {
      const updated = { ...form, [key]: value };
      const e = validate(updated, geofenceStatus);
      setErrors((prev) => ({ ...prev, [key]: e[key] }));
    }
  };

  const blur = (key: keyof FormData) => {
    setTouched((p) => ({ ...p, [key]: true }));
    const e = validate(form, geofenceStatus);
    setErrors((prev) => ({ ...prev, [key]: e[key] }));
  };

  /* ── Geofence mock actions ── */
  const handleDrawPolygon = () => {
    setGeofenceStatus("drawing");
    // Simulate drawing completion after a moment (replace with real map integration)
    setTimeout(() => {
      setGeofenceStatus("drawn");
      setGeofenceArea(12.4);
      setGeofenceVertices(8);
      setErrors((p) => ({ ...p, geofence: undefined }));
    }, 1500);
  };

  const handleClearPolygon = () => {
    setGeofenceStatus("not_drawn");
    setGeofenceArea(null);
    setGeofenceVertices(0);
    if (touched.geofence) {
      setErrors((p) => ({ ...p, geofence: "Please draw and save the geofence boundary" }));
    }
  };

  /* ── Submit ── */
  const handleSubmit = (e: React.FormEvent, draft = false) => {
    e.preventDefault();
    const allTouched: Partial<Record<keyof FormData | "geofence", boolean>> = {
      fullName: true, email: true, phone: true,
      designation: true, department: true, subDistrictName: true, geofence: true,
    };
    setTouched(allTouched);
    const e2 = validate(form, geofenceStatus);
    setErrors(e2);
    if (Object.keys(e2).length > 0) return;
    setIsDraft(draft);
    setSubmitted(true);
  };

  /* ── Review summary data ── */
  const reviewReady = form.fullName && form.department && form.subDistrictName;

  /* ────────────────────────── SUCCESS STATE ────────────────── */
  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14 }}
          className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-teal-400/40 bg-teal-500/10"
        >
          <div className="absolute inset-0 rounded-full bg-teal-400/10 blur-xl" />
          <CheckCircle2 size={44} className="relative text-teal-400" />
        </motion.div>

        <motion.div {...fadeUp(0.15)} className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {isDraft ? "Draft Saved" : "Invitation Sent"}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {isDraft
              ? `Draft for ${form.fullName} saved. You can complete and send the invite later.`
              : `${form.fullName} has been invited as Sub-District Admin for ${form.subDistrictName}. They'll receive an email to set up their account.`}
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.25)} className="flex items-center gap-3">
          <Link href="/district-admin/sub-districts" className="da-btn-primary flex items-center gap-2">
            <ChevronRight size={15} />
            View Sub-Districts
          </Link>
          <button
            onClick={() => { setSubmitted(false); setForm({ fullName:"",email:"",phone:"",designation:"",department:"",subDistrictName:"" }); setGeofenceStatus("not_drawn"); setErrors({}); setTouched({}); }}
            className="da-btn-secondary"
          >
            Add Another
          </button>
        </motion.div>
      </div>
    );
  }

  /* ────────────────────────── MAIN FORM ───────────────────── */
  return (
    <div className="flex flex-col gap-5 pb-8">

      {/* ── Page Header ── */}
      <motion.div {...fadeUp(0)}>
        <Link
          href="/district-admin/sub-districts"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-teal-400 transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Back to Sub-Districts
        </Link>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10 shadow-[0_0_20px_rgba(20,184,166,0.12)]">
              <UserPlus size={18} className="text-teal-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--color-text-primary)] lg:text-xl">
                Invite Sub-District Admin
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Create a new sub-district administrator and assign operational boundaries
                in <span className="text-teal-400 font-medium">{DISTRICT_CONFIG.name}</span>.
              </p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            {["Admin Info", "Sub-District", "Geofence"].map((step, i) => (
              <div key={step} className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold border-teal-500/30 bg-teal-500/10 text-teal-400">
                    {i + 1}
                  </div>
                  <span className="hidden sm:inline text-[11px] text-[var(--color-text-muted)]">{step}</span>
                </div>
                {i < 2 && <ChevronRight size={11} className="text-[var(--color-text-muted)] shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* Left column — forms (2/3 width on xl) */}
        <div className="flex flex-col gap-5 xl:col-span-2">

          {/* ── Admin Information Card ── */}
          <motion.div {...fadeUp(0.05)}>
            <DashboardCard className="overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10">
                  <User size={15} className="text-teal-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Admin Information</h2>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Personal and professional details of the new administrator</p>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Full Name" required icon={<User size={14} />}
                    value={form.fullName} error={touched.fullName ? errors.fullName : undefined}
                    placeholder="e.g. Rajesh Sharma"
                    onChange={(v) => set("fullName", v)} onBlur={() => blur("fullName")}
                  />
                  <Field
                    label="Email Address" required type="email" icon={<Mail size={14} />}
                    value={form.email} error={touched.email ? errors.email : undefined}
                    placeholder="officer@district.gov.in"
                    onChange={(v) => set("email", v)} onBlur={() => blur("email")}
                  />
                  <Field
                    label="Phone Number" required type="tel" icon={<Phone size={14} />}
                    value={form.phone} error={touched.phone ? errors.phone : undefined}
                    placeholder="+91 98765 43210"
                    onChange={(v) => set("phone", v)} onBlur={() => blur("phone")}
                  />
                  <SelectField
                    label="Designation" required icon={<Briefcase size={14} />}
                    value={form.designation} error={touched.designation ? errors.designation : undefined}
                    options={DESIGNATIONS} placeholder="Select designation"
                    onChange={(v) => set("designation", v)} onBlur={() => blur("designation")}
                  />
                  <SelectField
                    label="Department" required icon={<Building2 size={14} />}
                    value={form.department} error={touched.department ? errors.department : undefined}
                    options={DEPARTMENTS} placeholder="Select department"
                    onChange={(v) => set("department", v)} onBlur={() => blur("department")}
                    className="sm:col-span-2"
                  />
                </div>
              </div>
            </DashboardCard>
          </motion.div>

          {/* ── Sub-District Information Card ── */}
          <motion.div {...fadeUp(0.1)}>
            <DashboardCard className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
                  <MapPin size={15} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Sub-District Information</h2>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Define the operational area this admin will manage</p>
                </div>
              </div>

              <div className="p-5">
                <Field
                  label="Sub-District Name" required icon={<MapPin size={14} />}
                  value={form.subDistrictName} error={touched.subDistrictName ? errors.subDistrictName : undefined}
                  placeholder="e.g. Panvel Taluka"
                  onChange={(v) => set("subDistrictName", v)} onBlur={() => blur("subDistrictName")}
                />
              </div>
            </DashboardCard>
          </motion.div>

          {/* ── Geofence Assignment Card ── */}
          <motion.div {...fadeUp(0.15)}>
            <DashboardCard className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
                  <Layers size={15} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Geofence Assignment</h2>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Draw the operational boundary for this sub-district</p>
                </div>
                {geofenceStatus === "drawn" && (
                  <span className="flex items-center gap-1.5 rounded-full border border-teal-500/25 bg-teal-500/10 px-2.5 py-1 text-[11px] font-medium text-teal-400">
                    <CheckCircle2 size={11} />
                    Boundary Set
                  </span>
                )}
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* Map placeholder */}
                <div
                  className="relative flex h-64 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--color-border)]"
                  style={{ background: "var(--color-surface)" }}
                >
                  {/* Grid background */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
                      backgroundSize: "32px 32px",
                    }}
                  />

                  {/* District outline mock */}
                  <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 256" preserveAspectRatio="xMidYMid meet">
                    <polygon
                      points="80,40 200,20 320,60 360,140 300,220 160,230 60,180 40,100"
                      fill="rgba(20,184,166,0.08)" stroke="rgba(20,184,166,0.4)" strokeWidth="1.5" strokeDasharray="6 3"
                    />
                  </svg>

                  {/* Drawn polygon */}
                  <AnimatePresence>
                    {geofenceStatus === "drawn" && (
                      <motion.svg
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 400 256"
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <polygon
                          points="140,70 230,55 290,90 310,150 260,200 170,205 110,170 100,110"
                          fill="rgba(20,184,166,0.12)" stroke="rgba(20,184,166,0.7)" strokeWidth="2"
                        />
                        {[
                          [140,70],[230,55],[290,90],[310,150],
                          [260,200],[170,205],[110,170],[100,110],
                        ].map(([cx, cy], i) => (
                          <circle key={i} cx={cx} cy={cy} r="4" fill="rgba(20,184,166,0.9)" stroke="white" strokeWidth="1.5" />
                        ))}
                      </motion.svg>
                    )}
                  </AnimatePresence>

                  {/* Drawing animation */}
                  <AnimatePresence>
                    {geofenceStatus === "drawing" && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20 backdrop-blur-[2px]"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="h-8 w-8 rounded-full border-2 border-t-teal-400 border-teal-400/20"
                        />
                        <span className="text-xs font-medium text-teal-300">Drawing boundary…</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Idle state */}
                  {geofenceStatus === "not_drawn" && (
                    <div className="flex flex-col items-center gap-2 text-center px-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
                        <SquareDashedBottom size={22} className="text-[var(--color-text-muted)]" />
                      </div>
                      <p className="text-sm font-medium text-[var(--color-text-secondary)]">No boundary drawn</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Use the controls below to draw the sub-district polygon</p>
                    </div>
                  )}

                  {/* Map label */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1">
                    <Map size={11} className="text-teal-400" />
                    <span className="text-[10px] font-medium text-[var(--color-text-muted)]">{DISTRICT_CONFIG.name}</span>
                  </div>
                </div>

                {/* Map controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleDrawPolygon}
                    disabled={geofenceStatus === "drawing"}
                    className="flex items-center gap-2 h-9 px-4 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50"
                    style={{
                      borderColor: "var(--da-border-teal)",
                      background: "color-mix(in srgb, var(--da-teal) 10%, transparent)",
                      color: "var(--da-teal)",
                    }}
                  >
                    <Pencil size={13} />
                    Draw Polygon
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleClearPolygon}
                    disabled={geofenceStatus === "not_drawn"}
                    className="flex items-center gap-2 h-9 px-4 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40"
                    style={{
                      borderColor: "var(--color-border)",
                      background: "var(--color-surface)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    <Trash2 size={13} />
                    Clear Polygon
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    disabled={geofenceStatus !== "drawn"}
                    className="flex items-center gap-2 h-9 px-4 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40"
                    style={{
                      borderColor: geofenceStatus === "drawn" ? "rgba(16,185,129,0.35)" : "var(--color-border)",
                      background: geofenceStatus === "drawn" ? "rgba(16,185,129,0.10)" : "var(--color-surface)",
                      color: geofenceStatus === "drawn" ? "#10b981" : "var(--color-text-muted)",
                    }}
                  >
                    <Save size={13} />
                    Save Boundary
                  </motion.button>
                </div>

                {/* Boundary statistics */}
                <AnimatePresence>
                  {geofenceStatus === "drawn" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Area Covered", value: `${geofenceArea} km²`, color: "text-teal-400", bg: "bg-teal-500/8 border-teal-500/20" },
                          { label: "Vertices", value: String(geofenceVertices), color: "text-blue-400", bg: "bg-blue-500/8 border-blue-500/20" },
                          { label: "Status", value: "Valid", color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20" },
                        ].map((s) => (
                          <div key={s.label} className={`flex flex-col items-center justify-center rounded-xl border py-3 px-2 ${s.bg}`}>
                            <span className={`text-base font-bold tabular-nums ${s.color}`}>{s.value}</span>
                            <span className="mt-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Helper text */}
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2.5">
                  <Info size={13} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-300/80">
                    Geofence must remain within the current district boundary of{" "}
                    <span className="font-medium text-amber-300">{DISTRICT_CONFIG.name}</span>.
                    Boundaries that extend outside will be automatically clipped.
                  </p>
                </div>

                {/* Geofence error */}
                <AnimatePresence>
                  {touched.geofence && errors.geofence && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 text-xs text-red-400"
                    >
                      <AlertCircle size={12} />
                      {errors.geofence}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </DashboardCard>
          </motion.div>
        </div>

        {/* Right column — review panel (1/3 width on xl) */}
        <div className="flex flex-col gap-5">
          <motion.div {...fadeUp(0.2)} className="xl:sticky xl:top-4">

            {/* ── Review Panel ── */}
            <DashboardCard className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10">
                  <FileText size={15} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Review Summary</h2>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Confirm before sending invite</p>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-4">
                {reviewReady ? (
                  <>
                    {/* Avatar */}
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold"
                        style={{
                          borderColor: "var(--da-border-teal)",
                          background: "color-mix(in srgb, var(--da-teal) 14%, transparent)",
                          color: "var(--da-teal)",
                        }}
                      >
                        {form.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{form.fullName || "—"}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)] truncate">{form.email || "—"}</p>
                      </div>
                    </div>

                    <div className="h-px bg-[var(--color-border)]" />

                    {/* Summary rows */}
                    <div className="flex flex-col gap-3">
                      {[
                        { label: "Department",    value: form.department || "—",       icon: <Building2 size={12} /> },
                        { label: "Designation",   value: form.designation || "—",      icon: <Briefcase size={12} /> },
                        { label: "Sub-District",  value: form.subDistrictName || "—",  icon: <MapPin size={12} /> },
                        {
                          label: "Geofence",
                          value: geofenceStatus === "drawn" ? `${geofenceArea} km² · ${geofenceVertices} pts` : "Not set",
                          icon: <Layers size={12} />,
                          highlight: geofenceStatus === "drawn",
                        },
                      ].map((row) => (
                        <div key={row.label} className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-[var(--color-text-muted)]">
                            <span className="text-[var(--color-text-muted)]">{row.icon}</span>
                            {row.label}
                          </div>
                          <span className={`text-[11px] font-medium text-right truncate max-w-[130px] ${row.highlight ? "text-teal-400" : "text-[var(--color-text-secondary)]"}`}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="h-px bg-[var(--color-border)]" />

                    {/* Readiness checklist */}
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Checklist</p>
                      {[
                        { label: "Admin details", ok: !!(form.fullName && form.email && form.phone) },
                        { label: "Designation & dept.", ok: !!(form.designation && form.department) },
                        { label: "Sub-district name", ok: !!form.subDistrictName },
                        { label: "Geofence drawn", ok: geofenceStatus === "drawn" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <div className={`h-4 w-4 shrink-0 flex items-center justify-center rounded-full border ${item.ok ? "border-teal-500/30 bg-teal-500/10" : "border-[var(--color-border)] bg-[var(--color-surface)]"}`}>
                            {item.ok && <CheckCircle2 size={10} className="text-teal-400" />}
                          </div>
                          <span className={`text-[11px] ${item.ok ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-muted)]"}`}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <FileText size={28} className="text-[var(--color-text-muted)]" />
                    <p className="text-xs text-[var(--color-text-muted)]">Fill in the form to see a summary here</p>
                  </div>
                )}
              </div>
            </DashboardCard>

            {/* ── Action Buttons ── */}
            <div className="mt-4 flex flex-col gap-2.5">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={(e) => handleSubmit(e, false)}
                className="da-btn-primary w-full flex items-center justify-center gap-2 !h-11 font-semibold"
              >
                <Send size={15} />
                Invite Admin
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={(e) => handleSubmit(e, true)}
                className="da-btn-secondary w-full flex items-center justify-center gap-2 !h-10"
              >
                <Save size={14} />
                Save Draft
              </motion.button>
              <Link
                href="/district-admin/sub-districts"
                className="da-btn-secondary w-full flex items-center justify-center gap-2 !h-10 !text-[var(--color-text-muted)] hover:!text-[var(--color-text-primary)]"
              >
                Cancel
              </Link>
            </div>

          </motion.div>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FIELD COMPONENTS
═══════════════════════════════════════════════════════════════ */

interface FieldProps {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  className?: string;
}

function Field({ label, required, type = "text", value, onChange, onBlur, placeholder, error, icon, className = "" }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full h-10 rounded-lg border px-3 text-sm outline-none transition-all focus:shadow-[0_0_0_2px_rgba(20,184,166,0.2)]"
          style={{
            paddingLeft: icon ? "2.25rem" : "0.75rem",
            borderColor: error ? "rgba(239,68,68,0.5)" : "var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.6)" : "rgba(20,184,166,0.45)"; }}
          onBlurCapture={(e) => { e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.5)" : "var(--color-border)"; }}
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1 text-[11px] text-red-400"
          >
            <AlertCircle size={11} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  options: string[];
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  className?: string;
}

function SelectField({ label, required, value, onChange, onBlur, options, placeholder, error, icon, className = "" }: SelectFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none z-10">
            {icon}
          </span>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="w-full h-10 appearance-none rounded-lg border pr-8 text-sm outline-none transition-all cursor-pointer focus:shadow-[0_0_0_2px_rgba(20,184,166,0.2)]"
          style={{
            paddingLeft: icon ? "2.25rem" : "0.75rem",
            borderColor: error ? "rgba(239,68,68,0.5)" : "var(--color-border)",
            background: "var(--color-surface)",
            color: value ? "var(--color-text-primary)" : "var(--color-text-muted)",
          }}
        >
          <option value="" style={{ background: "var(--color-card)", color: "var(--color-text-muted)" }}>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o} value={o} style={{ background: "var(--color-card)", color: "var(--color-text-primary)" }}>
              {o}
            </option>
          ))}
        </select>
        {/* Chevron */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1 text-[11px] text-red-400"
          >
            <AlertCircle size={11} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

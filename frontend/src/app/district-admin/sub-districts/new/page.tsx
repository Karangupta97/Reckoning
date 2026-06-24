"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, UserPlus, CheckCircle2, Mail,
  MapPin, Copy, Shield, Check, Globe, Loader2,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useAdminUserStore } from "@/store/adminUserStore";
import {
  MUMBAI_SUB_DISTRICTS,
  RAIGAD_SUB_DISTRICTS,
  MUMBAI_CITY_SUB_DISTRICTS,
} from "@/lib/governance/district-structure";
import type { AdminUser } from "@/store/adminUserStore";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { shouldUseMock } from "@/lib/useMock";
import { api } from "@/lib/api";
import { useDistrictInfo } from "@/hooks/useDistrictInfo";

const MUMBAI_SUB_DISTRICT_NAMES = MUMBAI_SUB_DISTRICTS.map((s) => s.name);
const MUMBAI_CITY_SUB_DISTRICT_NAMES = MUMBAI_CITY_SUB_DISTRICTS.map((s) => s.name);
const RAIGAD_SUB_DISTRICT_NAMES = RAIGAD_SUB_DISTRICTS.map((s) => s.name);

interface FormData { email: string; subDistrict: string; }
interface FormErrors { email?: string; subDistrict?: string; boundary?: string; }

async function fetchBoundaryFromNominatim(
  subDistrictName: string,
): Promise<{ type: "Polygon"; coordinates: number[][][] } | null> {
  try {
    const q = `${subDistrictName}, Mumbai, Maharashtra, India`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&polygon_geojson=1&limit=1`;
    const res = await fetch(url, { headers: { "User-Agent": "Reckoning-Admin/1.0" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    const result = data[0];
    if (result.geojson) {
      if (result.geojson.type === "Polygon") return result.geojson;
      if (result.geojson.type === "MultiPolygon") {
        const coords = result.geojson.coordinates as number[][][][];
        const largest = coords.reduce((max, ring) => ring[0].length > max[0].length ? ring : max);
        return { type: "Polygon", coordinates: largest };
      }
    }
    if (result.boundingbox) {
      const [south, north, west, east] = result.boundingbox.map(Number);
      return { type: "Polygon", coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] };
    }
    return null;
  } catch { return null; }
}

export default function NewSubDistrictAdminPage() {
  const currentAdmin = useAdminAuthStore((s) => s.admin);
  const isMock = shouldUseMock(currentAdmin?.email);
  const createSubDistrictAdmin = useAdminUserStore((s) => s.createSubDistrictAdmin);
  const { districtName } = useDistrictInfo();

  const [form, setForm] = useState<FormData>({ email: "", subDistrict: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [createdUser, setCreatedUser] = useState<AdminUser | null>(null);
  const [copied, setCopied] = useState(false);
  const [boundaryLoading, setBoundaryLoading] = useState(false);
  const [fetchedBoundary, setFetchedBoundary] = useState<{ type: "Polygon"; coordinates: number[][][] } | null>(null);
  const [boundaryStatus, setBoundaryStatus] = useState<"idle" | "fetching" | "success" | "error">("idle");

  const { data: existingSubDistricts } = useQuery({
    queryKey: ["mySubDistricts"],
    queryFn: async () => {
      const res = await api.get("/api/admin/my-district/sub-districts");
      return res.data?.data?.subDistricts ?? [];
    },
    enabled: !isMock,
  });

  const handleSubDistrictChange = useCallback(async (name: string) => {
    setForm((f) => ({ ...f, subDistrict: name }));
    setFetchedBoundary(null);
    setBoundaryStatus("idle");
    if (!name) return;
    setBoundaryLoading(true);
    setBoundaryStatus("fetching");
    const boundary = await fetchBoundaryFromNominatim(name);
    setBoundaryLoading(false);
    if (boundary) { setFetchedBoundary(boundary); setBoundaryStatus("success"); }
    else { setBoundaryStatus("error"); }
  }, []);

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; subDistrict: string; geofence: { type: "Polygon"; coordinates: number[][][] } }) => {
      const res = await api.post("/api/admin/sub-district/invite", {
        email: data.email,
        fullName: data.email.split("@")[0].replace(/[._]/g, " "),
        phone: "+910000000000",
        designation: "Sub-District Infrastructure Officer",
        department: "Road Safety Operations",
        subDistrictName: data.subDistrict,
        geofence: data.geofence,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setCreatedUser({
        id: data.adminId || "N/A",
        email: form.email,
        role: "Sub-District Admin",
        subDistrict: form.subDistrict,
        status: "Pending Onboarding",
        tempPassword: "Sent via activation email link",
        passwordChanged: false,
        createdBy: currentAdmin?.id || "",
        createdDate: new Date().toLocaleDateString(),
        parentAuthority: "District Admin",
        designation: "Sub-District Officer",
        department: "Road Safety Operations",
        district: districtName,
      });
    },
    onError: (err: any) => {
      setErrors({ email: err.response?.data?.error?.message || "Failed to invite sub-district admin" });
    },
  });

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.email.trim()) e.email = "Official email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.subDistrict) e.subDistrict = "Sub-district is required";
    if (!fetchedBoundary && boundaryStatus !== "fetching" && !isMock) {
      e.boundary = "Boundary could not be fetched. Select a valid sub-district.";
    }
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (isMock) {
      const user = createSubDistrictAdmin({
        email: form.email, designation: "Sub-District Officer",
        subDistrict: form.subDistrict, department: "Road Safety Operations",
        district: districtName,
      });
      setCreatedUser(user);
    } else {
      if (!fetchedBoundary) return;
      inviteMutation.mutate({ email: form.email, subDistrict: form.subDistrict, geofence: fetchedBoundary });
    }
  };

  const handleCopy = () => {
    if (!createdUser) return;
    const text = isMock
      ? `User ID: ${createdUser.id}\nEmail: ${createdUser.email}\nRole: ${createdUser.role}\nSub-District: ${createdUser.subDistrict}\nTemporary Password: ${createdUser.tempPassword}`
      : `Invitation ID: ${createdUser.id}\nEmail: ${createdUser.email}\nRole: ${createdUser.role}\nSub-District: ${createdUser.subDistrict}\nActivation Link: Sent to user email`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Success Modal ── */
  if (createdUser) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14 }}
          className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-teal-400/40 bg-teal-500/10">
          <CheckCircle2 size={44} className="relative text-teal-400" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Sub-District Admin Created</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Account pending onboarding. Share credentials securely.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="w-full max-w-sm rounded-xl border p-4 flex flex-col gap-2"
          style={{ borderColor: "rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.04)" }}>
          {[
            { label: "User ID", value: createdUser.id },
            { label: "Email", value: createdUser.email },
            { label: "Role", value: createdUser.role },
            { label: "Sub-District", value: createdUser.subDistrict ?? "—" },
            { label: "Status", value: createdUser.status },
            { label: "Boundary", value: fetchedBoundary ? "Geo-fetched ✓" : "Mock" },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted)]">{r.label}</span>
              <span className="text-[11px] font-bold text-[var(--color-text-primary)] font-mono">{r.value}</span>
            </div>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex gap-3">
          <button onClick={handleCopy}
            className="flex items-center gap-2 h-9 px-4 rounded-lg border text-xs font-medium transition-all"
            style={{ borderColor: "rgba(20,184,166,0.35)", background: "rgba(20,184,166,0.08)", color: "#14b8a6" }}>
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Credentials</>}
          </button>
          <Link href="/district-admin/dashboard/sub-districts/all-sub-districts">
            <button className="flex items-center gap-2 h-9 px-4 rounded-lg border text-xs font-medium"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
              View All Sub-Districts
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Link href="/district-admin/dashboard/sub-districts/all-sub-districts"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
          <ArrowLeft size={14} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Create Sub-District Admin</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">Onboard new officer for {districtName} District • Boundary auto-fetched</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <DashboardCard className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="rounded-lg border px-3 py-2.5 flex items-start gap-2"
              style={{ borderColor: "rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.04)" }}>
              <Shield size={13} className="text-blue-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                System generates a User ID and temporary password. The new admin must change password on first login before accessing the dashboard. Boundary polygon is geo-fetched from OpenStreetMap.
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5 mb-1.5">
                <Mail size={12} /> Official Email
              </label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="officer.andheri@gov.in"
                className="w-full h-10 rounded-lg border px-3 text-sm outline-none transition-colors"
                style={{ background: "var(--color-surface)", borderColor: errors.email ? "rgba(239,68,68,0.5)" : "var(--color-border)", color: "var(--color-text-primary)" }} />
              {errors.email && <p className="text-[10px] text-red-400 mt-1">{errors.email}</p>}
            </div>

            {/* Sub-District */}
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5 mb-1.5">
                <MapPin size={12} /> Sub-District
              </label>
              <select value={form.subDistrict} onChange={(e) => handleSubDistrictChange(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-sm outline-none appearance-none"
                style={{ background: "var(--color-surface)", borderColor: errors.subDistrict ? "rgba(239,68,68,0.5)" : "var(--color-border)", color: "var(--color-text-primary)" }}>
                <option value="">Select sub-district…</option>
                <optgroup label="Mumbai Suburban">
                  {MUMBAI_SUB_DISTRICT_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
                </optgroup>
                <optgroup label="Mumbai City">
                  {MUMBAI_CITY_SUB_DISTRICT_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
                </optgroup>
                <optgroup label="Raigad">
                  {RAIGAD_SUB_DISTRICT_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
                </optgroup>
              </select>
              {errors.subDistrict && <p className="text-[10px] text-red-400 mt-1">{errors.subDistrict}</p>}
            </div>

            {/* Boundary fetch status */}
            {form.subDistrict && (
              <div className="rounded-lg border px-3 py-2.5 flex items-center gap-2"
                style={{
                  borderColor: boundaryStatus === "success" ? "rgba(20,184,166,0.3)" : boundaryStatus === "error" ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.2)",
                  background: boundaryStatus === "success" ? "rgba(20,184,166,0.04)" : boundaryStatus === "error" ? "rgba(239,68,68,0.04)" : "rgba(59,130,246,0.04)",
                }}>
                {boundaryStatus === "fetching" && <><Loader2 size={13} className="text-blue-400 animate-spin" /><span className="text-[11px] text-blue-400">Fetching boundary from OpenStreetMap…</span></>}
                {boundaryStatus === "success" && fetchedBoundary && <><Globe size={13} className="text-teal-400" /><span className="text-[11px] text-teal-400">Boundary fetched — {fetchedBoundary.coordinates[0].length} vertices</span></>}
                {boundaryStatus === "error" && <><Globe size={13} className="text-red-400" /><span className="text-[11px] text-red-400">Could not fetch boundary. Try a different name.</span></>}
              </div>
            )}
            {errors.boundary && <p className="text-[10px] text-red-400">{errors.boundary}</p>}

            {/* Existing sub-districts from API */}
            {existingSubDistricts && existingSubDistricts.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  Existing Sub-Districts ({existingSubDistricts.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {existingSubDistricts.map((sd: any) => (
                    <span key={sd.id} className="text-[10px] px-2 py-0.5 rounded-full border"
                      style={{ borderColor: "rgba(20,184,166,0.3)", color: "#14b8a6", background: "rgba(20,184,166,0.05)" }}>
                      {sd.name} {sd.geofence ? "✓" : "—"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Account preview */}
            <div className="flex flex-col gap-0.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Account Preview</p>
              {[
                { label: "Title", value: "Sub-District Infrastructure Officer" },
                { label: "Role", value: "Sub-District Admin" },
                { label: "Department", value: "Road Safety Operations" },
                { label: "Boundary", value: boundaryStatus === "success" ? "Geo-fetched from OSM ✓" : "Pending selection" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--color-text-muted)] w-20 shrink-0">{row.label}</span>
                  <span className="text-[10px] text-[var(--color-text-secondary)]">{row.value}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-text-muted)] w-20 shrink-0">Status</span>
                <span className="text-[9px] font-semibold" style={{ color: "#f59e0b" }}>Pending Onboarding</span>
              </div>
            </div>

            {/* Submit */}
            <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              disabled={boundaryLoading || inviteMutation.isPending}
              className="flex items-center justify-center gap-2 h-11 rounded-lg border text-sm font-semibold transition-all mt-2 disabled:opacity-50"
              style={{ borderColor: "rgba(20,184,166,0.4)", background: "rgba(20,184,166,0.1)", color: "#14b8a6" }}>
              {inviteMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : <><UserPlus size={15} /> Create Sub-District Admin</>}
            </motion.button>
          </form>
        </DashboardCard>
      </motion.div>
    </div>
  );
}

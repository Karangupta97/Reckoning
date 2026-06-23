"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, UserPlus, CheckCircle2, Mail,
  MapPin, Copy, Eye, Shield, Check,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useAdminUserStore } from "@/store/adminUserStore";
import { DISTRICT_CONFIG } from "@/lib/district-config";
import type { AdminUser } from "@/store/adminUserStore";

import { useMutation } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { shouldUseMock } from "@/lib/useMock";
import { api } from "@/lib/api";

const SUB_DISTRICTS = ["Panvel", "Alibag", "Karjat", "Mahad", "Murud", "Mangaon", "Pen", "Khalapur"];

interface FormData { email: string; subDistrict: string; }
interface FormErrors { email?: string; subDistrict?: string; }

export default function NewSubDistrictAdminPage() {
  const currentAdmin = useAdminAuthStore((s) => s.admin);
  const isMock = shouldUseMock(currentAdmin?.email);

  const createSubDistrictAdmin = useAdminUserStore((s) => s.createSubDistrictAdmin);
  const [form, setForm] = useState<FormData>({ email: "", subDistrict: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [createdUser, setCreatedUser] = useState<AdminUser | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; subDistrict: string }) => {
      const res = await api.post("/api/admin/invitations/send", {
        email: data.email,
        role: "SUB_DISTRICT_ADMIN",
        districtId: currentAdmin?.districtId || null,
        subDistrictId: data.subDistrict.toLowerCase(),
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setCreatedUser({
        id: data.invitationId ? `INV-${data.invitationId.substring(0, 8)}` : "N/A",
        email: data.email,
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
        district: "",
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
        district: DISTRICT_CONFIG.name,
      });
      setCreatedUser(user);
    } else {
      inviteMutation.mutate({ email: form.email, subDistrict: form.subDistrict });
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
            { label: "Temporary Password", value: createdUser.tempPassword ?? "—" },
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
              <Eye size={12} /> View Users
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Link href="/district-admin/dashboard/sub-districts/all-sub-districts"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
          <ArrowLeft size={14} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Create Sub-District Admin</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">Onboard new officer for {DISTRICT_CONFIG.name} District</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <DashboardCard className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Info banner */}
            <div className="rounded-lg border px-3 py-2.5 flex items-start gap-2"
              style={{ borderColor: "rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.04)" }}>
              <Shield size={13} className="text-blue-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                System generates a User ID and temporary password. The new admin must change password on first login before accessing the dashboard.
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5 mb-1.5">
                <Mail size={12} /> Official Email
              </label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="officer.panvel@gov.in"
                className="w-full h-10 rounded-lg border px-3 text-sm outline-none transition-colors"
                style={{ background: "var(--color-surface)", borderColor: errors.email ? "rgba(239,68,68,0.5)" : "var(--color-border)", color: "var(--color-text-primary)" }} />
              {errors.email && <p className="text-[10px] text-red-400 mt-1">{errors.email}</p>}
            </div>

            {/* Sub-District */}
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5 mb-1.5">
                <MapPin size={12} /> Sub-District
              </label>
              <select value={form.subDistrict} onChange={(e) => setForm({ ...form, subDistrict: e.target.value })}
                className="w-full h-10 rounded-lg border px-3 text-sm outline-none appearance-none"
                style={{ background: "var(--color-surface)", borderColor: errors.subDistrict ? "rgba(239,68,68,0.5)" : "var(--color-border)", color: "var(--color-text-primary)" }}>
                <option value="">Select sub-district…</option>
                {SUB_DISTRICTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.subDistrict && <p className="text-[10px] text-red-400 mt-1">{errors.subDistrict}</p>}
            </div>

            {/* Account preview — metadata strip */}
            <div className="flex flex-col gap-0.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Account Preview</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-text-muted)] w-20 shrink-0">Title</span>
                <span className="text-[10px] text-[var(--color-text-secondary)]">Sub-District Infrastructure Officer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-text-muted)] w-20 shrink-0">Role</span>
                <span className="text-[10px] text-[var(--color-text-secondary)]">Sub-District Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-text-muted)] w-20 shrink-0">Department</span>
                <span className="text-[10px] text-[var(--color-text-secondary)]">Road Safety Operations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-text-muted)] w-20 shrink-0">Status</span>
                <span className="text-[9px] font-semibold" style={{ color: "#f59e0b" }}>Pending Onboarding</span>
              </div>
            </div>

            {/* Submit */}
            <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 h-11 rounded-lg border text-sm font-semibold transition-all mt-2"
              style={{ borderColor: "rgba(20,184,166,0.4)", background: "rgba(20,184,166,0.1)", color: "#14b8a6" }}>
              <UserPlus size={15} /> Create Sub-District Admin
            </motion.button>
          </form>
        </DashboardCard>
      </motion.div>
    </div>
  );
}

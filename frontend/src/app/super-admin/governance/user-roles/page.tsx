"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, UserPlus, CheckCircle2, Mail, MapPin,
  Copy, Check, X, Users, Clock, AlertTriangle,
  ChevronDown, Search, Building2,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useAdminUserStore, type AdminUser as MockAdminUser, type UserStatus } from "@/store/adminUserStore";
import OnboardingRequests from "@/components/super-admin-dashboard/onboarding-requests";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { shouldUseMock } from "@/lib/useMock";

const DISTRICTS_DATA = [
  { name: "Raigad", division: "Konkan", code: "RGD", id: "RGD" },
  { name: "Mumbai City", division: "Konkan", code: "MUM", id: "MUM" },
  { name: "Pune", division: "Pune", code: "PUN", id: "PUN" },
  { name: "Nagpur", division: "Nagpur", code: "NGP", id: "NGP" },
  { name: "Thane", division: "Konkan", code: "THN", id: "THN" },
  { name: "Kolhapur", division: "Pune", code: "KLP", id: "KLP" },
  { name: "Nashik", division: "Nashik", code: "NSK", id: "NSK" },
  { name: "Aurangabad", division: "Aurangabad", code: "AUR", id: "AUR" },
];

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  "Pending Onboarding": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  Active: { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  Inactive: { color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  Suspended: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  Archived: { color: "#475569", bg: "rgba(71,85,105,0.1)" },
};

/* ─── District Selector Component ─── */
function DistrictSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = DISTRICTS_DATA.find((d) => d.name === value);
  const filtered = DISTRICTS_DATA.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.division.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, typeof DISTRICTS_DATA>>((acc, d) => {
    if (!acc[d.division]) acc[d.division] = [];
    acc[d.division].push(d);
    return acc;
  }, {});

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5 mb-2">
        <MapPin size={12} className="text-teal-400" /> District
      </label>
      <div
        className="w-full h-11 rounded-xl border px-3.5 flex items-center gap-2.5 cursor-text transition-all duration-200 focus-within:outline-none"
        style={{
          background: "var(--color-surface)",
          borderColor: open ? "rgba(20,184,166,0.5)" : "var(--color-border)",
          boxShadow: open ? "0 0 0 3px rgba(20,184,166,0.06), 0 1px 3px rgba(0,0,0,0.05)" : "0 1px 2px rgba(0,0,0,0.03)",
        }}
        onClick={() => { if (!open) { setOpen(true); } }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
          style={{
            background: open ? "rgba(20,184,166,0.1)" : selected ? "rgba(20,184,166,0.08)" : "rgba(100,116,139,0.06)",
            border: `1px solid ${open ? "rgba(20,184,166,0.3)" : selected ? "rgba(20,184,166,0.2)" : "rgba(100,116,139,0.12)"}`,
          }}
        >
          {open ? (
            <Search size={13} className="text-teal-400" />
          ) : (
            <Building2 size={13} className={selected ? "text-teal-400" : "text-[var(--color-text-muted)]"} />
          )}
        </div>

        {open ? (
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to search district..."
            className="flex-1 text-sm bg-transparent outline-none border-none ring-0 focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            style={{ boxShadow: "none", outline: "none" }}
          />
        ) : (
          <div className="flex-1 min-w-0" onClick={() => setOpen(true)}>
            {selected ? (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{selected.name}</span>
                <span className="text-[10px] text-[var(--color-text-muted)] -mt-0.5">{selected.division} Division • {selected.code}</span>
              </div>
            ) : (
              <span className="text-sm text-[var(--color-text-muted)]">Select district...</span>
            )}
          </div>
        )}

        {open && search && (
          <button onClick={() => setSearch("")} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] shrink-0">
            <X size={12} />
          </button>
        )}
        <ChevronDown
          size={14}
          className="text-[var(--color-text-muted)] shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-1.5 z-[60] rounded-xl border shadow-lg overflow-hidden"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}
          >
            <div className="max-h-56 overflow-y-auto px-1.5 py-1.5 scrollbar-thin">
              {Object.keys(grouped).length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-[var(--color-text-muted)]">No districts found</p>
                </div>
              ) : (
                Object.entries(grouped).map(([division, districts]) => (
                  <div key={division} className="mb-1 last:mb-0">
                    <div className="px-2.5 py-1.5">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                        {division} Division
                      </span>
                    </div>
                    {districts.map((d) => {
                      const isSelected = value === d.name;
                      return (
                        <motion.button
                          key={d.name}
                          type="button"
                          whileHover={{ x: 2 }}
                          onClick={() => { onChange(d.name); setOpen(false); setSearch(""); }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
                          style={{
                            background: isSelected ? "rgba(20,184,166,0.08)" : "transparent",
                          }}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: isSelected ? "rgba(20,184,166,0.15)" : "rgba(100,116,139,0.06)",
                              border: `1px solid ${isSelected ? "rgba(20,184,166,0.3)" : "rgba(100,116,139,0.1)"}`,
                            }}
                          >
                            <span className="text-[9px] font-bold" style={{ color: isSelected ? "#14b8a6" : "var(--color-text-muted)" }}>
                              {d.code}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[11px] font-medium truncate ${isSelected ? "text-teal-400" : "text-[var(--color-text-primary)]"}`}>
                              {d.name}
                            </p>
                            <p className="text-[9px] text-[var(--color-text-muted)]">{d.division} Division</p>
                          </div>
                          {isSelected && (
                            <Check size={12} className="text-teal-400 shrink-0" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function UserRolesPage() {
  const queryClient = useQueryClient();
  const currentAdmin = useAdminAuthStore((s) => s.admin);
  const isMock = shouldUseMock(currentAdmin?.email);

  // Zustand fallback stores for Mock user
  const mockUsers = useAdminUserStore((s) => s.users);
  const mockCreate = useAdminUserStore((s) => s.createDistrictAdmin);
  const mockSuspend = useAdminUserStore((s) => s.suspendUser);
  const mockActivate = useAdminUserStore((s) => s.activateUser);

  // State hooks
  const [showCreate, setShowCreate] = useState(false);
  const [createdUser, setCreatedUser] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ email: "", district: "" });
  const [formError, setFormError] = useState("");

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Query and Mutation hooks for live mode
  const { data: liveUsers, isLoading } = useQuery({
    queryKey: ["super-admin-admins"],
    queryFn: async () => {
      const res = await api.get("/api/super-admin/admins");
      return res.data?.data;
    },
    enabled: !isMock,
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: string; districtId: string }) => {
      const res = await api.post("/api/super-admin/invite", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-admins"] });
      setCreatedUser({
        email: form.email,
        role: "District Admin",
        district: form.district,
      });
      setShowCreate(false);
      setForm({ email: "", district: "" });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || "Invitation failed.");
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/api/super-admin/admins/${id}/suspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-admins"] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/api/super-admin/admins/${id}/reactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-admins"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/super-admin/admins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-admins"] });
    },
  });

  const users = isMock ? mockUsers : (liveUsers || []);

  const districtAdmins = users.filter((u: any) => u.role === "District Admin");
  const subDistrictAdmins = users.filter((u: any) => u.role === "Sub-District Admin");
  const activeCount = users.filter((u: any) => u.status === "Active").length;
  const pendingCount = users.filter((u: any) => u.status === "Pending Onboarding").length;
  const suspendedCount = users.filter((u: any) => u.status === "Suspended").length;

  const handleCreate = () => {
    if (!form.email || !form.district) { setFormError("All fields are required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setFormError("Invalid email"); return; }
    setFormError("");

    if (isMock) {
      const user = mockCreate({ email: form.email, designation: "District Infrastructure Commissioner", district: form.district, department: "Road Safety & Infrastructure" });
      setCreatedUser(user);
      setShowCreate(false);
      setForm({ email: "", district: "" });
    } else {
      const dist = DISTRICTS_DATA.find(d => d.name === form.district);
      inviteMutation.mutate({
        email: form.email,
        role: "DISTRICT_ADMIN",
        districtId: dist?.id || "",
      });
    }
  };

  const handleCopy = () => {
    if (!createdUser) return;
    const inviteLink = `${window.location.origin}/admin/accept-invite?token=invited`;
    navigator.clipboard.writeText(`Email: ${createdUser.email}\nRole: ${createdUser.role}\nDistrict: ${createdUser.district}\nInvite Link: ${inviteLink}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  // Safe handlers with confirmation modals
  const triggerSuspend = (id: string, email: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Suspend Administrator",
      description: `Are you sure you want to suspend access for ${email}? They will be logged out immediately.`,
      onConfirm: () => {
        if (isMock) {
          mockSuspend(id, "Super Admin");
        } else {
          suspendMutation.mutate(id);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const triggerDelete = (id: string, email: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Revoke / Delete Administrator",
      description: `Are you sure you want to permanently revoke permissions for ${email}? This action is destructive and irreversible.`,
      onConfirm: () => {
        if (isMock) {
          // Mock archive
          useAdminUserStore.getState().archiveUser(id, "Super Admin");
        } else {
          deleteMutation.mutate(id);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const triggerActivate = (id: string) => {
    if (isMock) {
      mockActivate(id, "Super Admin");
    } else {
      activateMutation.mutate(id);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-cyan-400" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">User Roles & Governance</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Manage admin hierarchy and onboarding</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border text-xs font-semibold"
          style={{ borderColor: "rgba(20,184,166,0.35)", background: "rgba(20,184,166,0.08)", color: "#14b8a6" }}>
          <UserPlus size={13} /> Create District Admin
        </motion.button>
      </motion.div>

      {/* KPIs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Users", value: String(users.length), color: "#8b5cf6", icon: Users },
          { label: "Active", value: String(activeCount), color: "#22c55e", icon: CheckCircle2 },
          { label: "Pending Onboarding", value: String(pendingCount), color: "#f59e0b", icon: Clock },
          { label: "Suspended", value: String(suspendedCount), color: "#ef4444", icon: AlertTriangle },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${s.color}12`, border: `1px solid ${s.color}25`, color: s.color }}>
              <s.icon size={16} />
            </div>
            <div>
              <div className="text-lg font-black tabular-nums" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">{s.label}</div>
            </div>
          </DashboardCard>
        ))}
      </motion.div>

      {/* Success Banner */}
      <AnimatePresence>
        {createdUser && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <DashboardCard className="p-4 flex items-center justify-between"
              style={{ borderColor: "rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.04)" }}>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-teal-400" />
                <div>
                  <p className="text-xs font-bold text-teal-400">District Admin Invited Successfully</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">An activation email has been sent to {createdUser.email}.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="text-[10px] font-medium text-teal-400 flex items-center gap-1">
                  {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy Details</>}
                </button>
                <button onClick={() => setCreatedUser(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"><X size={14} /></button>
              </div>
            </DashboardCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Directory Table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="flex flex-col overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">User Directory</h3>
            <span className="text-[10px] text-[var(--color-text-muted)]">
              {isMock ? "Mock local store mode" : "Live database sync active"}
            </span>
          </div>
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead><tr>{["ID", "Email", "Role", "District", "Sub-District", "Status", "Created", "Actions"].map((h) => (
                <th key={h} className="dashboard-table-th">{h}</th>
              ))}</tr></thead>
              <tbody>
                {isLoading && !isMock ? (
                  <tr>
                    <td colSpan={8} className="dashboard-table-td text-center text-xs text-[var(--color-text-muted)] py-6">Loading administrators directory...</td>
                  </tr>
                ) : (
                  users.map((u: any) => {
                    const sc = STATUS_CFG[u.status] || { color: "#64748b", bg: "rgba(100,116,139,0.1)" };
                    return (
                      <tr key={u.id} className="dashboard-table-row">
                        <td className="dashboard-table-td font-mono text-xs font-bold text-purple-400">{u.id}</td>
                        <td className="dashboard-table-td text-xs text-[var(--color-text-secondary)]">{u.email}</td>
                        <td className="dashboard-table-td text-[10px] font-medium text-[var(--color-text-primary)]">{u.role}</td>
                        <td className="dashboard-table-td text-xs text-[var(--color-text-muted)]">{u.district}</td>
                        <td className="dashboard-table-td text-xs text-[var(--color-text-muted)]">{u.subDistrict ?? "—"}</td>
                        <td className="dashboard-table-td">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                            style={{ color: sc.color, background: sc.bg, borderColor: `${sc.color}30` }}>{u.status}</span>
                        </td>
                        <td className="dashboard-table-td text-[10px] text-[var(--color-text-muted)]">{u.createdDate}</td>
                        <td className="dashboard-table-td">
                          <div className="flex items-center gap-2">
                            {u.status === "Active" && (
                              <button onClick={() => triggerSuspend(u.id, u.email)}
                                className="text-[9px] font-medium text-red-400 hover:underline">Suspend</button>
                            )}
                            {u.status === "Suspended" && (
                              <button onClick={() => triggerActivate(u.id)}
                                className="text-[9px] font-medium text-green-400 hover:underline">Activate</button>
                            )}
                            {u.status !== "Archived" && (
                              <button onClick={() => triggerDelete(u.id, u.email)}
                                className="text-[9px] font-medium text-red-500 hover:underline">Revoke</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </motion.div>

      {/* Governance Hierarchy */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <DashboardCard className="p-5">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Governance Hierarchy</h3>
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-lg border px-4 py-2 text-center" style={{ borderColor: "rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.06)" }}>
              <span className="text-xs font-bold text-cyan-400">Infrastructure Governance Authority</span>
              <span className="text-[9px] text-[var(--color-text-muted)] ml-2">(1 active)</span>
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">↓</span>
            <div className="rounded-lg border px-4 py-2 text-center" style={{ borderColor: "rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.06)" }}>
              <span className="text-xs font-bold text-teal-400">District Infrastructure Commissioners</span>
              <span className="text-[9px] text-[var(--color-text-muted)] ml-2">({districtAdmins.filter((u: any) => u.status === "Active").length} active)</span>
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">↓</span>
            <div className="rounded-lg border px-4 py-2 text-center" style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)" }}>
              <span className="text-xs font-bold text-amber-400">Sub-District Infrastructure Officers</span>
              <span className="text-[9px] text-[var(--color-text-muted)] ml-2">({subDistrictAdmins.filter((u: any) => u.status === "Active").length} active)</span>
            </div>
          </div>
        </DashboardCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <OnboardingRequests />
      </motion.div>

      {/* Create District Admin Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-lg sm:max-w-xl md:max-w-2xl rounded-2xl border shadow-xl flex flex-col overflow-visible"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)" }}>
                    <UserPlus size={18} className="text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text-primary)]">Create District Admin</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">Assign a new district administrator</p>
                  </div>
                </div>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"><X size={16} /></button>
              </div>
              {/* Body */}
              <div className="flex-1 overflow-visible px-6 py-5 flex flex-col gap-4">
                {formError && <p className="text-xs text-red-400 font-medium bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">{formError}</p>}
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5 mb-2"><Mail size={12} className="text-teal-400" /> Official Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="district.name@gov.in" className="w-full h-11 rounded-xl border px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/50"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
                <DistrictSelector
                  value={form.district}
                  onChange={(val) => setForm({ ...form, district: val })}
                />
                <div className="flex flex-col gap-1 pt-3 mt-2 border-t border-[var(--color-border)]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Account Preview</p>
                  <div className="grid grid-cols-[100px_1fr] gap-y-2 gap-x-3">
                    <span className="text-xs text-[var(--color-text-muted)]">Title</span>
                    <span className="text-xs text-[var(--color-text-secondary)] font-medium">District Infrastructure Commissioner</span>
                    <span className="text-xs text-[var(--color-text-secondary)] font-medium">District Admin</span>
                    <span className="text-xs text-[var(--color-text-muted)]">Department</span>
                    <span className="text-xs text-[var(--color-text-secondary)] font-medium">Road Safety & Infrastructure</span>
                    <span className="text-xs text-[var(--color-text-muted)]">Status</span>
                    <span className="text-[10px] font-semibold" style={{ color: "#f59e0b" }}>Pending Onboarding</span>
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
                <button onClick={() => setShowCreate(false)}
                  className="h-10 px-5 rounded-xl border text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
                  style={{ borderColor: "var(--color-border)", background: "transparent" }}>Cancel</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCreate}
                  disabled={inviteMutation.isPending}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl border text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50"
                  style={{ borderColor: "rgba(20,184,166,0.4)", background: "rgba(20,184,166,0.1)", color: "#14b8a6" }}>
                  <UserPlus size={14} /> {inviteMutation.isPending ? "Inviting..." : "Create District Admin"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setConfirmModal(prev => ({ ...prev, isOpen: false })); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border p-6 flex flex-col gap-4 shadow-xl"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle size={22} />
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">{confirmModal.title}</h3>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{confirmModal.description}</p>
              <div className="flex items-center justify-end gap-3 mt-2">
                <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="h-9 px-4 rounded-xl border text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                  style={{ borderColor: "var(--color-border)" }}>Cancel</button>
                <button onClick={confirmModal.onConfirm}
                  className="h-9 px-4 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

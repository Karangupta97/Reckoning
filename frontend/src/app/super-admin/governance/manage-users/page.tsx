"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, Mail, ShieldAlert,
  Trash2, X, Search, Globe, Shield, CheckCircle2, AlertTriangle
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { shouldUseMock } from "@/lib/useMock";

const MOCK_CITIZENS = [
  { id: "USR-1001", email: "karan@reckoning.dev", fullName: "Karan Gupta", country: "INDIA", isVerified: true, role: "CITIZEN", createdDate: "20 Jun 2026" },
  { id: "USR-1002", email: "citizen.one@medicares.in", fullName: "Amit Sharma", country: "INDIA", isVerified: true, role: "CITIZEN", createdDate: "18 Jun 2026" },
  { id: "USR-1003", email: "nepal.reporting@gmail.com", fullName: "Ram Bahadur", country: "NEPAL", isVerified: false, role: "CITIZEN", createdDate: "15 Jun 2026" },
  { id: "USR-1004", email: "bangla.safety@yahoo.com", fullName: "Tariq Islam", country: "BANGLADESH", isVerified: true, role: "CITIZEN", createdDate: "10 Jun 2026" },
];

export default function ManageUsersPage() {
  const queryClient = useQueryClient();
  const currentAdmin = useAdminAuthStore((s) => s.admin);
  const isMock = shouldUseMock(currentAdmin?.email);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", fullName: "", password: "", country: "INDIA" });
  const [formError, setFormError] = useState("");

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

  // Query & Mutations for live mode
  const { data: liveData, isLoading } = useQuery({
    queryKey: ["super-admin-users", search, page],
    queryFn: async () => {
      const res = await api.get("/api/super-admin/users", {
        params: { search: search || undefined, page, limit: 10 },
      });
      return res.data?.data;
    },
    enabled: !isMock,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await api.post("/api/super-admin/users", userData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-users"] });
      setShowCreate(false);
      setForm({ email: "", fullName: "", password: "", country: "INDIA" });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || "Creation failed.");
    },
  });

  const toggleVerifyMutation = useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
      await api.put(`/api/super-admin/users/${id}`, { isVerified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-users"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/super-admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-users"] });
    },
  });

  // Mock list state
  const [mockList, setMockList] = useState(MOCK_CITIZENS);

  const users = useMemo(() => {
    if (isMock) {
      const q = search.toLowerCase().trim();
      return mockList.filter(
        (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    return liveData?.users || [];
  }, [isMock, mockList, liveData, search]);

  const totalPages = isMock ? 1 : (liveData?.pagination?.totalPages || 1);

  const handleCreate = () => {
    if (!form.email || !form.fullName || !form.password) {
      setFormError("All fields are required");
      return;
    }
    setFormError("");

    if (isMock) {
      const newUser = {
        id: `USR-${1005 + mockList.length}`,
        email: form.email,
        fullName: form.fullName,
        country: form.country,
        isVerified: true,
        role: "CITIZEN",
        createdDate: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
      };
      setMockList([newUser, ...mockList]);
      setShowCreate(false);
      setForm({ email: "", fullName: "", password: "", country: "INDIA" });
    } else {
      createUserMutation.mutate(form);
    }
  };

  const triggerToggleVerify = (id: string, currentVal: boolean, email: string) => {
    setConfirmModal({
      isOpen: true,
      title: currentVal ? "De-verify User" : "Verify User",
      description: `Are you sure you want to change verification status for ${email}?`,
      onConfirm: () => {
        if (isMock) {
          setMockList(mockList.map((u) => u.id === id ? { ...u, isVerified: !currentVal } : u));
        } else {
          toggleVerifyMutation.mutate({ id, isVerified: !currentVal });
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const triggerDeleteUser = (id: string, email: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Citizen Account",
      description: `Are you sure you want to permanently delete the account of ${email}? This action is destructive and cannot be undone.`,
      onConfirm: () => {
        if (isMock) {
          setMockList(mockList.filter((u) => u.id !== id));
        } else {
          deleteUserMutation.mutate(id);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-cyan-400" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Citizen User Directory</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Manage registered citizens and reporting credentials</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border text-xs font-semibold"
          style={{ borderColor: "rgba(20,184,166,0.35)", background: "rgba(20,184,166,0.08)", color: "#14b8a6" }}>
          <UserPlus size={13} /> Create Citizen User
        </motion.button>
      </motion.div>

      {/* Directory Table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <DashboardCard className="flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] justify-between">
            <div
              className="flex items-center gap-2 rounded-lg border px-3 h-9 w-full sm:max-w-xs"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            >
              <Search size={13} className="text-[var(--color-text-muted)] shrink-0" />
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search citizens by name/email…"
                className="bg-transparent text-xs outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] w-full"
              />
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">
              {isMock ? "Mock fallback environment" : "Connected to live database"}
            </span>
          </div>

          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  {["ID", "Name", "Email", "Country", "Role", "Verification Status", "Joined", "Actions"].map((h) => (
                    <th key={h} className="dashboard-table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && !isMock ? (
                  <tr>
                    <td colSpan={8} className="dashboard-table-td text-center text-xs text-[var(--color-text-muted)] py-6">Loading citizen directories...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="dashboard-table-td text-center text-xs text-[var(--color-text-muted)] py-6">No users found.</td>
                  </tr>
                ) : (
                  users.map((u: any) => (
                    <tr key={u.id} className="dashboard-table-row">
                      <td className="dashboard-table-td font-mono text-xs font-bold text-cyan-400">{u.id}</td>
                      <td className="dashboard-table-td text-xs font-semibold text-[var(--color-text-primary)]">{u.fullName}</td>
                      <td className="dashboard-table-td text-xs text-[var(--color-text-secondary)]">{u.email}</td>
                      <td className="dashboard-table-td text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Globe size={11} className="text-teal-400" />
                          {u.country}
                        </span>
                      </td>
                      <td className="dashboard-table-td text-[10px] font-mono">{u.role}</td>
                      <td className="dashboard-table-td">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border cursor-pointer ${
                            u.isVerified
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                          onClick={() => triggerToggleVerify(u.id, u.isVerified, u.email)}
                        >
                          {u.isVerified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="dashboard-table-td text-[10px] text-[var(--color-text-muted)]">{u.createdDate}</td>
                      <td className="dashboard-table-td">
                        <div className="flex items-center gap-2">
                          <button onClick={() => triggerDeleteUser(u.id, u.email)}
                            className="text-[9px] font-medium text-red-400 hover:underline flex items-center gap-1">
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isMock && totalPages > 1 && (
            <div className="px-4 py-3 border-t border-[var(--color-border)] flex justify-between items-center">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 text-xs border rounded-lg hover:bg-[var(--color-surface)] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-[var(--color-text-muted)]">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 text-xs border rounded-lg hover:bg-[var(--color-surface)] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </DashboardCard>
      </motion.div>

      {/* Create Citizen User Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border shadow-xl flex flex-col overflow-visible"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
                <div className="flex items-center gap-3">
                  <UserPlus size={18} className="text-teal-400" />
                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text-primary)]">Create Citizen User</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">Register a new citizen account directly</p>
                  </div>
                </div>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"><X size={16} /></button>
              </div>
              {/* Body */}
              <div className="flex-1 overflow-visible px-6 py-5 flex flex-col gap-4">
                {formError && <p className="text-xs text-red-400 font-medium bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">{formError}</p>}
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 block">Full Name</label>
                  <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="John Doe" className="w-full h-11 rounded-xl border px-4 text-sm outline-none transition-all"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 block">Email Address</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john.doe@gmail.com" className="w-full h-11 rounded-xl border px-4 text-sm outline-none transition-all"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 block">Initial Password</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••" className="w-full h-11 rounded-xl border px-4 text-sm outline-none transition-all"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 block">Country</label>
                  <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full h-11 rounded-xl border px-4 text-sm outline-none transition-all"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                    {["INDIA", "BANGLADESH", "NEPAL", "SRI_LANKA", "MYANMAR", "THAILAND", "BHUTAN"].map(c => (
                      <option key={c} value={c} style={{ background: "var(--color-card)" }}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
                <button onClick={() => setShowCreate(false)}
                  className="h-10 px-5 rounded-xl border text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                  style={{ borderColor: "var(--color-border)", background: "transparent" }}>Cancel</button>
                <button onClick={handleCreate}
                  disabled={createUserMutation.isPending}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl border text-sm font-semibold hover:shadow-lg disabled:opacity-50"
                  style={{ borderColor: "rgba(20,184,166,0.4)", background: "rgba(20,184,166,0.1)", color: "#14b8a6" }}>
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </button>
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

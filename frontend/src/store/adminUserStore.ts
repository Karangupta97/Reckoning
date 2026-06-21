/**
 * adminUserStore.ts — Governance onboarding: admin user lifecycle management.
 * Super Admin → District Admin → Sub-District Admin hierarchy.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adminPersistOptions } from "@/lib/store-persist";
import { useAuditLogStore } from "@/store/auditLogStore";
import { useAdminNotificationStore } from "@/store/adminNotificationStore";

export type AdminRole = "Super Admin" | "District Admin" | "Sub-District Admin";
export type UserStatus = "Pending Onboarding" | "Active" | "Inactive" | "Suspended" | "Archived";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  designation: string;
  department: string;
  district: string;
  subDistrict?: string;
  status: UserStatus;
  tempPassword?: string;
  passwordChanged: boolean;
  createdBy: string;
  createdDate: string;
  lastLogin?: string;
  parentAuthority: string;
}

function nowStr(): string {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} ${d.getFullYear()}`;
}

function genTempPassword(): string {
  return `TEMP#${Math.floor(1000 + Math.random() * 9000)}`;
}

import { GOVERNANCE_ADMIN_USERS } from "@/lib/governance/seeds";

const SEED = GOVERNANCE_ADMIN_USERS;

interface AdminUserState {
  users: AdminUser[];
  nextDistrictId: number;
  nextSubDistrictId: number;
  createDistrictAdmin: (input: { email: string; designation: string; district: string; department: string }) => AdminUser;
  createSubDistrictAdmin: (input: { email: string; designation: string; subDistrict: string; department: string; district: string }) => AdminUser;
  completeOnboarding: (id: string) => void;
  changePassword: (id: string) => void;
  suspendUser: (id: string, actor: string) => void;
  activateUser: (id: string, actor: string) => void;
  archiveUser: (id: string, actor: string) => void;
  resetPassword: (id: string, actor: string) => string;
  getActiveByRole: (role: AdminRole) => AdminUser[];
  getByDistrict: (district: string) => AdminUser[];
  getById: (id: string) => AdminUser | undefined;
}

export const useAdminUserStore = create<AdminUserState>()(
  persist(
    (set, get) => ({
      users: SEED,
      nextDistrictId: 2003,
      nextSubDistrictId: 3005,

      createDistrictAdmin: (input) => {
        const id = `USR-${get().nextDistrictId}`;
        set({ nextDistrictId: get().nextDistrictId + 1 });
        const tempPassword = genTempPassword();
        const user: AdminUser = {
          id, email: input.email, role: "District Admin",
          designation: input.designation, department: input.department,
          district: input.district, status: "Pending Onboarding",
          tempPassword, passwordChanged: false,
          createdBy: "USR-1001", createdDate: nowStr(),
          parentAuthority: "Super Admin",
        };
        set({ users: [user, ...get().users] });
        useAuditLogStore.getState().addEntry({
          userRole: "Super Admin", actor: "Super Admin",
          action: `District Admin created — ${input.email} (${input.district})`,
          entityId: id, previousStatus: "—", newStatus: "Pending Onboarding",
          category: "Governance", ip: "192.168.1.10",
        });
        useAdminNotificationStore.getState().push({
          portal: "super", type: "governance_decision",
          title: "District Admin Created", message: `${id} — ${input.email} — ${input.district}`,
          entityId: id, href: "/super-admin/governance/user-roles",
        });
        return user;
      },

      createSubDistrictAdmin: (input) => {
        const id = `USR-${get().nextSubDistrictId}`;
        set({ nextSubDistrictId: get().nextSubDistrictId + 1 });
        const tempPassword = genTempPassword();
        const user: AdminUser = {
          id, email: input.email, role: "Sub-District Admin",
          designation: input.designation, department: input.department,
          district: input.district, subDistrict: input.subDistrict,
          status: "Pending Onboarding", tempPassword, passwordChanged: false,
          createdBy: "USR-2001", createdDate: nowStr(),
          parentAuthority: `District Admin (${input.district})`,
        };
        set({ users: [user, ...get().users] });
        useAuditLogStore.getState().addEntry({
          userRole: "District Admin", actor: "District Admin",
          action: `Sub-District Admin created — ${input.email} (${input.subDistrict})`,
          entityId: id, previousStatus: "—", newStatus: "Pending Onboarding",
          category: "Governance", ip: "10.0.0.42",
        });
        useAdminNotificationStore.getState().push({
          portal: "district", type: "governance_decision",
          title: "Sub-District Admin Created", message: `${id} — ${input.email} — ${input.subDistrict}`,
          entityId: id, href: "/district-admin/dashboard/sub-districts/all-sub-districts",
        });
        return user;
      },

      completeOnboarding: (id) => {
        set({ users: get().users.map((u) => u.id === id ? { ...u, status: "Active" as const, lastLogin: nowStr() } : u) });
        const user = get().users.find((u) => u.id === id);
        if (!user) return;
        useAuditLogStore.getState().addEntry({
          userRole: user.role, actor: user.role,
          action: `First login completed — ${user.email}`,
          entityId: id, previousStatus: "Pending Onboarding", newStatus: "Active",
          category: "Governance", ip: "10.0.0.1",
        });
        const portal = user.role === "District Admin" ? "super" : "district";
        useAdminNotificationStore.getState().push({
          portal, type: "governance_decision",
          title: `${user.role} onboarded`, message: `${id} — ${user.email} completed setup`,
          entityId: id, href: portal === "super" ? "/super-admin/governance/user-roles" : "/district-admin/dashboard/sub-districts/all-sub-districts",
        });
      },

      changePassword: (id) => {
        set({ users: get().users.map((u) => u.id === id ? { ...u, passwordChanged: true, tempPassword: undefined, status: "Active" as const } : u) });
        useAuditLogStore.getState().addEntry({
          userRole: "System", actor: "System",
          action: `Password changed — ${id}`,
          entityId: id, previousStatus: "Pending Onboarding", newStatus: "Active",
          category: "Governance", ip: "10.0.0.1",
        });
      },

      suspendUser: (id, actor) => {
        const user = get().users.find((u) => u.id === id);
        if (!user) return;
        const prev = user.status;
        set({ users: get().users.map((u) => u.id === id ? { ...u, status: "Suspended" as const } : u) });
        useAuditLogStore.getState().addEntry({
          userRole: actor, actor,
          action: `Account suspended — ${user.email}`,
          entityId: id, previousStatus: prev, newStatus: "Suspended",
          category: "Governance", ip: "192.168.1.10",
        });
        const parentPortal = user.role === "District Admin" ? "super" : "district";
        useAdminNotificationStore.getState().push({
          portal: parentPortal as "super" | "district", type: "governance_decision",
          title: "Account Suspended", message: `${id} — ${user.email}`,
          entityId: id, href: parentPortal === "super" ? "/super-admin/governance/user-roles" : "/district-admin/dashboard/sub-districts/all-sub-districts",
        });
      },

      activateUser: (id, actor) => {
        const user = get().users.find((u) => u.id === id);
        if (!user) return;
        const prev = user.status;
        set({ users: get().users.map((u) => u.id === id ? { ...u, status: "Active" as const } : u) });
        useAuditLogStore.getState().addEntry({
          userRole: actor, actor,
          action: `Account activated — ${user.email}`,
          entityId: id, previousStatus: prev, newStatus: "Active",
          category: "Governance", ip: "192.168.1.10",
        });
      },

      archiveUser: (id, actor) => {
        const user = get().users.find((u) => u.id === id);
        if (!user) return;
        set({ users: get().users.map((u) => u.id === id ? { ...u, status: "Archived" as const } : u) });
        useAuditLogStore.getState().addEntry({
          userRole: actor, actor,
          action: `Account archived — ${user.email}`,
          entityId: id, previousStatus: user.status, newStatus: "Archived",
          category: "Governance", ip: "192.168.1.10",
        });
      },

      resetPassword: (id, actor) => {
        const newPass = genTempPassword();
        set({ users: get().users.map((u) => u.id === id ? { ...u, tempPassword: newPass, passwordChanged: false } : u) });
        useAuditLogStore.getState().addEntry({
          userRole: actor, actor,
          action: `Password reset — ${id}`,
          entityId: id, previousStatus: "Active", newStatus: "Active",
          category: "Governance", ip: "192.168.1.10",
        });
        return newPass;
      },

      getActiveByRole: (role) => get().users.filter((u) => u.role === role && u.status === "Active"),
      getByDistrict: (district) => get().users.filter((u) => u.district === district),
      getById: (id) => get().users.find((u) => u.id === id),
    }),
    adminPersistOptions("admin-users", (s) => ({ users: s.users, nextDistrictId: s.nextDistrictId, nextSubDistrictId: s.nextSubDistrictId }))
  )
);

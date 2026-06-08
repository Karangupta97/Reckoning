"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardCard } from "./dashboard-card";
import {
  UserPlus,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type RequestStatus = "Pending" | "Approved" | "Rejected";

interface OnboardingRequest {
  id: string;
  name: string;
  role: string;
  department: string;
  status: RequestStatus;
  date: string;
}

const initialRequests: OnboardingRequest[] = [
  {
    id: "REQ-1001",
    name: "Rajesh Kumar",
    role: "District Engineer",
    department: "PWD Maharashtra",
    status: "Pending",
    date: "03 Jun 2026",
  },
  {
    id: "REQ-1002",
    name: "Priya Sharma",
    role: "Audit Officer",
    department: "Infrastructure Audit Cell",
    status: "Approved",
    date: "02 Jun 2026",
  },
  {
    id: "REQ-1003",
    name: "Amit Verma",
    role: "Project Manager",
    department: "NHAI",
    status: "Pending",
    date: "02 Jun 2026",
  },
  {
    id: "REQ-1004",
    name: "Sneha Iyer",
    role: "Compliance Officer",
    department: "Road Safety Board",
    status: "Rejected",
    date: "01 Jun 2026",
  },
];

const statusBadgeClass: Record<RequestStatus, string> = {
  Pending: "dashboard-table-badge-status-escalated",
  Approved: "dashboard-table-badge-status-resolved",
  Rejected: "dashboard-table-badge-status-open",
};

const statusIcon: Record<RequestStatus, LucideIcon> = {
  Pending: Clock3,
  Approved: CheckCircle2,
  Rejected: XCircle,
};

export default function OnboardingRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);

  const updateStatus = useCallback((id: string, status: RequestStatus) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status } : req))
    );
  }, []);

  return (
    <DashboardCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5"
    >
      <div className="onboarding-header">
        <div>
          <h3 className="text-primary text-sm font-semibold lg:text-base">
            Admin Onboarding Requests
          </h3>
          <p className="text-muted mt-1 text-xs">
            Pending access approvals & governance requests
          </p>
        </div>
        <button type="button" onClick={() => router.push("/super-admin/governance/user-roles")} className="btn-secondary shrink-0 !h-9 !px-3 !text-xs">
          Manage All
        </button>
      </div>

      <ul className="onboarding-list">
        {requests.map((request, index) => {
          const StatusIcon = statusIcon[request.status];
          const isPending = request.status === "Pending";

          return (
            <motion.li
              key={request.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="onboarding-row"
            >
              <div className="onboarding-row-main">
                <div className="onboarding-row-avatar">
                  <UserPlus size={18} aria-hidden />
                </div>
                <div className="onboarding-row-info">
                  <h4 className="onboarding-row-name">{request.name}</h4>
                  <p className="onboarding-row-role">{request.role}</p>
                  <p className="onboarding-row-dept">{request.department}</p>
                  <p className="onboarding-row-id">{request.id}</p>
                </div>
              </div>

              <div className="onboarding-row-actions">
                <span className="onboarding-row-date">{request.date}</span>

                <span
                  className={`dashboard-table-badge inline-flex items-center gap-1 ${statusBadgeClass[request.status]}`}
                >
                  <StatusIcon size={12} aria-hidden />
                  {request.status}
                </span>

                {isPending && (
                  <>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateStatus(request.id, "Approved")}
                      className="onboarding-btn-approve"
                    >
                      Approve
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateStatus(request.id, "Rejected")}
                      className="onboarding-btn-reject"
                    >
                      Reject
                    </motion.button>
                  </>
                )}

                {request.status === "Approved" && (
                  <span className="onboarding-status-granted">
                    <ShieldCheck size={14} aria-hidden />
                    Access Granted
                  </span>
                )}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}

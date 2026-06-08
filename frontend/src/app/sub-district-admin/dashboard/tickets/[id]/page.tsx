"use client";

import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCheck,
  Users,
  Package,
  Clock,
  FileText,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Camera,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

function getMockTicket(id: string) {
  return {
    id,
    relatedComplaint: "CMP-1024",
    title: "Road Resurfacing — Sector 7 Junction",
    description: "Complete resurfacing of the damaged road section at Sector 7 junction. Includes pothole filling, base layer repair, and top coat application.",
    priority: "Critical",
    status: "In Progress",
    created: "2025-01-14",
    due: "2025-01-16",
    team: {
      name: "Road Crew Alpha",
      lead: "V. Kamble",
      members: ["R. More", "S. Jadhav", "A. Pawar"],
      contact: "+91 98123 45678",
    },
    materials: [
      { item: "Bitumen (Grade 60/70)", qty: "200 kg", cost: "₹12,000" },
      { item: "Aggregate (10mm)", qty: "500 kg", cost: "₹4,500" },
      { item: "Road Cones", qty: "20 units", cost: "₹2,000" },
      { item: "Primers & Solvents", qty: "5 L", cost: "₹1,200" },
    ],
    timeline: [
      { label: "Ticket Created", time: "Jan 14, 09:30 AM", icon: ClipboardCheck, done: true },
      { label: "Team Assigned", time: "Jan 14, 10:15 AM", icon: Users, done: true },
      { label: "Material Procurement", time: "Jan 14, 02:00 PM", icon: Package, done: true },
      { label: "Work In Progress", time: "Jan 15, 08:00 AM", icon: Wrench, done: true },
      { label: "Inspection & Sign-off", time: "Jan 16 — Pending", icon: CheckCircle2, done: false },
    ],
    notes: "Site survey completed. Pothole depth measured at 15cm. Requires full base layer repair before resurfacing. Area cordoned off with cones. Adjacent properties notified.",
    attachments: [
      { name: "Site_Survey_TKT0501.pdf", size: "2.1 MB" },
      { name: "Material_Invoice.pdf", size: "0.8 MB" },
      { name: "Pre-work_Photo.jpg", size: "3.4 MB" },
    ],
  };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-[var(--color-border)] last:border-0">
      <span className="text-xs text-[var(--color-text-muted)] shrink-0 w-28">{label}</span>
      <span className="text-xs text-[var(--color-text-primary)] text-right">{value}</span>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, delay = 0 }: {
  title: string; icon: React.ElementType; children: React.ReactNode; delay?: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <DashboardCard className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
          <Icon size={15} style={{ color: "var(--sda-amber)" }} />
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{title}</h3>
        </div>
        {children}
      </DashboardCard>
    </motion.div>
  );
}

const statusBadge: Record<string, string> = {
  Open: "dashboard-table-badge-status-open",
  "In Progress": "dashboard-table-badge-status-review",
  Overdue: "dashboard-table-badge-status-open",
  Completed: "dashboard-table-badge-status-resolved",
};
const priorityBadge: Record<string, string> = {
  Critical: "dashboard-table-badge-status-open",
  High: "dashboard-table-badge-status-escalated",
  Medium: "dashboard-table-badge-status-review",
  Low: "dashboard-table-badge-status-resolved",
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = getMockTicket(id ?? "TKT-0501");

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3">
        <Link href="/sub-district-admin/dashboard/tickets">
          <motion.button whileHover={{ x: -2 }} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <ArrowLeft size={16} /> Back
          </motion.button>
        </Link>
        <span className="font-mono text-xs font-bold" style={{ color: "var(--sda-amber)" }}>{t.id}</span>
        <span className={`dashboard-table-badge ${priorityBadge[t.priority] ?? ""}`}>{t.priority}</span>
        <span className={`dashboard-table-badge ${statusBadge[t.status] ?? ""}`}>{t.status}</span>
        <span className="text-xs text-[var(--color-text-muted)] ml-auto">Due: {t.due}</span>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left — main */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Ticket Info */}
          <SectionCard title="Ticket Info" icon={ClipboardCheck} delay={0.05}>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">{t.title}</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{t.description}</p>
            <InfoRow label="Related Complaint" value={
              <Link href={`/sub-district-admin/dashboard/complaints/${t.relatedComplaint}`}>
                <span className="font-mono hover:underline" style={{ color: "var(--sda-amber)" }}>{t.relatedComplaint}</span>
              </Link>
            } />
            <InfoRow label="Created" value={t.created} />
            <InfoRow label="Due Date" value={<span className={t.status === "Overdue" ? "text-red-400 font-bold" : ""}>{t.due}</span>} />
          </SectionCard>

          {/* Materials Used */}
          <SectionCard title="Materials Used" icon={Package} delay={0.1}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {["Material", "Quantity", "Cost"].map((h) => (
                      <th key={h} className="pb-2 text-left text-[var(--color-text-muted)] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.materials.map((m, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors">
                      <td className="py-2 text-[var(--color-text-primary)] font-medium">{m.item}</td>
                      <td className="py-2 text-[var(--color-text-secondary)]">{m.qty}</td>
                      <td className="py-2 font-mono" style={{ color: "var(--sda-amber)" }}>{m.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Activity Timeline */}
          <SectionCard title="Activity Timeline" icon={Clock} delay={0.15}>
            <div className="flex flex-col gap-0 relative">
              <div
                className="absolute left-3.5 top-3.5 bottom-3.5 w-px"
                style={{ background: "linear-gradient(to bottom, var(--sda-border-amber), rgba(245,158,11,0.1))" }}
              />
              {t.timeline.map((step, i) => (
                <div key={i} className="flex gap-3 pb-4 last:pb-0 relative">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border relative z-10"
                    style={{
                      borderColor: step.done ? "rgba(34,197,94,0.4)" : "var(--color-border)",
                      background: step.done ? "rgba(34,197,94,0.1)" : "var(--color-surface)",
                    }}
                  >
                    <step.icon size={12} style={{ color: step.done ? "var(--color-success)" : "var(--color-text-muted)" }} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className={`text-xs font-semibold ${step.done ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right — sidebar */}
        <div className="flex flex-col gap-4">
          {/* Assigned Team */}
          <SectionCard title="Assigned Team" icon={Users} delay={0.08}>
            <div
              className="flex items-center gap-3 rounded-xl border px-3 py-2.5 mb-2"
              style={{ borderColor: "var(--sda-border-amber)", background: "var(--sda-amber-glow)" }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold"
                style={{ borderColor: "var(--sda-border-amber)", background: "rgba(245,158,11,0.1)", color: "var(--sda-amber)" }}
              >
                {t.team.lead.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--color-text-primary)]">{t.team.name}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">Lead: {t.team.lead}</p>
              </div>
            </div>
            <InfoRow label="Members" value={t.team.members.join(", ")} />
            <InfoRow label="Contact" value={t.team.contact} />
          </SectionCard>

          {/* Notes */}
          <SectionCard title="Notes" icon={FileText} delay={0.13}>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{t.notes}</p>
            <textarea
              placeholder="Add new note..."
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] resize-none focus:outline-none focus:border-amber-500/40 mt-2"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-8 rounded-lg border text-xs font-medium transition-all"
              style={{
                borderColor: "var(--sda-border-amber)",
                background: "color-mix(in srgb, var(--sda-amber) 10%, transparent)",
                color: "var(--sda-amber)",
              }}
            >
              Save Note
            </motion.button>
          </SectionCard>

          {/* Attachments */}
          <SectionCard title="Attachments" icon={Paperclip} delay={0.18}>
            <div className="flex flex-col gap-2">
              {t.attachments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:border-amber-500/20 transition-colors cursor-pointer"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <Camera size={13} style={{ color: "var(--sda-amber)" }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{a.name}</p>
                    <p className="text-[9px] text-[var(--color-text-muted)]">{a.size}</p>
                  </div>
                </div>
              ))}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 h-8 rounded-lg border text-xs text-[var(--color-text-muted)] transition-all hover:border-amber-500/20 hover:text-[var(--sda-amber)]"
                style={{ borderColor: "var(--color-border)", borderStyle: "dashed" }}
              >
                + Upload Attachment
              </motion.button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

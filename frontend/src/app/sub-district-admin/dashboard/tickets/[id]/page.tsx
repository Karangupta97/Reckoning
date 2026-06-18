"use client";

import { useState } from "react";
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
  Wrench,
  Camera,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  useComplaintWorkflowStore,
  type TicketPriority,
  type TicketStatus,
} from "@/store/complaintWorkflowStore";

const TIMELINE_ICONS: Record<string, LucideIcon> = {
  "Ticket Created": ClipboardCheck,
  "Team Assigned": Users,
  "Material Procurement": Package,
  "Work In Progress": Wrench,
  "Work Completed": CheckCircle2,
  "Inspection & Sign-off": CheckCircle2,
};

function timelineIcon(label: string): LucideIcon {
  if (label.startsWith("Status →")) return CheckCircle2;
  return TIMELINE_ICONS[label] ?? Clock;
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

const STATUSES: TicketStatus[] = ["Open", "In Progress", "Overdue", "Completed"];
const PRIORITIES: TicketPriority[] = ["Critical", "High", "Medium", "Low"];

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticket = useComplaintWorkflowStore((s) => s.tickets.find((t) => t.id === id));
  const updateTicketStatus = useComplaintWorkflowStore((s) => s.updateTicketStatus);
  const updateTicketPriority = useComplaintWorkflowStore((s) => s.updateTicketPriority);
  const assignTicketOfficer = useComplaintWorkflowStore((s) => s.assignTicketOfficer);
  const appendTicketNote = useComplaintWorkflowStore((s) => s.appendTicketNote);

  const [newNote, setNewNote] = useState("");
  const [officerInput, setOfficerInput] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  if (!ticket) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center py-16">
        <p className="text-sm text-[var(--color-text-muted)]">Ticket {id} not found.</p>
        <Link href="/sub-district-admin/dashboard/tickets" className="text-sm hover:underline" style={{ color: "var(--sda-amber)" }}>
          ← Back to tickets
        </Link>
      </div>
    );
  }

  const materials = ticket.materials ?? [];
  const attachments = ticket.attachments ?? [];
  const teamLead = ticket.teamLead ?? ticket.assignedOfficer;
  const teamMembers = ticket.teamMembers ?? [];
  const teamContact = ticket.teamContact ?? "—";

  const handleSaveNote = () => {
    if (!newNote.trim()) return;
    appendTicketNote(ticket.id, newNote);
    setNewNote("");
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
  };

  const handleAssignOfficer = () => {
    if (!officerInput.trim()) return;
    assignTicketOfficer(ticket.id, officerInput.trim());
    setOfficerInput("");
  };

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3">
        <Link href="/sub-district-admin/dashboard/tickets">
          <motion.button whileHover={{ x: -2 }} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <ArrowLeft size={16} /> Back
          </motion.button>
        </Link>
        <span className="font-mono text-xs font-bold" style={{ color: "var(--sda-amber)" }}>{ticket.id}</span>
        <select
          value={ticket.priority}
          onChange={(e) => updateTicketPriority(ticket.id, e.target.value as TicketPriority)}
          className={`dashboard-table-badge border-0 bg-transparent text-xs cursor-pointer ${priorityBadge[ticket.priority] ?? ""}`}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={ticket.status}
          onChange={(e) => updateTicketStatus(ticket.id, e.target.value as TicketStatus)}
          className={`dashboard-table-badge border-0 bg-transparent text-xs cursor-pointer ${statusBadge[ticket.status] ?? ""}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="text-xs text-[var(--color-text-muted)] ml-auto">Due: {ticket.due}</span>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <SectionCard title="Ticket Info" icon={ClipboardCheck} delay={0.05}>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">{ticket.title}</h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{ticket.description}</p>
            <InfoRow label="Related Complaint" value={
              <Link href={`/sub-district-admin/dashboard/complaints/${ticket.complaintId}`}>
                <span className="font-mono hover:underline" style={{ color: "var(--sda-amber)" }}>{ticket.complaintId}</span>
              </Link>
            } />
            <InfoRow label="Assigned Officer" value={ticket.assignedOfficer} />
            <InfoRow label="Created" value={ticket.created} />
            <InfoRow label="Due Date" value={<span className={ticket.status === "Overdue" ? "text-red-400 font-bold" : ""}>{ticket.due}</span>} />
          </SectionCard>

          <SectionCard title="Materials Used" icon={Package} delay={0.1}>
            {materials.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">No materials recorded yet.</p>
            ) : (
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
                    {materials.map((m, i) => (
                      <tr key={i} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors">
                        <td className="py-2 text-[var(--color-text-primary)] font-medium">{m.item}</td>
                        <td className="py-2 text-[var(--color-text-secondary)]">{m.qty}</td>
                        <td className="py-2 font-mono" style={{ color: "var(--sda-amber)" }}>{m.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Activity Timeline" icon={Clock} delay={0.15}>
            <div className="flex flex-col gap-0 relative">
              <div
                className="absolute left-3.5 top-3.5 bottom-3.5 w-px"
                style={{ background: "linear-gradient(to bottom, var(--sda-border-amber), rgba(245,158,11,0.1))" }}
              />
              {ticket.timeline.map((step, i) => {
                const StepIcon = timelineIcon(step.label);
                return (
                  <div key={i} className="flex gap-3 pb-4 last:pb-0 relative">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border relative z-10"
                      style={{
                        borderColor: step.done ? "rgba(34,197,94,0.4)" : "var(--color-border)",
                        background: step.done ? "rgba(34,197,94,0.1)" : "var(--color-surface)",
                      }}
                    >
                      <StepIcon size={12} style={{ color: step.done ? "var(--color-success)" : "var(--color-text-muted)" }} />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className={`text-xs font-semibold ${step.done ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">{step.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4">
          <SectionCard title="Assigned Team" icon={Users} delay={0.08}>
            <div
              className="flex items-center gap-3 rounded-xl border px-3 py-2.5 mb-2"
              style={{ borderColor: "var(--sda-border-amber)", background: "var(--sda-amber-glow)" }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold"
                style={{ borderColor: "var(--sda-border-amber)", background: "rgba(245,158,11,0.1)", color: "var(--sda-amber)" }}
              >
                {teamLead.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--color-text-primary)]">{ticket.team}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">Lead: {teamLead}</p>
              </div>
            </div>
            {teamMembers.length > 0 && <InfoRow label="Members" value={teamMembers.join(", ")} />}
            <InfoRow label="Contact" value={teamContact} />
            <div className="flex gap-2 mt-1">
              <input
                value={officerInput}
                onChange={(e) => setOfficerInput(e.target.value)}
                placeholder="Reassign officer..."
                className="flex-1 rounded-lg border px-2 py-1.5 text-xs bg-[var(--color-surface)] border-[var(--color-border)]"
              />
              <button
                type="button"
                onClick={handleAssignOfficer}
                className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-white"
                style={{ background: "var(--sda-amber)" }}
              >
                Assign
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Notes" icon={FileText} delay={0.13}>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
              {ticket.notes || "No notes yet."}
            </p>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add new note..."
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] resize-none focus:outline-none focus:border-amber-500/40 mt-2"
            />
            <motion.button
              type="button"
              onClick={handleSaveNote}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-8 rounded-lg border text-xs font-medium transition-all"
              style={{
                borderColor: "var(--sda-border-amber)",
                background: "color-mix(in srgb, var(--sda-amber) 10%, transparent)",
                color: "var(--sda-amber)",
              }}
            >
              {noteSaved ? "Saved" : "Save Note"}
            </motion.button>
          </SectionCard>

          <SectionCard title="Attachments" icon={Paperclip} delay={0.18}>
            <div className="flex flex-col gap-2">
              {attachments.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)]">No attachments yet.</p>
              ) : (
                attachments.map((a, i) => (
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
                ))
              )}
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

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  MessageSquare, User, Shield, ShieldAlert, Send, Check, CheckCheck,
  ExternalLink, Clock, CircleDot, AlertTriangle, FileText, ArrowRight,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────── */

export type MessageType = "request" | "response" | "system";
export type ConversationStatus = "Pending" | "Awaiting Reply" | "Responded" | "Resolved" | "Closed";

export interface ClarificationMessage {
  sender: string;
  role: "sub-district" | "district" | "super";
  message: string;
  timestamp: string;
  type?: MessageType;
}

/* ─── Constants ──────────────────────────────────────────────── */

const ROLE_CFG = {
  "sub-district": { label: "Sub-District Admin", short: "Sub-District", color: "#f59e0b", icon: User },
  district: { label: "District Admin", short: "District", color: "#14b8a6", icon: Shield },
  super: { label: "Super Admin", short: "Super Admin", color: "#22d3ee", icon: ShieldAlert },
};

const TYPE_CFG: Record<MessageType, { label: string; color: string }> = {
  request: { label: "Request", color: "#f59e0b" },
  response: { label: "Response", color: "#3b82f6" },
  system: { label: "System", color: "#64748b" },
};

const QUICK_REPLIES = [
  "Evidence Uploaded", "Please Review", "Need More Time",
  "Documents Attached", "Contractor Responded", "Inspection Scheduled",
];

const WORKFLOW_STEPS: ConversationStatus[] = ["Pending", "Awaiting Reply", "Responded", "Resolved"];

/* ─── Helpers ────────────────────────────────────────────────── */

function getRecipient(sender: ClarificationMessage["role"], viewer: ClarificationMessage["role"]): string {
  if (sender === "sub-district") return ROLE_CFG.district.short;
  if (sender === "super") return ROLE_CFG.district.short;
  if (sender === "district") return viewer === "super" ? ROLE_CFG.super.short : ROLE_CFG["sub-district"].short;
  return ROLE_CFG.district.short;
}

function inferMessageType(msg: ClarificationMessage, viewer: ClarificationMessage["role"]): MessageType {
  if (msg.type) return msg.type;
  // If sender is NOT the viewer, it's a request TO the viewer; if sender IS the viewer, it's a response
  return msg.role === viewer ? "response" : "request";
}

function getMsgStatus(idx: number, total: number): "sent" | "delivered" | "read" {
  if (idx < total - 1) return "read";
  if (idx === total - 1 && total > 1) return "delivered";
  return "sent";
}

/* ─── Parser ─────────────────────────────────────────────────── */

export function parseNotesToThread(
  notes: string | undefined,
  activityLog?: { time: string; actor: string; action: string }[]
): ClarificationMessage[] {
  const messages: ClarificationMessage[] = [];
  const seen = new Set<string>();

  if (activityLog) {
    for (const entry of activityLog) {
      if (entry.action.includes("larification")) {
        const msg = entry.action
          .replace(/^Clarification requested[:\s—]*/, "")
          .replace(/^Clarification reply[:\s—]*/, "")
          .replace(/^clarification[:\s—]*/, "")
          .trim();
        if (msg && !seen.has(msg.toLowerCase())) {
          seen.add(msg.toLowerCase());
          const role: ClarificationMessage["role"] = entry.actor.includes("Super") ? "super" : entry.actor.includes("District") ? "district" : "sub-district";
          messages.push({ sender: entry.actor, role, message: msg.substring(0, 300), timestamp: entry.time });
        }
      }
    }
  }

  if (notes) {
    const lines = notes.split("\n").filter((l) => l.trim());
    for (const line of lines) {
      const superMatch = line.match(/^\[Super Admin\]\s*(.+)/);
      const districtMatch = line.match(/^\[District\]\s*(.+)/);
      const clarMatch = line.match(/^\[Clarification\]\s*(.+)/);
      const timeMatch = line.match(/^\[([^\]]+)\]\s*District response:\s*(.+)/);
      const subDistrictMatch = line.match(/^\[Sub-District\]\s*(.+)/);
      const replyMatch = line.match(/^\[Reply\]\s*(.+)/);

      let msg = "", role: ClarificationMessage["role"] = "district", timestamp = "";
      if (superMatch) { msg = superMatch[1]; role = "super"; }
      else if (subDistrictMatch) { msg = subDistrictMatch[1]; role = "sub-district"; }
      else if (replyMatch) { msg = replyMatch[1]; role = "sub-district"; }
      else if (districtMatch) { msg = districtMatch[1]; role = "district"; }
      else if (clarMatch) { msg = clarMatch[1]; role = "district"; }
      else if (timeMatch) { msg = timeMatch[2]; role = "district"; timestamp = timeMatch[1]; }

      if (msg && !seen.has(msg.toLowerCase())) {
        seen.add(msg.toLowerCase());
        const S: Record<ClarificationMessage["role"], string> = { "sub-district": "Sub-District Officer", district: "District Admin", super: "Super Admin" };
        messages.push({ sender: S[role], role, message: msg, timestamp });
      }
    }
  }
  return messages;
}

/* ─── Governance State Bar ───────────────────────────────────── */

function GovernanceStateBar({ current }: { current: ConversationStatus }) {
  const idx = WORKFLOW_STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-0 w-full">
      {WORKFLOW_STEPS.map((step, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border ${active ? "ring-2 ring-offset-1 ring-purple-400/40" : ""}`}
                style={{
                  background: done ? (active ? "rgba(139,92,246,0.15)" : "rgba(34,197,94,0.12)") : "var(--color-surface)",
                  borderColor: done ? (active ? "#8b5cf6" : "#22c55e") : "var(--color-border)",
                  color: done ? (active ? "#8b5cf6" : "#22c55e") : "var(--color-text-muted)",
                }}>
                {done && !active ? <Check size={9} /> : (i + 1)}
              </div>
              <span className="text-[7px] mt-0.5 font-medium text-center leading-tight"
                style={{ color: active ? "#8b5cf6" : done ? "#22c55e" : "var(--color-text-muted)" }}>
                {step}
              </span>
            </div>
            {i < WORKFLOW_STEPS.length - 1 && (
              <div className="h-px flex-1 mx-0.5" style={{ background: i < idx ? "#22c55e" : "var(--color-border)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Waiting On Card ────────────────────────────────────────── */

function WaitingOnCard({ messages, viewerRole }: { messages: ClarificationMessage[]; viewerRole: ClarificationMessage["role"] }) {
  if (messages.length === 0) return null;
  const last = messages[messages.length - 1];
  const waitingOnViewer = last.role !== viewerRole;
  const waitingRole = waitingOnViewer ? viewerRole : (last.role === "district" ? (viewerRole === "super" ? "district" : "sub-district") : "district");
  const waitingLabel = ROLE_CFG[waitingRole].short;
  const requestedBy = ROLE_CFG[last.role].short;
  const since = last.timestamp || "—";
  const overdue = messages.length > 2;

  return (
    <div className="rounded-lg border p-2.5 flex items-center gap-3"
      style={{
        borderColor: overdue ? "rgba(239,68,68,0.3)" : "rgba(139,92,246,0.25)",
        background: overdue ? "rgba(239,68,68,0.04)" : "rgba(139,92,246,0.04)",
      }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: overdue ? "rgba(239,68,68,0.1)" : "rgba(139,92,246,0.1)" }}>
        {overdue ? <AlertTriangle size={14} className="text-red-400" /> : <Clock size={14} className="text-purple-400" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wide">Waiting On</span>
          {overdue && <span className="text-[8px] font-bold text-red-400 uppercase">Overdue</span>}
        </div>
        <p className="text-[11px] font-bold mt-0.5" style={{ color: overdue ? "#ef4444" : "#8b5cf6" }}>{waitingLabel}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[9px] text-[var(--color-text-muted)]">By: {requestedBy}</span>
          <span className="text-[9px] text-[var(--color-text-muted)]">Since: {since}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Judge Summary Panel ────────────────────────────────────── */

function JudgeSummaryPanel({ messages, viewerRole }: { messages: ClarificationMessage[]; viewerRole: ClarificationMessage["role"] }) {
  const participants = new Set(messages.map((m) => m.role)).size;
  const openRequests = messages.filter((m) => inferMessageType(m, viewerRole) === "request").length;
  const responses = messages.filter((m) => inferMessageType(m, viewerRole) === "response").length;
  const cycles = Math.min(openRequests, responses);
  const last = messages[messages.length - 1];
  const waitingOn = last ? (last.role === viewerRole ? getRecipient(viewerRole, viewerRole) : ROLE_CFG[viewerRole].short) : "—";

  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      {[
        { label: "Messages", value: String(messages.length), color: "var(--color-text-primary)" },
        { label: "Participants", value: String(participants), color: "#8b5cf6" },
        { label: "Open Requests", value: String(Math.max(0, openRequests - responses)), color: openRequests > responses ? "#f59e0b" : "#22c55e" },
      ].map((s) => (
        <div key={s.label} className="rounded-lg border px-2 py-2"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
          <div className="text-sm font-black tabular-nums" style={{ color: s.color }}>{s.value}</div>
          <div className="text-[8px] text-[var(--color-text-muted)] mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Status Pill ────────────────────────────────────────────── */

function StatusPill({ status }: { status: ConversationStatus }) {
  const cfg: Record<ConversationStatus, { color: string; bg: string }> = {
    Pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    "Awaiting Reply": { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
    Responded: { color: "#14b8a6", bg: "rgba(20,184,166,0.1)" },
    Resolved: { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    Closed: { color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  };
  const c = cfg[status];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold"
      style={{ color: c.color, background: c.bg, borderColor: `${c.color}30` }}>
      <CircleDot size={8} /> {status}
    </span>
  );
}

function MessageStatusIcon({ status }: { status: "sent" | "delivered" | "read" }) {
  if (status === "read") return <CheckCheck size={9} className="text-blue-400" />;
  if (status === "delivered") return <CheckCheck size={9} className="text-[var(--color-text-muted)]" />;
  return <Check size={9} className="text-[var(--color-text-muted)]" />;
}

/* ─── Main Component ─────────────────────────────────────────── */

interface ClarificationThreadProps {
  messages: ClarificationMessage[];
  title?: string;
  emptyLabel?: string;
  viewerRole?: "sub-district" | "district" | "super";
  complaintId?: string;
  escalationId?: string;
  onReply?: (message: string) => void;
  onResolve?: () => void;
  resolved?: boolean;
}

export function ClarificationThread({
  messages,
  title = "Governance Conversation",
  emptyLabel = "No messages yet",
  viewerRole = "district",
  complaintId,
  escalationId,
  onReply,
  onResolve,
  resolved = false,
}: ClarificationThreadProps) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const conversationStatus = useMemo((): ConversationStatus => {
    if (resolved) return "Resolved";
    if (messages.length === 0) return "Pending";
    const last = messages[messages.length - 1];
    return last.role === viewerRole ? "Responded" : "Awaiting Reply";
  }, [messages, viewerRole, resolved]);

  const isLocked = resolved || (conversationStatus as string) === "Resolved" || (conversationStatus as string) === "Closed";

  const handleSend = () => {
    if (!replyText.trim() || !onReply || sending) return;
    setSending(true);
    onReply(replyText.trim());
    setReplyText("");
    setSending(false);
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  if (messages.length === 0 && !onReply) return null;

  // Group consecutive messages from same sender
  const grouped: { role: ClarificationMessage["role"]; msgs: { message: string; timestamp: string; index: number }[] }[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const lastGroup = grouped[grouped.length - 1];
    if (lastGroup && lastGroup.role === msg.role) {
      lastGroup.msgs.push({ message: msg.message, timestamp: msg.timestamp, index: i });
    } else {
      grouped.push({ role: msg.role, msgs: [{ message: msg.message, timestamp: msg.timestamp, index: i }] });
    }
  }

  return (
    <div className="flex flex-col gap-0 rounded-xl border overflow-hidden"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>

      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex flex-col gap-2.5"
        style={{ background: "color-mix(in srgb, var(--color-surface) 50%, var(--color-card))" }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-purple-400" />
            <span className="text-xs font-bold text-[var(--color-text-primary)]">{title}</span>
          </div>
          <StatusPill status={conversationStatus} />
        </div>
        {/* Case context chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {complaintId && (
            <Link href={viewerRole === "sub-district" ? `/sub-district-admin/dashboard/complaints/${complaintId}` : "#"}>
              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded border cursor-pointer hover:opacity-80"
                style={{ color: "#3b82f6", borderColor: "rgba(59,130,246,0.25)", background: "rgba(59,130,246,0.06)" }}>
                <FileText size={8} /> {complaintId}
              </span>
            </Link>
          )}
          {escalationId && (
            <Link href={viewerRole === "super" ? `/super-admin/complaints/escalated-cases/${escalationId}` : `/district-admin/dashboard/escalation/${escalationId}`}>
              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded border cursor-pointer hover:opacity-80"
                style={{ color: "#f97316", borderColor: "rgba(249,115,22,0.25)", background: "rgba(249,115,22,0.06)" }}>
                <ShieldAlert size={8} /> {escalationId}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Judge Summary + State Bar ── */}
      {messages.length > 0 && (
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex flex-col gap-3"
          style={{ background: "color-mix(in srgb, var(--color-surface) 25%, var(--color-card))" }}>
          <JudgeSummaryPanel messages={messages} viewerRole={viewerRole} />
          <GovernanceStateBar current={conversationStatus} />
          <WaitingOnCard messages={messages} viewerRole={viewerRole} />
        </div>
      )}

      {/* ── Chat Messages ── */}
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <MessageSquare size={20} className="text-[var(--color-text-muted)] opacity-30 mb-2" />
          <span className="text-[11px] text-[var(--color-text-muted)]">{emptyLabel}</span>
        </div>
      ) : (
        <div ref={scrollRef} className="flex flex-col gap-3 px-4 py-3 max-h-[280px] overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}>
          {grouped.map((group, gi) => {
            const cfg = ROLE_CFG[group.role];
            const Icon = cfg.icon;
            const isViewer = group.role === viewerRole;
            const recipient = getRecipient(group.role, viewerRole);
            const msgType = inferMessageType({ role: group.role, sender: "", message: "", timestamp: "" }, viewerRole);
            const typeCfg = TYPE_CFG[msgType];

            return (
              <motion.div key={gi} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.03 }}
                className={`flex gap-2.5 ${isViewer ? "flex-row-reverse" : ""}`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${cfg.color}12`, border: `1.5px solid ${cfg.color}30`, color: cfg.color }}>
                  <Icon size={12} />
                </div>
                <div className={`flex flex-col gap-1 max-w-[80%] ${isViewer ? "items-end" : "items-start"}`}>
                  {/* Sender → Recipient + type badge */}
                  <div className={`flex items-center gap-1.5 flex-wrap ${isViewer ? "flex-row-reverse" : ""}`}>
                    <span className="text-[9px] font-bold" style={{ color: cfg.color }}>{cfg.short}</span>
                    <ArrowRight size={8} className="text-[var(--color-text-muted)]" />
                    <span className="text-[8px] text-[var(--color-text-muted)]">{recipient}</span>
                    <span className="text-[7px] font-bold uppercase px-1 py-0.5 rounded"
                      style={{ color: typeCfg.color, background: `${typeCfg.color}12` }}>
                      {typeCfg.label}
                    </span>
                  </div>
                  {/* Bubbles */}
                  {group.msgs.map((m, mi) => {
                    const status = isViewer ? getMsgStatus(m.index, messages.length) : undefined;
                    const bubbleBorder = isViewer ? `${cfg.color}22` : `${cfg.color}15`;
                    return (
                      <div key={mi}
                        className={`rounded-xl px-3 py-2 ${isViewer ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                        style={{
                          background: isViewer ? `color-mix(in srgb, ${cfg.color} 8%, var(--color-surface))` : `color-mix(in srgb, ${cfg.color} 4%, var(--color-card))`,
                          border: `1px solid ${bubbleBorder}`,
                        }}>
                        <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{m.message}</p>
                        <div className={`flex items-center gap-1.5 mt-1 ${isViewer ? "justify-end" : ""}`}>
                          {m.timestamp && <span className="text-[8px] text-[var(--color-text-muted)]">{m.timestamp}</span>}
                          {status && <MessageStatusIcon status={status} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Quick Reply Chips ── */}
      {onReply && !isLocked && (
        <div className="px-4 py-2 border-t border-[var(--color-border)] overflow-x-auto flex gap-1.5"
          style={{ scrollbarWidth: "none" }}>
          {QUICK_REPLIES.map((chip) => (
            <button key={chip} onClick={() => setReplyText(chip)}
              className="shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-medium transition-colors hover:border-purple-400/40 hover:text-purple-400"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)", background: "var(--color-surface)" }}>
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* ── Reply Input ── */}
      {onReply && !isLocked && (
        <div className="px-4 py-2.5 border-t border-[var(--color-border)] flex items-center gap-2"
          style={{ background: "var(--color-surface)" }}>
          <input type="text" value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a reply…" disabled={sending}
            className="flex-1 h-9 rounded-lg border px-3 text-[11px] outline-none transition-colors disabled:opacity-50"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }} />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleSend} disabled={!replyText.trim() || sending}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all disabled:opacity-30"
            style={{ borderColor: "rgba(139,92,246,0.35)", background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
            <Send size={13} />
          </motion.button>
          {onResolve && messages.length > 1 && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onResolve}
              className="flex items-center gap-1 h-9 px-3 rounded-lg border text-[10px] font-semibold transition-all"
              style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>
              <Check size={11} /> Resolve
            </motion.button>
          )}
        </div>
      )}

      {/* ── Resolved Banner ── */}
      {isLocked && (
        <div className="px-4 py-3 border-t border-[var(--color-border)] flex items-center gap-2"
          style={{ background: "rgba(34,197,94,0.05)" }}>
          <Check size={14} className="text-green-400" />
          <div>
            <span className="text-[10px] font-bold text-green-400">Clarification Resolved</span>
            {messages.length > 0 && <span className="text-[9px] text-[var(--color-text-muted)] ml-2">{messages[messages.length - 1].timestamp}</span>}
          </div>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-xl border px-4 py-2.5 shadow-lg"
            style={{ background: "var(--color-card)", borderColor: "rgba(20,184,166,0.35)", color: "#14b8a6" }}>
            <Check size={13} /> <span className="text-xs font-medium">Reply sent successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Exported Supporting Components ─────────────────────────── */

export function ClarificationRequiredBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 rounded-lg border px-3 py-2"
      style={{ borderColor: "rgba(139,92,246,0.35)", background: "rgba(139,92,246,0.08)" }}>
      <MessageSquare size={12} className="text-purple-400" />
      <span className="text-[11px] font-semibold text-purple-400">Clarification Required</span>
    </motion.div>
  );
}

export function EscalationChainCard({ parentId, childId, parentTier, childTier }: {
  parentId: string; childId: string; parentTier?: string; childTier?: string;
}) {
  return (
    <div className="rounded-xl border p-3 flex flex-col gap-1.5"
      style={{ borderColor: "rgba(249,115,22,0.2)", background: "rgba(249,115,22,0.04)" }}>
      <div className="flex items-center gap-1.5">
        <ShieldAlert size={11} className="text-orange-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Escalation Chain</span>
      </div>
      <div className="flex items-center gap-2 pl-1">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-mono font-bold text-[var(--color-text-primary)]">{parentId}</span>
          <span className="text-[8px] text-[var(--color-text-muted)] capitalize">{parentTier ?? "District"}</span>
        </div>
        <span className="text-[10px] text-orange-400">↓</span>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-mono font-bold text-orange-400">{childId}</span>
          <span className="text-[8px] text-[var(--color-text-muted)] capitalize">{childTier ?? "Super Admin"}</span>
        </div>
      </div>
      <p className="text-[9px] text-[var(--color-text-muted)] pl-1 mt-0.5">
        Parent escalation was closed and elevated to a higher governance tier.
      </p>
    </div>
  );
}

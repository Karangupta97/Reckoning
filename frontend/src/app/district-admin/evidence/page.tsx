"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, Plus, Eye, Upload } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { EVIDENCE_STATUS_CLS } from "@/components/super-admin-dashboard/evidence-ui";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useEscalationStore } from "@/store/escalationStore";
import { currentDistrictFields, filterByDistrictScope } from "@/lib/district-scope";
import { EvidenceFilePicker } from "@/components/evidence/EvidenceFilePicker";
import type { EvidenceFile } from "@/store/evidenceStore";

/**
 * Resolve the district-admin route for a related entity:
 * - ESC-* → /district-admin/dashboard/escalation/ESC-XXXX
 * - CMP-* → look up linked escalation → /district-admin/dashboard/escalation/ESC-XXXX
 * - If no linked escalation found → stay on evidence page (no cross-portal nav)
 */
function resolveDistrictRoute(relatedEntityId: string, cmpToEsc: Map<string, string>): string {
  if (relatedEntityId.startsWith("ESC-")) {
    return `/district-admin/dashboard/escalation/${relatedEntityId}`;
  }
  // CMP-* → find the linked escalation
  const linkedEsc = cmpToEsc.get(relatedEntityId);
  if (linkedEsc) {
    return `/district-admin/dashboard/escalation/${linkedEsc}`;
  }
  // No escalation found — stay in current page
  return `/district-admin/evidence`;
}

/**
 * Display the district-relevant entity ID:
 * If a CMP-* has been escalated, show the ESC ID instead.
 */
function resolveDisplayId(relatedEntityId: string, cmpToEsc: Map<string, string>): string {
  if (relatedEntityId.startsWith("ESC-")) return relatedEntityId;
  const linkedEsc = cmpToEsc.get(relatedEntityId);
  return linkedEsc ?? relatedEntityId;
}

export default function DistrictEvidencePage() {
  const records = useEvidenceStore((s) => s.records);
  const submitEvidence = useEvidenceStore((s) => s.submitEvidence);
  const escalations = useEscalationStore((s) => s.escalations);

  // Build CMP → ESC mapping from escalation store
  const cmpToEsc = new Map<string, string>();
  for (const esc of escalations) {
    if (esc.sourceComplaintId) {
      cmpToEsc.set(esc.sourceComplaintId, esc.id);
    }
  }

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [entityId, setEntityId] = useState("");
  const [entityType, setEntityType] = useState<"Escalation" | "Complaint">("Escalation");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const districtFields = currentDistrictFields();
  const districtRecords = filterByDistrictScope(records, (r) => r.district, (r) => r.state);

  const handleSubmit = () => {
    if (!title.trim() || !entityId.trim()) return;
    const id = submitEvidence({
      relatedEntityId: entityId.trim().toUpperCase(),
      relatedEntityType: entityType,
      title: title.trim(),
      district: districtFields.district,
      state: districtFields.state,
      uploadedBy: "District Officer",
      notes: notes.trim(),
      files: files.length > 0 ? files : [{ id: "f-new", label: "Site documentation", type: "image", size: "2.1 MB" }],
    });
    setToast(`Evidence ${id} submitted — Super Admin review queue updated`);
    setShowForm(false);
    setTitle("");
    setEntityId("");
    setNotes("");
    setFiles([]);
    setTimeout(() => setToast(null), 3500);
  };

  const handleUploadClick = (r: typeof districtRecords[0]) => {
    setEntityId(r.relatedEntityId);
    setEntityType(r.relatedEntityType);
    setTitle(`Additional Evidence for ${r.relatedEntityId}`);
    setNotes(`Follow-up documentation for evidence ${r.id}`);
    setFiles([]);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera size={20} className="text-cyan-400" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Evidence Submissions</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Upload evidence for escalations and complaints</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "#06b6d4" }}
        >
          <Plus size={14} /> Submit Evidence
        </button>
      </motion.div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border px-3 py-2 text-xs text-emerald-400"
          style={{ borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)" }}
        >
          {toast}
        </motion.div>
      )}

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
          <DashboardCard className="p-4 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Evidence Submission Form</h2>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Evidence title"
              className="rounded-lg border px-3 py-2 text-xs focus:outline-none"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            />
            <div className="flex gap-2">
              <input
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="ESC-4021 or CMP-1024"
                className="flex-1 rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
              />
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as "Escalation" | "Complaint")}
                className="rounded-lg border px-2 text-xs focus:outline-none"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
              >
                <option value="Escalation">Escalation</option>
                <option value="Complaint">Complaint</option>
              </select>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Additional notes..."
              className="rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            />
            <EvidenceFilePicker files={files} onChange={setFiles} />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white"
                style={{ background: "#10b981" }}
              >
                Submit for Review
              </button>
            </div>
          </DashboardCard>
        </motion.div>
      )}

      <DashboardCard>
        <div className="dashboard-table-scroll">
          <table className="dashboard-table w-full">
            <thead>
              <tr>
                {["ID", "Related", "Title", "Status", "Uploaded", "Actions"].map((h) => (
                  <th key={h} className="dashboard-table-th whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {districtRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="dashboard-table-td text-center py-12 text-sm text-[var(--color-text-muted)]">
                    No evidence submissions found.
                  </td>
                </tr>
              ) : (
                districtRecords.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="dashboard-table-row"
                  >
                    <td className="dashboard-table-td dashboard-table-td-mono text-[11px] whitespace-nowrap">{r.id}</td>
                    <td className="dashboard-table-td text-[11px] font-mono whitespace-nowrap text-[var(--color-text-secondary)]">
                      {resolveDisplayId(r.relatedEntityId, cmpToEsc)}
                    </td>
                    <td className="dashboard-table-td text-xs font-medium text-[var(--color-text-primary)] max-w-[200px] truncate" title={r.title}>
                      {r.title}
                    </td>
                    <td className="dashboard-table-td">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${EVIDENCE_STATUS_CLS[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="dashboard-table-td text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">{r.uploadedAt}</td>
                    <td className="dashboard-table-td">
                      <div className="flex items-center gap-3">
                        <Link
                          href={resolveDistrictRoute(r.relatedEntityId, cmpToEsc)}
                          className="text-[var(--color-text-muted)] hover:text-cyan-400 transition-colors"
                          title="View Related Record"
                        >
                          <Eye size={14} />
                        </Link>
                        {r.status === "Additional Requested" && (
                          <button
                            type="button"
                            onClick={() => handleUploadClick(r)}
                            className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-tight"
                            title="Upload Additional Evidence"
                          >
                            <Upload size={12} /> Upload
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}

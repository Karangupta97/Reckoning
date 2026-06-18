"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Plus } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { EVIDENCE_STATUS_CLS } from "@/components/super-admin-dashboard/evidence-ui";
import { useEvidenceStore } from "@/store/evidenceStore";
import { currentDistrictFields, filterByDistrictScope } from "@/lib/district-scope";
import { EvidenceFilePicker } from "@/components/evidence/EvidenceFilePicker";
import type { EvidenceFile } from "@/store/evidenceStore";

export default function DistrictEvidencePage() {
  const records = useEvidenceStore((s) => s.records);
  const submitEvidence = useEvidenceStore((s) => s.submitEvidence);
  const submitAdditional = useEvidenceStore((s) => s.submitAdditionalEvidence);

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
        <button type="button" onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "#06b6d4" }}>
          <Plus size={14} /> Submit Evidence
        </button>
      </motion.div>

      {toast && <div className="rounded-lg border px-3 py-2 text-xs text-emerald-400" style={{ borderColor: "rgba(16,185,129,0.3)" }}>{toast}</div>}

      {showForm && (
        <DashboardCard className="p-4 flex flex-col gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Evidence title" className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
          <div className="flex gap-2">
            <input value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="ESC-4021 or CMP-1024" className="flex-1 rounded-lg border px-3 py-2 text-xs font-mono" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
            <select value={entityType} onChange={(e) => setEntityType(e.target.value as "Escalation" | "Complaint")} className="rounded-lg border px-2 text-xs" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
              <option value="Escalation">Escalation</option>
              <option value="Complaint">Complaint</option>
            </select>
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes" className="rounded-lg border px-3 py-2 text-xs resize-none" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
          <EvidenceFilePicker files={files} onChange={setFiles} />
          <button type="button" onClick={handleSubmit} className="self-end rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "#10b981" }}>Submit for Review</button>
        </DashboardCard>
      )}

      <DashboardCard>
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>{["ID", "Related", "Title", "Status", "Uploaded"].map((h) => <th key={h} className="dashboard-table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {districtRecords.map((r) => (
                <tr key={r.id} className="dashboard-table-row">
                  <td className="dashboard-table-td dashboard-table-td-mono text-xs">{r.id}</td>
                  <td className="dashboard-table-td text-xs font-mono">{r.relatedEntityId}</td>
                  <td className="dashboard-table-td text-xs truncate max-w-[180px]">{r.title}</td>
                  <td className="dashboard-table-td">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${EVIDENCE_STATUS_CLS[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="dashboard-table-td text-xs">{r.uploadedAt}</td>
                  <td className="dashboard-table-td text-xs">
                    {r.status === "Additional Requested" && (
                      <button type="button" onClick={() => submitAdditional(r.id, [{ id: "f-add", label: "Additional photo", type: "image", size: "1.5 MB" }], "District follow-up")} className="text-cyan-400 hover:underline">Upload More</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}

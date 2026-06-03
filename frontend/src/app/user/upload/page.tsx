"use client";

import { memo, useState } from "react";
import PageHeader from "@/components/user/PageHeader";

const ROAD_TYPES = [
  "National Highway",
  "State Highway",
  "Urban Arterial",
  "Local Street",
  "Bridge / Flyover",
];

function UploadPage() {
  const [showAi, setShowAi] = useState(false);
  const [roadType, setRoadType] = useState(ROAD_TYPES[2]);

  return (
    <>
      <PageHeader
        title="Upload Report"
        subtitle="Submit road defects with photo, video, or GPS evidence. Reports queue offline when disconnected."
      />

      <div className="rk-grid">
        <div className="rk-col-7">
          <div className="rk-panel">
            <div className="rk-panel-body">
              <div
                className="rk-upload-zone"
                onClick={() => setShowAi(true)}
                onKeyDown={(e) => e.key === "Enter" && setShowAi(true)}
                role="button"
                tabIndex={0}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--rk-primary)"
                  strokeWidth="1.5"
                  style={{ margin: "0 auto 12px", display: "block" }}
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <p style={{ margin: 0, fontSize: 14, color: "var(--rk-text-secondary)" }}>
                  Tap to capture or upload <strong style={{ color: "var(--rk-primary)" }}>photo / video</strong>
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--rk-text-muted)" }}>
                  Supports JPG, PNG, MP4 · Max 25MB
                </p>
              </div>

              <div style={{ marginTop: 20 }}>
                <label className="rw-label" htmlFor="road-type">
                  Road type
                </label>
                <select
                  id="road-type"
                  className="rw-input rw-select"
                  value={roadType}
                  onChange={(e) => setRoadType(e.target.value)}
                  style={{ marginTop: 8 }}
                >
                  {ROAD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: "var(--rk-radius-sm)",
                  border: "1px solid var(--rk-border)",
                  background: "var(--rk-surface)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 12,
                  color: "var(--rk-text-secondary)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--rk-success)" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                GPS detected: 18.5204° N, 73.8567° E · FC Road, Ward 8
              </div>

              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: "var(--rk-radius-sm)",
                  border: "1px dashed var(--rk-border-strong)",
                  fontSize: 11,
                  color: "var(--rk-text-muted)",
                }}
              >
                Offline queue: 0 pending · Sync when connected
              </div>

              <button
                type="button"
                className="rk-btn rk-btn-primary"
                style={{ width: "100%", marginTop: 20 }}
                onClick={() => setShowAi(true)}
              >
                Submit for AI Analysis
              </button>
            </div>
          </div>
        </div>

        <div className="rk-col-5">
          <div className="rk-panel">
            <div className="rk-panel-head">
              <span className="rk-panel-title">AI Analysis</span>
            </div>
            <div className="rk-panel-body">
              {!showAi ? (
                <p style={{ fontSize: 13, color: "var(--rk-text-muted)", lineHeight: 1.6 }}>
                  Upload media to receive defect classification, severity scoring, and authority routing.
                </p>
              ) : (
                <div className="rk-ai-panel" style={{ margin: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--rk-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Analysis complete
                  </p>
                  <div className="rk-ai-grid">
                    <div className="rk-ai-metric">
                      <span>Defect type</span>
                      <strong>Pothole cluster</strong>
                    </div>
                    <div className="rk-ai-metric">
                      <span>Severity</span>
                      <strong style={{ color: "var(--rk-danger)" }}>High</strong>
                    </div>
                    <div className="rk-ai-metric">
                      <span>Confidence</span>
                      <strong>93.2%</strong>
                    </div>
                    <div className="rk-ai-metric">
                      <span>Risk index</span>
                      <strong>7.8 / 10</strong>
                    </div>
                  </div>
                  <p
                    style={{
                      marginTop: 14,
                      fontSize: 12,
                      color: "var(--rk-text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    Assigned authority: <strong style={{ color: "var(--rk-text)" }}>Pune PMC · Roads Dept · Ward 8</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default memo(UploadPage);

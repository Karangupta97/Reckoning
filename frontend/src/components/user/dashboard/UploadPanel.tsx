"use client";

import { memo, useState } from "react";

const CHAT_MESSAGES = [
  {
    role: "bot" as const,
    text: "Upload a photo or video of the road section. I'll analyze surface defects automatically.",
  },
  {
    role: "bot" as const,
    text: "Detected: Pothole cluster (3 units) with surrounding crack propagation. Likely rain-exposed asphalt failure.",
  },
  {
    role: "bot" as const,
    text: "Severity: Critical. Recommend immediate BMC/PWD inspection. GPS and timestamp auto-tagged.",
  },
];

function UploadPanel() {
  const [analyzed, setAnalyzed] = useState(false);
  const [offlineQueue] = useState(2);

  return (
    <section className="rk-pin-card rk-upload-panel" aria-labelledby="upload-heading">
      <div className="rk-pin-card-head">
        <div>
          <h2 id="upload-heading" className="rk-pin-title">
            Report a Road Issue
          </h2>
          <p className="rk-pin-sub">Anonymous · Offline-first · GPS auto-tagged</p>
        </div>
        <span className={`rk-sync-badge${offlineQueue ? " pending" : ""}`}>
          {offlineQueue ? `${offlineQueue} queued` : "Synced"}
        </span>
      </div>

      <div className="rk-pin-card-body">
        <div className="rk-upload-grid">
          <div
            className="rk-upload-drop"
            role="button"
            tabIndex={0}
            onClick={() => setAnalyzed(true)}
            onKeyDown={(e) => e.key === "Enter" && setAnalyzed(true)}
            aria-label="Upload photo or video"
          >
            <div className="rk-upload-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="rk-upload-hint">
              Tap to capture or upload <strong>photo / video</strong>
            </p>
            <p className="rk-upload-meta">JPG, PNG, MP4 · Max 25 MB</p>
          </div>

          <div className="rk-upload-meta-stack">
            <div className="rk-meta-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>18.5204° N, 73.8567° E · Ward 8, FC Road</span>
            </div>
            <div className="rk-meta-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
            </div>
            <div className="rk-meta-row offline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12.55a11 11 0 0114.08 0" />
                <path d="M1.42 9a16 16 0 0121.16 0" />
                <path d="M8.53 16.11a6 6 0 016.95 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" />
              </svg>
              <span>Offline queue: {offlineQueue} pending · syncs when connected</span>
            </div>
          </div>
        </div>

        <div className="rk-ai-chat" aria-label="AI assistant">
          <div className="rk-ai-chat-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a2 2 0 010 4h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a2 2 0 010-4h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
              <circle cx="9" cy="14" r="1" />
              <circle cx="15" cy="14" r="1" />
            </svg>
            <span>Reckoning AI Assistant</span>
          </div>
          <div className="rk-ai-chat-messages">
            {CHAT_MESSAGES.slice(0, analyzed ? 3 : 1).map((msg, i) => (
              <div key={i} className="rk-chat-bubble bot">
                {msg.text}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="rk-btn rk-btn-primary rk-btn-block"
          onClick={() => setAnalyzed(true)}
        >
          Submit for AI Analysis
        </button>
      </div>
    </section>
  );
}

export default memo(UploadPanel);

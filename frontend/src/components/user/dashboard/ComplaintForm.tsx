"use client";

import { memo, useState } from "react";

const CATEGORIES = [
  { value: "pothole", label: "Pothole" },
  { value: "crack", label: "Road Crack" },
  { value: "pipeline", label: "Pipeline Dug-up" },
  { value: "rain", label: "Rain Damage" },
  { value: "material", label: "Poor Material / Construction" },
];

const ESCALATION = [
  { stage: "Submitted", status: "done", label: "Subdistrict" },
  { stage: "District", status: "active", label: "Pune PMC" },
  { stage: "State", status: "pending", label: "Maharashtra PWD" },
  { stage: "Country", status: "pending", label: "NHAI / MoRTH" },
];

function ComplaintForm() {
  const [category, setCategory] = useState("pothole");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="rk-pin-card rk-complaint-form" aria-labelledby="complaint-heading">
      <div className="rk-pin-card-head">
        <div>
          <h2 id="complaint-heading" className="rk-pin-title">
            Submit Complaint
          </h2>
          <p className="rk-pin-sub">Fully anonymous · No personal data stored</p>
        </div>
        <span className="rk-anon-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Anonymous
        </span>
      </div>

      <div className="rk-pin-card-body">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <div className="rk-form-field">
            <label htmlFor="issue-category">Issue category</label>
            <select
              id="issue-category"
              className="rk-form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rk-form-field">
            <label htmlFor="issue-desc">Brief description (optional)</label>
            <textarea
              id="issue-desc"
              className="rk-form-textarea"
              rows={3}
              placeholder="Describe the road section — no name or contact needed"
            />
          </div>

          <div className="rk-routing-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <div>
              <strong>Auto-routed to nearest authority</strong>
              <p>BMC · Roads Department · Ward 8 · Pune Subdistrict</p>
            </div>
          </div>

          <button type="submit" className="rk-btn rk-btn-primary rk-btn-block">
            Submit Anonymous Complaint
          </button>
        </form>

        <div className="rk-escalation-tracker" aria-label="Complaint escalation status">
          <span className="rk-escalation-label">Escalation tracker</span>
          <div className="rk-escalation-steps">
            {ESCALATION.map((step, i) => (
              <div key={step.stage} className={`rk-escalation-step ${step.status}`}>
                <div className="rk-escalation-dot" />
                {i < ESCALATION.length - 1 && <div className="rk-escalation-line" />}
                <div className="rk-escalation-info">
                  <strong>{step.stage}</strong>
                  <span>{step.label}</span>
                </div>
              </div>
            ))}
          </div>
          {submitted && (
            <p className="rk-submit-confirm">
              Complaint RK-2847 submitted. Tracking ID generated — no personal data linked.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default memo(ComplaintForm);

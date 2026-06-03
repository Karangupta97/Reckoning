"use client";

import { memo, useEffect, useState } from "react";

interface MapNode {
  id: string;
  x: number;
  y: number;
  type: "active" | "alert" | "resolved";
  label: string;
}

const NODES: MapNode[] = [
  { id: "n1", x: 18, y: 25, type: "alert", label: "Sinhagad Rd" },
  { id: "n2", x: 32, y: 40, type: "active", label: "FC Road" },
  { id: "n3", x: 55, y: 18, type: "active", label: "Hinjewadi Phase 1" },
  { id: "n4", x: 72, y: 55, type: "resolved", label: "Kharadi Bypass" },
  { id: "n5", x: 45, y: 68, type: "alert", label: "Katraj Tunnel" },
  { id: "n6", x: 68, y: 30, type: "active", label: "Wakad Bridge" },
  { id: "n7", x: 25, y: 58, type: "resolved", label: "Deccan Gym" },
  { id: "n8", x: 82, y: 42, type: "active", label: "Viman Nagar" },
  { id: "n9", x: 40, y: 80, type: "resolved", label: "Saswad Rd" },
  { id: "n10", x: 60, y: 45, type: "alert", label: "Baner Link" },
  { id: "n11", x: 15, y: 75, type: "active", label: "Warje Flyover" },
  { id: "n12", x: 88, y: 20, type: "resolved", label: "Lohegaon" },
  { id: "n13", x: 50, y: 35, type: "active", label: "SB Road" },
  { id: "n14", x: 35, y: 55, type: "active", label: "Bibwewadi" },
  { id: "n15", x: 75, y: 72, type: "alert", label: "Hadapsar" },
];

const ROUTES = [
  { x1: 18, y1: 25, x2: 32, y2: 40 },
  { x1: 32, y1: 40, x2: 55, y2: 18 },
  { x1: 55, y1: 18, x2: 72, y2: 55 },
  { x1: 45, y1: 68, x2: 72, y2: 55 },
  { x1: 55, y1: 18, x2: 68, y2: 30 },
  { x1: 25, y1: 58, x2: 45, y2: 68 },
  { x1: 60, y1: 45, x2: 82, y2: 42 },
  { x1: 50, y1: 35, x2: 60, y2: 45 },
  { x1: 35, y1: 55, x2: 50, y2: 35 },
  { x1: 68, y1: 30, x2: 88, y2: 20 },
];

function GISMap() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [time, setTime] = useState("00:00:00");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-IN", { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dash-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-title-dot"></span>
          GIS Network View
        </div>
        <div className="panel-actions">
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--dash-text-muted)", marginRight: 8 }}>
            {time} IST
          </span>
          <button className="panel-action-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
          <button className="panel-action-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>
      </div>
      <div className="map-container">
        <div className="map-grid"></div>

        {/* Route lines */}
        {ROUTES.map((r, i) => {
          const dx = r.x2 - r.x1;
          const dy = r.y2 - r.y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <div
              key={`route-${i}`}
              className="map-route"
              style={{
                left: `${r.x1}%`,
                top: `${r.y1}%`,
                width: `${len}%`,
                transform: `rotate(${angle}deg)`,
              }}
            />
          );
        })}

        {/* Nodes */}
        <div className="map-city-nodes">
          {NODES.map((node) => (
            <div
              key={node.id}
              className={`map-node ${node.type === "alert" ? "alert" : ""} ${node.type === "resolved" ? "resolved" : ""}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {hoveredNode === node.id && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 8px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "4px 8px",
                    background: "rgba(10,21,37,0.95)",
                    border: "1px solid var(--dash-border)",
                    borderRadius: "var(--radius-xs)",
                    fontSize: 10,
                    color: "var(--dash-text)",
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font-ui)",
                    zIndex: 10,
                  }}
                >
                  {node.label}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="map-legend">
          <div className="map-legend-item">
            <span className="map-legend-dot" style={{ background: "var(--dash-accent)" }}></span>
            Active
          </div>
          <div className="map-legend-item">
            <span className="map-legend-dot" style={{ background: "var(--dash-danger)" }}></span>
            Critical
          </div>
          <div className="map-legend-item">
            <span className="map-legend-dot" style={{ background: "var(--dash-success)", opacity: 0.6 }}></span>
            Resolved
          </div>
        </div>

        <div className="map-coords">
          18.5204° N, 73.8567° E
        </div>
      </div>
    </div>
  );
}

export default memo(GISMap);

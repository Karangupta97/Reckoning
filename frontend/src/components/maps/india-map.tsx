"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Minus, Layers } from "lucide-react";
import { dashboardCardClassName } from "@/components/super-admin-dashboard/dashboard-card";

export default function IndiaMap() {
  const [zoom, setZoom] = useState(1);

  const hotspots = [
    { left: "49%", top: "26%", size: 180, color: "#ef4444" }, // Delhi
    { left: "34%", top: "49%", size: 140, color: "#f97316" }, // Mumbai
    { left: "36%", top: "54%", size: 120, color: "#eab308" }, // Pune
    { left: "47%", top: "57%", size: 120, color: "#f59e0b" }, // Hyderabad
    { left: "48%", top: "78%", size: 120, color: "#facc15" }, // Chennai
    { left: "63%", top: "47%", size: 140, color: "#ef4444" }, // Kolkata
    { left: "43%", top: "69%", size: 120, color: "#fb923c" }, // Bangalore
    { left: "28%", top: "42%", size: 100, color: "#facc15" }, // Ahmedabad
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${dashboardCardClassName} p-5`}
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
            India Infrastructure Heatmap
          </h3>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Complaint & Risk Density Analysis
          </p>
        </div>

        <select
          className="
            rounded-xl
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            px-4
            py-2
            text-sm
            text-[var(--color-text-primary)]
            outline-none
          "
        >
          <option>Risk View</option>
          <option>Complaint View</option>
          <option>Budget View</option>
        </select>
      </div>

      {/* Map Container */}
      <div
        className="
          relative
          h-[360px] sm:h-[400px] lg:h-[440px]
          overflow-hidden
          rounded-2xl
          border
          border-white/10
          bg-gradient-to-br from-[#2d3652] via-[#313b58] to-[#2a3350]
        "
      >
        {/* Heat Layer */}
        {hotspots.map((spot, index) => (
          <div
            key={index}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: spot.left,
              top: spot.top,
            }}
          >
            <div
              style={{
                width: spot.size,
                height: spot.size,
                background: spot.color,
              }}
              className="rounded-full opacity-50 blur-[70px]"
            />
          </div>
        ))}

        {/* Map */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-all duration-300"
          style={{
            transform: `scale(${zoom})`,
          }}
        >
          <div className="relative h-[90%] w-[90%] -translate-x-2">
            <Image
              src="/maps/india-map.svg"
              alt="India Map"
              fill
              priority
              quality={100}
              className="object-contain"
            />
          </div>
        </div>

        {/* Zoom controls — top right */}
        <div className="absolute right-4 top-4 z-10 flex flex-col gap-2 sm:right-6 sm:top-6 sm:gap-3">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#1d2437] text-white transition-all hover:bg-[#28324d] sm:h-12 sm:w-12"
            aria-label="Zoom in"
          >
            <Plus size={18} />
          </button>

          <button
            onClick={() => setZoom((z) => Math.max(z - 0.1, 0.8))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#1d2437] text-white transition-all hover:bg-[#28324d] sm:h-12 sm:w-12"
            aria-label="Zoom out"
          >
            <Minus size={18} />
          </button>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#1d2437] text-white transition-all hover:bg-[#28324d] sm:h-12 sm:w-12"
            aria-label="Map layers"
          >
            <Layers size={18} />
          </button>
        </div>

        {/* Risk legend — bottom right (clear of zoom controls) */}
        <div className="absolute bottom-4 right-4 z-10 rounded-2xl border border-white/10 bg-[#1d2437] p-3 sm:bottom-6 sm:right-6 sm:p-4">
          <div className="space-y-2 sm:space-y-2.5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-3.5 w-3.5 shrink-0 rounded bg-red-500 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap text-xs text-white sm:text-sm">
                Very High Risk
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-3.5 w-3.5 shrink-0 rounded bg-orange-500 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap text-xs text-white sm:text-sm">
                High Risk
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-3.5 w-3.5 shrink-0 rounded bg-yellow-500 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap text-xs text-white sm:text-sm">
                Medium Risk
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-3.5 w-3.5 shrink-0 rounded bg-green-500 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap text-xs text-white sm:text-sm">
                Low Risk
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-3.5 w-3.5 shrink-0 rounded bg-cyan-500 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap text-xs text-white sm:text-sm">
                Very Low Risk
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
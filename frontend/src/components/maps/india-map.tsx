"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Minus, Layers } from "lucide-react";

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
      className="rounded-2xl border border-white/10 bg-[var(--color-card)] p-5"
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">
            India Infrastructure Heatmap
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Complaint & Risk Density Analysis
          </p>
        </div>

        <select
          className="
            rounded-xl
            border
            border-white/10
            bg-[#303a58]
            px-4
            py-2
            text-sm
            text-slate-200
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
          h-[600px] xl:h-[720px]
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
          <div className="relative h-[90%] w-[90%] translate-x-4">
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

        {/* Controls */}
        <div className="absolute left-6 top-1/2 flex -translate-y-1/2 flex-col gap-3">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}
            className="
              flex h-12 w-12 items-center justify-center
              rounded-xl
              border border-white/10
              bg-[#1d2437]
              text-white
              transition-all
              hover:bg-[#28324d]
            "
          >
            <Plus size={18} />
          </button>

          <button
            onClick={() => setZoom((z) => Math.max(z - 0.1, 0.8))}
            className="
              flex h-12 w-12 items-center justify-center
              rounded-xl
              border border-white/10
              bg-[#1d2437]
              text-white
              transition-all
              hover:bg-[#28324d]
            "
          >
            <Minus size={18} />
          </button>

          <button
            className="
              flex h-12 w-12 items-center justify-center
              rounded-xl
              border border-white/10
              bg-[#1d2437]
              text-white
              transition-all
              hover:bg-[#28324d]
            "
          >
            <Layers size={18} />
          </button>
        </div>

        {/* Legend */}
        <div
          className="
            absolute
            bottom-6
            left-6
            rounded-2xl
            border
            border-white/10
            bg-[#1d2437]
            p-5
          "
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-red-500" />
              <span className="text-sm text-white">Very High Risk</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-orange-500" />
              <span className="text-sm text-white">High Risk</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-yellow-500" />
              <span className="text-sm text-white">Medium Risk</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-green-500" />
              <span className="text-sm text-white">Low Risk</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-cyan-500" />
              <span className="text-sm text-white">Very Low Risk</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
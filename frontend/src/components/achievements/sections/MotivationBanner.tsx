"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export function MotivationBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
      style={{
        background: "linear-gradient(135deg, #059669 0%, #10B981 40%, #22C55E 100%)",
        boxShadow: "0 8px 32px rgba(16, 185, 129, 0.25)",
      }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white blur-2xl" />
      </div>

      <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Icon */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
          <Shield size={28} className="text-white" strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
            YOU ARE MAKING A REAL IMPACT!
          </h3>
          <p className="text-sm sm:text-base text-white/85">
            Your reports helped make roads safer for{" "}
            <span className="font-bold text-white">12,430 citizens</span>.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex -space-x-2">
            {["#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#22C55E"].map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: color, zIndex: 5 - i }}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span className="text-sm font-bold text-white bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
            +12K
          </span>
        </div>
      </div>
    </motion.div>
  );
}

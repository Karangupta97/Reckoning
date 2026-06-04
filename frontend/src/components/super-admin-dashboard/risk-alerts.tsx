"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface RiskAlert {
  rank: number;
  projectName: string;
  state: string;
  riskScore: number;
  potentialLeakage: string;
  trend: number[];
}

export default function RiskAlerts() {
  const alerts: RiskAlert[] = [
    {
      rank: 1,
      projectName: "NH-48 Expansion",
      state: "Maharashtra",
      riskScore: 91,
      potentialLeakage: "₹4.2 Cr",
      trend: [65, 72, 78, 85, 91],
    },
    {
      rank: 2,
      projectName: "PMGSY Bihar Package-22",
      state: "Bihar",
      riskScore: 87,
      potentialLeakage: "₹3.8 Cr",
      trend: [60, 68, 75, 82, 87],
    },
    {
      rank: 3,
      projectName: "SH-17 Rehab Project",
      state: "Karnataka",
      riskScore: 82,
      potentialLeakage: "₹2.9 Cr",
      trend: [55, 62, 70, 78, 82],
    },
    {
      rank: 4,
      projectName: "Rural Connectivity - UP-31",
      state: "Uttar Pradesh",
      riskScore: 79,
      potentialLeakage: "₹2.6 Cr",
      trend: [50, 58, 68, 74, 79],
    },
    {
      rank: 5,
      projectName: "ODR Phase-III Package",
      state: "Odisha",
      riskScore: 76,
      potentialLeakage: "₹2.1 Cr",
      trend: [48, 55, 65, 72, 76],
    },
  ];

  const getRiskColor = (score: number) => {
    if (score >= 90) return "text-red-500";
    if (score >= 80) return "text-orange-500";
    if (score >= 70) return "text-amber-500";
    return "text-yellow-500";
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 90) return "bg-red-500/20 border-red-500/40";
    if (score >= 80) return "bg-orange-500/20 border-orange-500/40";
    if (score >= 70) return "bg-amber-500/20 border-amber-500/40";
    return "bg-yellow-500/20 border-yellow-500/40";
  };

  const generateSparklinePath = (data: number[]) => {
    const width = 60;
    const height = 24;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-[#111827] border border-[#1e2a3a] p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">AI Risk Alerts</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Top 5 High Risk Projects
          </p>
        </div>
        <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
          View All
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ backgroundColor: "rgba(30, 41, 59, 0.5)" }}
            className="flex items-center gap-3 rounded-lg p-2.5 transition-colors cursor-pointer group"
          >
            {/* Rank */}
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[#1e2a3a] text-xs font-semibold text-slate-400">
              {alert.rank}
            </div>

            {/* Project Info */}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-slate-200 truncate group-hover:text-white">
                {alert.projectName}
              </span>
              <span className="text-[10px] text-slate-500 truncate">
                {alert.state}
              </span>
            </div>

            {/* Risk Score */}
            <div className="flex flex-col items-end gap-1">
              <span
                className={`text-sm font-bold ${getRiskColor(alert.riskScore)}`}
              >
                {alert.riskScore}%
              </span>
              <span className="text-xs font-medium text-slate-400">
                {alert.potentialLeakage}
              </span>
            </div>

            {/* Sparkline */}
            <svg width="60" height="24" className="flex-shrink-0 opacity-60">
              <path
                d={generateSparklinePath(alert.trend)}
                fill="none"
                stroke={
                  alert.riskScore >= 90
                    ? "#ef4444"
                    : alert.riskScore >= 80
                    ? "#f97316"
                    : "#eab308"
                }
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
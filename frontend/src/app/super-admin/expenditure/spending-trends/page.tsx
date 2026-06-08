"use client";
import { BarChart3 } from "lucide-react";
import { PageShell } from "@/components/super-admin-dashboard/page-shell";
export default function SpendingTrendsPage() {
  return <PageShell icon={BarChart3} title="Spending Trends" subtitle="Quarter-on-quarter expenditure trend analysis"
    color="text-cyan-400"
    stats={[
      { label: "This Quarter",   value: "₹82,400 Cr", color: "text-cyan-400"   },
      { label: "vs Last Quarter",value: "+12.4%",      color: "text-amber-400"  },
      { label: "Anomalies",      value: "23",          color: "text-red-400"    },
      { label: "Projects",       value: "4,820",       color: "text-emerald-400"},
    ]} />;
}

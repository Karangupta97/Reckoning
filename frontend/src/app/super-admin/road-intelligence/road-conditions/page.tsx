"use client";
import { Route } from "lucide-react";
import { PageShell } from "@/components/super-admin-dashboard/page-shell";
export default function RoadConditionsPage() {
  return <PageShell icon={Route} title="Road Conditions" subtitle="Real-time road quality index across national highways"
    color="text-cyan-400"
    stats={[
      { label: "Roads Monitored", value: "2,45,678", color: "text-cyan-400"    },
      { label: "Good Condition",  value: "68%",       color: "text-emerald-400" },
      { label: "Needs Repair",    value: "24%",       color: "text-amber-400"   },
      { label: "Critical",        value: "8%",        color: "text-red-400"     },
    ]} />;
}

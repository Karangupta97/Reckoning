"use client";
import { FileText } from "lucide-react";
import { PageShell } from "@/components/super-admin-dashboard/page-shell";
export default function AuditInsightsPage() {
  return <PageShell icon={FileText} title="Audit Insights" subtitle="AI-generated expenditure audit flags and recommendations"
    color="text-cyan-400"
    stats={[
      { label: "Audit Flags",    value: "148",  color: "text-red-400"     },
      { label: "Resolved",       value: "92",   color: "text-emerald-400" },
      { label: "Pending",        value: "56",   color: "text-amber-400"   },
      { label: "Risk Value",     value: "₹14.2 Cr", color: "text-orange-400" },
    ]} />;
}

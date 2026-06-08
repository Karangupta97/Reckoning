"use client";
import { BarChart3 } from "lucide-react";
import { PageShell } from "@/components/super-admin-dashboard/page-shell";
export default function BudgetAllocationPage() {
  return <PageShell icon={BarChart3} title="Budget Allocation" subtitle="State-wise and project-wise budget distribution"
    color="text-cyan-400"
    stats={[
      { label: "Total Budget",   value: "₹4.2L Cr", color: "text-cyan-400"    },
      { label: "Allocated",      value: "₹3.8L Cr", color: "text-emerald-400" },
      { label: "Utilised",       value: "₹2.9L Cr", color: "text-amber-400"   },
      { label: "Unspent",        value: "₹0.9L Cr", color: "text-red-400"     },
    ]} />;
}

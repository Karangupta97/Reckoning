"use client";
import { ShieldAlert } from "lucide-react";
import { PageShell } from "@/components/super-admin-dashboard/page-shell";
export default function InfrastructureHealthPage() {
  return <PageShell icon={ShieldAlert} title="Infrastructure Health" subtitle="Bridge, tunnel and highway structural health scores"
    color="text-cyan-400"
    stats={[
      { label: "Structures",    value: "48,320",  color: "text-cyan-400"    },
      { label: "Healthy",       value: "72%",     color: "text-emerald-400" },
      { label: "At Risk",       value: "21%",     color: "text-amber-400"   },
      { label: "Critical",      value: "7%",      color: "text-red-400"     },
    ]} />;
}

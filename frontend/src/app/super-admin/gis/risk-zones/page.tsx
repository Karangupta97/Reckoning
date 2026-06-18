"use client";
import { ShieldAlert } from "lucide-react";
import { PageShell } from "@/components/super-admin-dashboard/page-shell";
export default function RiskZonesPage() {
  return <PageShell icon={ShieldAlert} title="Risk Zones" subtitle="Geofenced high-risk infrastructure zones and hotspots"
    color="text-red-400"
    stats={[
      { label: "Risk Zones",      value: "1,280", color: "text-red-400"    },
      { label: "Critical Zones",  value: "142",   color: "text-orange-400" },
      { label: "States Affected", value: "18",    color: "text-amber-400"  },
      { label: "Monitored",       value: "94%",   color: "text-cyan-400"   },
    ]} />;
}

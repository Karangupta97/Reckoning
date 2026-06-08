"use client";
import { Map } from "lucide-react";
import { PageShell } from "@/components/super-admin-dashboard/page-shell";
export default function SatelliteViewPage() {
  return <PageShell icon={Map} title="Satellite View" subtitle="High-resolution satellite imagery for infrastructure verification"
    color="text-cyan-400"
    stats={[
      { label: "Coverage",       value: "94%",   color: "text-cyan-400"    },
      { label: "Last Updated",   value: "2d ago",color: "text-emerald-400" },
      { label: "Images",         value: "84,200",color: "text-amber-400"   },
      { label: "Flagged Sites",  value: "320",   color: "text-red-400"     },
    ]} />;
}

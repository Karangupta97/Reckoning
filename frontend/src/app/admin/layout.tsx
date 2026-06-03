import type { Metadata } from "next";
import AdminShell from "@/components/admin/dashboard/AdminShell";
import "@/style/dashboard.css";

export const metadata: Metadata = {
  title: "RoadWatch AI — Operations Dashboard",
  description:
    "AI-powered road monitoring and public accountability command center.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}

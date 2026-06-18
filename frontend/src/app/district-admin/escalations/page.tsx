import { redirect } from "next/navigation";

// Legacy route — escalations now live at /district-admin/dashboard/escalation
export default function EscalationsRedirect() {
  redirect("/district-admin/dashboard/escalation");
}

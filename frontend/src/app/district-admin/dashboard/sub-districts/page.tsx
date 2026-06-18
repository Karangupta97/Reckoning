import { redirect } from "next/navigation";

// Redirect the parent segment to the canonical list page
export default function SubDistrictsIndex() {
  redirect("/district-admin/dashboard/sub-districts/all-sub-districts");
}

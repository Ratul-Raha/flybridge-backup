import { redirect } from "next/navigation";

export default function LegacyAdminSettingsPage() {
  redirect("/dashboard/settings/payments");
}

import { redirect } from "next/navigation";

export default function LegacyTechnicianTicketsPage() {
  redirect("/tickets?scope=department");
}

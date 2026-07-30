import { redirect } from "next/navigation";

export default function LegacyDepartmentTicketsPage() {
  redirect("/tickets?scope=department");
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DepartmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user.role !== "ADMIN" && session?.user.role !== "SUPERVISOR") {
    redirect("/dashboard");
  }

  return children;
}

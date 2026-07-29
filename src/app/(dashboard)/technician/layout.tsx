import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user.role !== "ADMIN" && session?.user.role !== "AGENT") {
    redirect("/dashboard");
  }

  return children;
}

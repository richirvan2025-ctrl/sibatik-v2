import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ExecutiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user.role !== "ADMIN" && session?.user.role !== "EXECUTIVE") {
    redirect("/dashboard");
  }

  return children;
}

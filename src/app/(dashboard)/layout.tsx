import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AppSessionProvider } from "@/components/auth/session-provider";
import { auth } from "@/lib/auth";
import { getSinergyLoginUrl } from "@/lib/sinergy-sso";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect(getSinergyLoginUrl());
  }

  return (
    <AppSessionProvider session={session}>
      <DashboardShell>{children}</DashboardShell>
    </AppSessionProvider>
  );
}

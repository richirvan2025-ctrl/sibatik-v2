import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AppSessionProvider } from "@/components/auth/session-provider";
import { auth } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F6FB] p-6">
        <section className="w-full max-w-lg rounded-[20px] border border-[#DCE4EF] bg-white p-8 text-center shadow-[0_18px_48px_rgba(29,43,76,0.1)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EDFF] text-[#7047EB]">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-[#101A36]">
            Identitas Sinergy belum tersedia
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#68758C]">
            SIBATIK tidak memiliki login mandiri. Buka modul ini melalui Sinergy,
            atau atur pengguna pengembangan untuk menjalankan modul secara lokal.
          </p>
        </section>
      </main>
    );
  }

  return (
    <AppSessionProvider session={session}>
      <DashboardShell>{children}</DashboardShell>
    </AppSessionProvider>
  );
}

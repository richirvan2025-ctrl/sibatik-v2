"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";
import { ExternalLink, Menu } from "lucide-react";
import Image from "next/image";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] min-h-[100svh] bg-[var(--background)] text-[#101A36]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-[#06445B]/75 backdrop-blur-[2px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-[248px] transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[calc(4rem+env(safe-area-inset-top))] shrink-0 items-center justify-between border-b border-[var(--brand-header-border)] bg-[var(--brand-header)] px-4 pt-[env(safe-area-inset-top)] text-white shadow-[0_8px_24px_rgba(4,76,113,0.16)] md:h-16 md:px-7 md:pt-0">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-sm transition-colors hover:bg-white/20 md:hidden"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Image
              src="/sibatik-logo-white.png"
              alt="SIBATIK"
              width={2201}
              height={714}
              sizes="123px"
              className="h-10 w-auto shrink-0 object-contain object-left md:hidden"
              priority
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <NotificationBell tone="dark" />
            <a
              href="https://sinergy.idbbali.ac.id/dashboard.php"
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-white/20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kembali ke Sinergy</span>
            </a>
          </div>
        </header>

        <main className="app-scrollbar flex-1 overflow-y-auto bg-[#F4F8FA]">
          <div className="mx-auto min-h-full w-full max-w-[1680px] p-4 md:p-6 xl:p-7">{children}</div>
        </main>
      </div>
    </div>
  );
}

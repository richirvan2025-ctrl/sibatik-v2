"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";
import { ExternalLink, Menu } from "lucide-react";
import Image from "next/image";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div
        aria-hidden="true"
        className="sibatik-intro pointer-events-none fixed inset-0 z-[100] grid place-items-center overflow-hidden text-white"
      >
        <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-white/[0.07] blur-3xl" />
        <div className="absolute -right-16 bottom-1/4 h-56 w-56 rounded-full bg-[#8FC5D1]/15 blur-3xl" />
        <div className="sibatik-intro-content relative flex flex-col items-center">
          <div className="rounded-[24px] border border-white/15 bg-white/[0.07] px-8 py-6 shadow-[0_24px_70px_rgba(0,25,43,0.28)] backdrop-blur-sm">
            <Image
              src="/sibatik-logo-white.png"
              alt=""
              width={2201}
              height={714}
              sizes="180px"
              className="h-14 w-auto object-contain"
              priority
            />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C6E0E6]">
            Menyiapkan ruang kerja Anda
          </p>
          <div className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-white/15">
            <span className="sibatik-intro-progress block h-full origin-left rounded-full" />
          </div>
        </div>
      </div>

      <div className="sibatik-shell-enter flex h-[100dvh] min-h-[100svh] bg-[var(--background)] text-[#101A36]">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-[#06445B]/75 backdrop-blur-[2px] md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-30 w-[248px] transition-transform duration-300 ease-in-out md:static md:w-[224px] md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sibatik-header-batik z-10 flex h-[calc(4rem+env(safe-area-inset-top))] shrink-0 items-center justify-between border-b border-[var(--brand-header-border)] bg-[var(--brand-header)] px-4 pt-[env(safe-area-inset-top)] text-white shadow-[0_4px_12px_rgba(3,59,89,0.22)] md:h-14 md:px-5 md:pt-0">
            <div className="relative z-[1] flex min-w-0 items-center gap-3">
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

            <div className="relative z-[1] ml-auto flex items-center gap-2">
              <NotificationBell tone="dark" />
              <a
                href="https://sinergy.idbbali.ac.id/dashboard.php"
                className="flex h-10 items-center gap-2 rounded-xl border border-white/85 bg-white px-3.5 text-[12px] font-bold text-[#044C71] shadow-[0_3px_10px_rgba(0,34,55,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F7FBFC] hover:shadow-[0_6px_16px_rgba(0,34,55,0.20)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/35"
              >
                <ExternalLink className="h-4 w-4" strokeWidth={2} />
                <span className="hidden sm:inline">Kembali ke Sinergy</span>
              </a>
            </div>
          </header>

          <main className="app-scrollbar flex-1 overflow-y-auto bg-[#F4F8FA]">
            <div className="mx-auto min-h-full w-full max-w-[1680px] p-4 md:p-6 xl:p-7">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}

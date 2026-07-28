"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";
import { CalendarDays, Menu } from "lucide-react";
import Image from "next/image";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F3F6FB] text-[#101A36]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-[#081A34]/70 backdrop-blur-[2px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-[276px] transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar — mobile (hamburger) + desktop (notification bell) */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#DEE5EF] bg-white px-4 md:px-7">
          {/* Left: hamburger (mobile only) + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE4EF] bg-white text-[#526079] shadow-sm transition-colors hover:bg-[#F5F2FF] hover:text-[#7047EB] md:hidden"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[#DCE4EF] bg-white shadow-sm">
                <Image
                  src="/logo.png"
                  alt="IDB Bali"
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
              </div>
              <div>
                <p className="text-[14px] font-bold leading-tight text-[#101A36]">IDB Bali</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#7047EB]">SIBATIK</p>
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EDFF] text-[#7047EB]">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8190A8]">
                  Pusat Layanan Kampus
                </p>
                <p className="text-sm font-bold text-[#16213D]">SIBATIK IDB Bali</p>
              </div>
            </div>
          </div>

          {/* Right: notification bell */}
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="app-scrollbar flex-1 overflow-y-auto">
          <div className="mx-auto min-h-full w-full max-w-[1680px] p-4 md:p-6 xl:p-7">{children}</div>
        </main>
      </div>
    </div>
  );
}

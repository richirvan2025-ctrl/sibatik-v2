"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";
import { Menu, ExternalLink } from "lucide-react";
import Image from "next/image";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors md:hidden"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-[#E2E8F0] overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="IDB Bali"
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
              </div>
              <div>
                <p className="text-[14px] font-bold leading-tight text-[#1E293B]">IDB Bali</p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#F97316]">Helpdesk</p>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <a
              href="https://sinergy.idbbali.ac.id/dashboard.php"
              className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-[12px] font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back to SINERGY</span>
            </a>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 min-h-screen">{children}</div>
        </main>
      </div>
    </div>
  );
}

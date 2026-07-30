"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Ticket, CheckCheck, X } from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  ticket: {
    ticketNumber: string;
    title: string;
    category: { name: string; department: string | null };
  };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j`;
  return `${Math.floor(hrs / 24)}h`;
}

export function NotificationBell({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {}
  };

  useEffect(() => {
    const initialFetch = window.setTimeout(fetchNotifications, 0);
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      window.clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, []);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-3 ${
          tone === "dark"
            ? "border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/25"
            : "border-[#DCE4EF] bg-white text-[#637089] hover:border-[#C9BCF8] hover:bg-[#F5F2FF] hover:text-[#7047EB] focus-visible:ring-[#7047EB]/20"
        }`}
        aria-label="Buka notifikasi"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[14px] border border-[#DCE4EF] bg-white shadow-[0_18px_50px_rgba(11,29,58,0.18)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#7047EB]" />
              <span className="text-sm font-semibold text-[#1E293B]">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#7047EB] transition-colors hover:bg-[#F0EDFF]"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tandai semua
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8A96AB] transition-colors hover:bg-[#F1F3F8] hover:text-[#26334D]"
                aria-label="Tutup notifikasi"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-[#F1F5F9]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F1F5F9] mb-3">
                  <Bell className="h-6 w-6 text-[#CBD5E1]" />
                </div>
                <p className="text-sm font-medium text-[#64748B]">Tidak ada notifikasi</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">Tiket baru akan muncul di sini</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-[#F8FAFC] transition-colors ${
                    !n.isRead ? "bg-blue-50/60" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        !n.isRead ? "bg-[#2563EB]" : "bg-[#F1F5F9]"
                      }`}
                    >
                      <Ticket
                        className={`h-4 w-4 ${!n.isRead ? "text-white" : "text-[#94A3B8]"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-semibold font-mono ${
                            !n.isRead ? "text-[#2563EB]" : "text-[#94A3B8]"
                          }`}
                        >
                          {n.ticket.ticketNumber}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] shrink-0">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#1E293B] mt-0.5 truncate">
                        {n.ticket.title}
                      </p>
                      <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <span className="mt-1.5 inline-block rounded-md bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-medium text-[#64748B]">
                        {n.ticket.category.department || n.ticket.category.name}
                      </span>
                    </div>
                    {!n.isRead && (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#2563EB]" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

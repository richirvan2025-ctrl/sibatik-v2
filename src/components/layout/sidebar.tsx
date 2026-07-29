"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  UsersRound,
  Settings,
  BarChart3,
  Shield,
  BookOpen,
  Building2,
  MessageCircle,
  Crown,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const navigation = {
  ADMIN: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Asisten", href: "/chat", icon: MessageCircle, beta: true },
    { name: "Semua Tiket", href: "/tickets", icon: Ticket },
    { name: "Buat Tiket", href: "/tickets/new", icon: PlusCircle },
    { name: "Knowledge Base", href: "/kb", icon: BookOpen },
    { name: "KB Admin", href: "/admin/kb", icon: BookOpen },
    { name: "Manajemen User", href: "/admin/users", icon: Users },
    { name: "Group User", href: "/admin/groups", icon: UsersRound },
    { name: "Kategori", href: "/admin/categories", icon: Settings },
    { name: "Laporan", href: "/admin/reports", icon: BarChart3 },
  ],
  USER: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Asisten", href: "/chat", icon: MessageCircle, beta: true },
    { name: "Tiket Saya", href: "/tickets", icon: Ticket },
    { name: "Buat Tiket", href: "/tickets/new", icon: PlusCircle },
    { name: "Knowledge Base", href: "/kb", icon: BookOpen },
  ],
  AGENT: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Asisten", href: "/chat", icon: MessageCircle, beta: true },
    { name: "Tiket Divisi", href: "/technician/tickets", icon: Shield },
    { name: "Tiket Saya", href: "/tickets", icon: Ticket },
    { name: "Buat Tiket", href: "/tickets/new", icon: PlusCircle },
    { name: "Knowledge Base", href: "/kb", icon: BookOpen },
  ],
  SUPERVISOR: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Asisten", href: "/chat", icon: MessageCircle, beta: true },
    { name: "Tiket Divisi", href: "/department/tickets", icon: Building2 },
    { name: "Tiket Saya", href: "/tickets", icon: Ticket },
    { name: "Buat Tiket", href: "/tickets/new", icon: PlusCircle },
    { name: "Knowledge Base", href: "/kb", icon: BookOpen },
  ],
  EXECUTIVE: [
    { name: "Dashboard", href: "/executive/dashboard", icon: Crown },
    { name: "Monitor Tiket", href: "/executive/tickets", icon: Ticket },
    { name: "Laporan", href: "/executive/reports", icon: BarChart3 },
  ],
};

type NavItem = { name: string; href: string; icon: React.ElementType; beta?: boolean };

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user?.role as keyof typeof navigation) || "USER";
  const items = (navigation[role] || navigation.USER) as NavItem[];

  return (
    <div className="flex h-full flex-col border-r border-[#E2E8F0] bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-[#E2E8F0] px-5 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-[#E2E8F0] overflow-hidden">
          <Image
            src="/logo.png"
            alt="IDB Bali Logo"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="text-[14px] font-bold leading-tight text-[#1E293B]">IDB Bali</h1>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-[#0EA5E9]">Support Ticket System</p>
        </div>
      </div>

      {/* Navigation - scrollable */}
      <nav className="flex-1 overflow-y-auto space-y-0.5 px-3 py-3">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-[#EFF6FF] text-[#7C3AED]"
                  : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200",
                  isActive
                    ? "bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/25"
                    : "bg-[#F1F5F9] text-[#94A3B8] group-hover:bg-white group-hover:text-[#64748B] group-hover:shadow-sm"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
              </div>
              <span className="flex items-start gap-1">
                {item.name}
                {item.beta && (
                  <sup className="text-[9px] font-bold text-red-500 leading-none mt-0.5">Beta</sup>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Info - compact */}
      <div className="border-t border-[#E2E8F0] p-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF6FF] text-[#7C3AED] text-[11px] font-bold shrink-0">
            {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-[#1E293B] truncate">
              {session?.user?.name}
            </p>
            <p className="text-[10px] text-[#94A3B8] truncate">
              {role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

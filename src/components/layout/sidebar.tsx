"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  Settings,
  BarChart3,
  Shield,
  LogOut,
  BookOpen,
  Building2,
  MessageCircle,
  Crown,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

const navigation = {
  ADMIN: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Asisten", href: "/chat", icon: MessageCircle, beta: true },
    { name: "Semua Tiket", href: "/tickets", icon: Ticket },
    { name: "Buat Tiket", href: "/tickets/new", icon: PlusCircle },
    { name: "Knowledge Base", href: "/kb", icon: BookOpen },
    { name: "KB Admin", href: "/admin/kb", icon: BookOpen },
    { name: "Manajemen User", href: "/admin/users", icon: Users },
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
    <div className="flex h-full flex-col border-r border-[#203858] bg-[#0B1D3A] text-white shadow-[10px_0_30px_rgba(8,26,52,0.08)]">
      {/* Logo */}
      <div className="flex h-[84px] items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[14px] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
          <Image
            src="/logo.png"
            alt="IDB Bali Logo"
            width={38}
            height={38}
            className="h-9 w-9 object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="text-[17px] font-bold leading-tight tracking-[-0.02em] text-white">
            IDB BALI
          </h1>
          <p className="mt-1 text-[10px] font-medium tracking-wide text-[#B7C5DA]">
            SIBATIK Support
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="app-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7185A2]">
          Menu Utama
        </p>
        {items.map((item) => {
          const hasMoreSpecificActiveItem = items.some(
            (candidate) =>
              candidate.href !== item.href &&
              candidate.href.startsWith(`${item.href}/`) &&
              (pathname === candidate.href || pathname.startsWith(`${candidate.href}/`))
          );
          const isActive =
            !hasMoreSpecificActiveItem &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));
          return (
            <div key={item.name}>
              {role === "ADMIN" && item.name === "KB Admin" && (
                <p className="mb-2 mt-5 border-t border-white/10 px-3 pt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7185A2]">
                  Administrasi
                </p>
              )}
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200",
                  isActive
                    ? "bg-[#7047EB] text-white shadow-[0_8px_18px_rgba(112,71,235,0.28)]"
                    : "text-[#B8C6D9] hover:bg-white/7 hover:text-white"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    isActive ? "bg-white/14 text-white" : "text-[#9DB0C9] group-hover:text-white"
                  )}
                >
                  <item.icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
                </div>
                <span className="flex min-w-0 flex-1 items-start gap-1.5">
                  {item.name}
                  {item.beta && (
                    <sup className="mt-0.5 rounded-full bg-[#F6B73C] px-1.5 py-0.5 text-[8px] font-extrabold leading-none text-[#3A2500]">BETA</sup>
                  )}
                </span>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-white/10 p-4">
        <div className="mb-2 rounded-[14px] border border-white/10 bg-white/[0.055] p-3.5">
          <p className="truncate text-[13px] font-bold text-white">
            {session?.user?.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-[#91A5C0]">
            {session?.user?.email}
          </p>
          <span className="mt-2 inline-flex items-center rounded-full border border-[#8E72F1]/30 bg-[#7047EB]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#D8CEFF]">
            {role === "EXECUTIVE" ? (
              <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                <Crown className="h-3 w-3" />
                Eksekutif
              </span>
            ) : role === "SUPERVISOR" ? (
              <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                <Building2 className="h-3 w-3" />
                Supervisor
              </span>
            ) : role === "AGENT" ? (
              <span className="flex items-center gap-1 text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                <Shield className="h-3 w-3" />
                Agent
              </span>
            ) : (
              <span>{role}</span>
            )}
          </span>
        </div>
        <Button
          variant="outline"
          className="h-10 w-full justify-start border-white/10 bg-white/[0.035] text-[13px] text-[#B8C6D9] shadow-none hover:border-[#F08080]/25 hover:bg-[#E5484D]/10 hover:text-[#FFB9BC]"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

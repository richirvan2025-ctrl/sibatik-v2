"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "@/components/auth/session-provider";
import {
  BarChart3,
  BookOpen,
  Building2,
  Crown,
  LayoutDashboard,
  MessageCircle,
  PlusCircle,
  Settings,
  Shield,
  Ticket,
  Users,
  UsersRound,
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
    { name: "Grup Pengguna", href: "/admin/groups", icon: UsersRound },
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
  MAHASISWA: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Asisten", href: "/chat", icon: MessageCircle, beta: true },
    { name: "Tiket Saya", href: "/tickets", icon: Ticket },
    { name: "Buat Tiket", href: "/tickets/new", icon: PlusCircle },
    { name: "Knowledge Base", href: "/kb", icon: BookOpen },
  ],
  AGENT: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Asisten", href: "/chat", icon: MessageCircle, beta: true },
    { name: "Tiket Divisi", href: "/tickets?scope=department", icon: Shield },
    { name: "Tiket Saya", href: "/tickets", icon: Ticket },
    { name: "Buat Tiket", href: "/tickets/new", icon: PlusCircle },
    { name: "Knowledge Base", href: "/kb", icon: BookOpen },
  ],
  SUPERVISOR: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Asisten", href: "/chat", icon: MessageCircle, beta: true },
    { name: "Tiket Divisi", href: "/tickets?scope=department", icon: Building2 },
    { name: "Tiket Saya", href: "/tickets", icon: Ticket },
    { name: "Buat Tiket", href: "/tickets/new", icon: PlusCircle },
    { name: "Knowledge Base", href: "/kb", icon: BookOpen },
  ],
  EXECUTIVE: [
    { name: "Dashboard", href: "/dashboard", icon: Crown },
    { name: "Monitor Tiket", href: "/tickets", icon: Ticket },
    { name: "Tiket Saya", href: "/tickets?scope=mine", icon: Ticket },
    { name: "Buat Tiket", href: "/tickets/new", icon: PlusCircle },
    { name: "Laporan", href: "/executive/reports", icon: BarChart3 },
  ],
};

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  beta?: boolean;
};

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const role = (session?.user?.role as keyof typeof navigation) || "USER";
  const items = (navigation[role] || navigation.USER) as NavItem[];

  return (
    <div className="flex h-full flex-col border-r border-[var(--brand-header-border)] bg-[var(--brand-header)] text-white shadow-[10px_0_30px_rgba(4,76,113,0.10)]">
      <div className="flex h-[calc(4rem+env(safe-area-inset-top))] items-center border-b border-white/10 px-4 pt-[env(safe-area-inset-top)] md:h-16 md:pt-0">
        <Image
          src="/sibatik-logo-white.png"
          alt="SIBATIK"
          width={2201}
          height={714}
          sizes="173px"
          className="h-14 w-auto object-contain object-left"
          priority
        />
      </div>

      <nav className="app-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8FC5D1]">
          Menu Utama
        </p>
        {items.map((item) => {
          const [itemPath, itemQuery = ""] = item.href.split("?");
          const itemScope = new URLSearchParams(itemQuery).get("scope");
          const currentScope = searchParams.get("scope");
          const hasMoreSpecificActiveItem = items.some(
            (candidate) => {
              const candidatePath = candidate.href.split("?")[0];
              return (
                candidatePath !== itemPath &&
                candidatePath.startsWith(`${itemPath}/`) &&
                (pathname === candidatePath ||
                  pathname.startsWith(`${candidatePath}/`))
              );
            }
          );
          const scopeMatches =
            itemPath !== "/tickets" || itemScope === currentScope;
          const isActive =
            !hasMoreSpecificActiveItem &&
            scopeMatches &&
            (pathname === itemPath || pathname.startsWith(`${itemPath}/`));

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
                    ? "bg-white text-[#044C71] shadow-[0_8px_22px_rgba(0,47,63,0.20)]"
                    : "text-[#C9E0E5] hover:bg-white/10 hover:text-white"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "bg-[#E8F3F5] text-[#044C71]"
                      : "text-[#A9D1DA] group-hover:text-white"
                  )}
                >
                  <item.icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
                </div>
                <span className="flex min-w-0 flex-1 items-start gap-1.5">
                  {item.name}
                  {item.beta && (
                    <sup className="mt-0.5 rounded-full bg-[#F6B73C] px-1.5 py-0.5 text-[8px] font-extrabold leading-none text-[#3A2500]">
                      BETA
                    </sup>
                  )}
                </span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-2 rounded-[14px] border border-white/10 bg-white/[0.055] p-3.5">
          <p className="truncate text-[13px] font-bold text-white">
            {session?.user?.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-[#B6D7DE]">
            {session?.user?.email}
          </p>
          <span className="mt-2 inline-flex items-center rounded-full border border-[#8E72F1]/30 bg-[#7047EB]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#D8CEFF]">
            {role === "EXECUTIVE" ? (
              <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-purple-700">
                <Crown className="h-3 w-3" />
                Eksekutif
              </span>
            ) : role === "SUPERVISOR" ? (
              <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">
                <Building2 className="h-3 w-3" />
                Supervisor
              </span>
            ) : role === "AGENT" ? (
              <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                <Shield className="h-3 w-3" />
                Agent
              </span>
            ) : (
              <span>{role}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

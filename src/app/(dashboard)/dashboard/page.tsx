"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AgentPerformanceChart,
  type AgentPerformance,
} from "@/components/dashboard/agent-performance-chart";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  Plus,
  Settings2,
  ShieldCheck,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  slaBreached: number;
  avgResolutionHours: number;
}

const statCards = [
  {
    key: "total" as const,
    label: "Total Tiket",
    helper: "Semua tiket terdaftar",
    icon: Ticket,
    color: "bg-[#7047EB]",
    iconColor: "text-[#DCD3FF]",
    href: "/tickets",
  },
  {
    key: "open" as const,
    label: "Open",
    helper: "Menunggu tindak lanjut",
    icon: AlertCircle,
    color: "bg-[#268EDB]",
    iconColor: "text-[#C9EBFF]",
    href: "/tickets?status=OPEN",
  },
  {
    key: "inProgress" as const,
    label: "In Progress",
    helper: "Sedang ditangani",
    icon: Clock3,
    color: "bg-[#F4AB32]",
    iconColor: "text-[#FFF0C9]",
    href: "/tickets?status=IN_PROGRESS",
  },
  {
    key: "resolved" as const,
    label: "Resolved",
    helper: "Berhasil diselesaikan",
    icon: CheckCircle2,
    color: "bg-[#24AE78]",
    iconColor: "text-[#CBF5E4]",
    href: "/tickets?status=RESOLVED",
  },
];

const quickActions = [
  {
    label: "Buat tiket baru",
    description: "Laporkan kendala atau permintaan layanan",
    href: "/tickets/new",
    icon: Plus,
  },
  {
    label: "Knowledge Base",
    description: "Temukan panduan dan solusi mandiri",
    href: "/kb",
    icon: BookOpen,
  },
  {
    label: "Lihat semua tiket",
    description: "Pantau status dan riwayat penanganan",
    href: "/tickets",
    icon: Ticket,
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) setStats(await response.json());
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  }, []);

  useEffect(() => {
    if (session?.user?.role !== "SUPERVISOR") return;

    fetch("/api/dashboard/agent-performance")
      .then((response) => response.json())
      .then((data) => setAgentPerformance(data))
      .catch(() => {});
  }, [session]);

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#E6E0FA] border-t-[#7047EB]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#FDECEC] text-[#D43F45]">
          <AlertCircle className="h-6 w-6" />
        </div>
        <p className="font-semibold text-[#44516A]">Gagal memuat data dashboard</p>
      </div>
    );
  }

  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const today = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="overflow-hidden rounded-[16px] bg-[#102B50] px-5 py-6 text-white shadow-[0_12px_32px_rgba(16,43,80,0.16)] md:px-7 md:py-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="border border-white/15 bg-white/10 text-white shadow-none">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                {role || "USER"}
              </Badge>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#BFD0E5]">
                <span className="h-2 w-2 rounded-full bg-[#38C793]" />
                Sistem aktif
              </span>
            </div>
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] md:text-[34px]">
              Dashboard SIBATIK
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#C4D2E4] md:text-[15px]">
              Selamat datang kembali, <span className="font-semibold text-white">{session?.user?.name}</span>. Pantau layanan, tindak lanjut, dan performa tiket dalam satu tempat.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="flex min-h-12 items-center gap-3 rounded-xl border border-white/12 bg-white/[0.07] px-4">
              <CalendarDays className="h-5 w-5 text-[#B8A6FF]" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9FB1C9]">Hari ini</p>
                <p className="text-sm font-bold text-white">{today}</p>
              </div>
            </div>
            <Link
              href="/tickets/new"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#102B50] shadow-sm transition-colors hover:bg-[#F0EDFF] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/35"
            >
              <Plus className="h-4 w-4 text-[#7047EB]" />
              Buat Tiket
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Ringkasan tiket" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.key} href={card.href} className="group block rounded-[14px] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#7047EB]/25">
              <article className={`${card.color} overflow-hidden rounded-[14px] text-white shadow-[0_8px_24px_rgba(28,43,75,0.10)] transition-transform duration-200 group-hover:-translate-y-0.5`}>
                <div className="flex items-start justify-between px-5 pb-4 pt-5">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/82">{card.label}</p>
                    <p className="mt-2 text-[38px] font-bold leading-none tracking-[-0.04em]">{stats[card.key]}</p>
                    <p className="mt-1.5 text-xs font-semibold text-white/90">Tiket</p>
                  </div>
                  <Icon className={`h-10 w-10 ${card.iconColor}`} strokeWidth={1.7} />
                </div>
                <div className="flex items-center justify-between bg-black/10 px-5 py-2.5 text-[11px] font-semibold text-white/90">
                  <span>{card.helper}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </article>
            </Link>
          );
        })}
      </section>

      {isAdmin && (
        <section className="grid gap-3 md:grid-cols-3" aria-label="Metrik operasional">
          <Card className="py-0">
            <CardContent className="flex items-center gap-4 p-4.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FDECEC] text-[#D94349]">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#71809A]">SLA Breached</p>
                <p className="mt-0.5 text-xl font-bold text-[#18233E]">{stats.slaBreached}</p>
                <p className="text-xs text-[#7B879D]">Melewati batas penanganan</p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-0">
            <CardContent className="flex items-center gap-4 p-4.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF4FC] text-[#268EDB]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#71809A]">Rata-rata Resolusi</p>
                <p className="mt-0.5 text-xl font-bold text-[#18233E]">{stats.avgResolutionHours}<span className="ml-1 text-xs font-semibold text-[#7B879D]">jam</span></p>
                <p className="text-xs text-[#7B879D]">Waktu penyelesaian tiket</p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-0">
            <CardContent className="flex items-center gap-4 p-4.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF8F2] text-[#16966A]">
                <Gauge className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#71809A]">Tiket Ditutup</p>
                <p className="mt-0.5 text-xl font-bold text-[#18233E]">{stats.closed}</p>
                <p className="text-xs text-[#7B879D]">Penanganan selesai penuh</p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-[17px] text-[#14203B]">Akses Cepat</CardTitle>
              <p className="mt-1 text-xs text-[#71809A]">Langkah paling umum untuk mengelola layanan</p>
            </div>
            <Settings2 className="h-5 w-5 text-[#8A96AC]" />
          </CardHeader>
          <CardContent className="grid gap-3 pb-5 sm:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group rounded-xl border border-[#E0E6EF] bg-[#F8FAFD] p-4 transition-all hover:border-[#CFC3F8] hover:bg-[#F6F3FF] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#7047EB]/20"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEE9FF] text-[#7047EB]">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-[#17223D]">{action.label}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#71809A]">{action.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#7047EB]">
                    Buka <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="bg-[#F8FAFD]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102B50] text-white">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-[17px] text-[#14203B]">Performance Overview</CardTitle>
                <p className="mt-1 text-xs text-[#71809A]">Ringkasan kondisi layanan saat ini</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="space-y-3 rounded-xl border border-[#E0E6EF] bg-white p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#64718A]">Tiket aktif</span>
                <span className="font-bold text-[#17223D]">{stats.open + stats.inProgress}</span>
              </div>
              <div className="h-px bg-[#E8EDF4]" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#64718A]">Tiket selesai</span>
                <span className="font-bold text-[#16966A]">{stats.resolved + stats.closed}</span>
              </div>
              <div className="h-px bg-[#E8EDF4]" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#64718A]">Status layanan</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-[#16966A]"><span className="h-2 w-2 rounded-full bg-[#24AE78]" />Aktif</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {role === "SUPERVISOR" && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-[17px] text-[#14203B]">
              <Users className="h-5 w-5 text-[#7047EB]" />
              Performa Agent
            </CardTitle>
            <span className="text-xs text-[#71809A]">Bulan {new Date().toLocaleString("id-ID", { month: "long", year: "numeric" })}</span>
          </CardHeader>
          <CardContent className="pb-5">
            {agentPerformance.length === 0 ? (
              <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-[#D8E0EC] bg-[#F8FAFD] text-sm text-[#7A879D]">Belum ada data agent bulan ini</div>
            ) : (
              <AgentPerformanceChart data={agentPerformance} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

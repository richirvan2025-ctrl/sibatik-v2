"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/auth/session-provider";
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
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  Plus,
  Settings2,
  ShieldCheck,
  ShieldAlert,
  Siren,
  Ticket,
  TimerReset,
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
  dueSoon: number;
  escalated: number;
  oldestUnhandled: {
    id: string;
    ticketNumber: string;
    title: string;
    ageDays: number;
  } | null;
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
    label: "Terbuka",
    helper: "Menunggu tindak lanjut",
    icon: AlertCircle,
    color: "bg-[#268EDB]",
    iconColor: "text-[#C9EBFF]",
    href: "/tickets?status=OPEN",
  },
  {
    key: "inProgress" as const,
    label: "Dalam Proses",
    helper: "Sedang ditangani",
    icon: Clock3,
    color: "bg-[#F4AB32]",
    iconColor: "text-[#FFF0C9]",
    href: "/tickets?status=IN_PROGRESS",
  },
  {
    key: "resolved" as const,
    label: "Selesai",
    helper: "Berhasil diselesaikan",
    icon: CheckCircle2,
    color: "bg-[#24AE78]",
    iconColor: "text-[#CBF5E4]",
    href: "/tickets?status=COMPLETED",
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
    label: "Pusat Pengetahuan",
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

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  EXECUTIVE: "Eksekutif",
  SUPERVISOR: "Supervisor",
  AGENT: "Teknisi",
  USER: "Pengguna",
};

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
  const isExecutive = role === "EXECUTIVE";
  const isManagement = role === "ADMIN" || isExecutive;
  const visibleQuickActions = isExecutive
    ? [
        {
          label: "Buat tiket baru",
          description: "Ajukan request atau laporkan masalah baru",
          href: "/tickets/new",
          icon: Plus,
        },
        {
          label: "Monitor tiket",
          description: "Pantau seluruh tiket dan progres penanganan",
          href: "/tickets",
          icon: Ticket,
        },
        {
          label: "Laporan layanan",
          description: "Lihat analitik, SLA, dan performa layanan",
          href: "/executive/reports",
          icon: BarChart3,
        },
      ]
    : quickActions;
  const today = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const hasResolutionData = stats.resolved + stats.closed > 0;

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="overflow-hidden rounded-[16px] bg-[var(--brand-header)] px-5 py-6 text-white shadow-[0_12px_32px_rgba(4,76,113,0.18)] md:px-7 md:py-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="border border-white/15 bg-white/10 text-white shadow-none">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                {roleLabels[role || "USER"] || "Pengguna"}
              </Badge>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--brand-header-muted)]">
                <span className="h-2 w-2 rounded-full bg-[#38C793]" />
                Sistem aktif
              </span>
            </div>
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] md:text-[34px]">
              Dashboard SIBATIK
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#D4E7EB] md:text-[15px]">
              Selamat datang kembali, <span className="font-semibold text-white">{session?.user?.name}</span>.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="flex min-h-12 items-center gap-3 rounded-xl border border-white/12 bg-white/[0.07] px-4">
              <CalendarDays className="h-5 w-5 text-[#FFD0A6]" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9FB1C9]">Hari ini</p>
                <p className="text-sm font-bold text-white">{today}</p>
              </div>
            </div>
            {!isExecutive && (
              <Link
                href="/tickets/new"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#044C71] shadow-sm transition-colors hover:bg-[#F0F7F8] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/35"
              >
                <Plus className="h-4 w-4 text-[#F47D24]" />
                Buat Tiket
              </Link>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Ringkasan tiket" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value =
            card.key === "resolved"
              ? stats.resolved + stats.closed
              : stats[card.key];
          return (
            <Link key={card.key} href={card.href} className="group block rounded-[14px] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#7047EB]/25">
              <article className={`${card.color} overflow-hidden rounded-[14px] text-white shadow-[0_8px_24px_rgba(28,43,75,0.10)] transition-transform duration-200 group-hover:-translate-y-0.5`}>
                <div className="flex items-start justify-between px-5 pb-4 pt-5">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/82">{card.label}</p>
                    <p className="mt-2 text-[38px] font-bold leading-none tracking-[-0.04em]">{value}</p>
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

      {isManagement && (
        <section className="grid gap-3 md:grid-cols-2" aria-label="Metrik operasional">
          <Card className="py-0">
            <CardContent className="flex items-center gap-4 p-4.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF4FC] text-[#268EDB]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#71809A]">Rata-rata Resolusi</p>
                {hasResolutionData ? (
                  <p className="mt-0.5 text-xl font-bold text-[#18233E]">
                    {stats.avgResolutionHours}
                    <span className="ml-1 text-xs font-semibold text-[#7B879D]">jam</span>
                  </p>
                ) : (
                  <p className="mt-0.5 text-base font-bold text-[#44516A]">Belum ada data</p>
                )}
                <p className="text-xs text-[#7B879D]">
                  {hasResolutionData
                    ? "Waktu penyelesaian tiket"
                    : "Belum ada tiket yang diselesaikan"}
                </p>
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

      <section className="grid items-start gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-[17px] text-[#14203B]">Akses Cepat</CardTitle>
              <p className="mt-1 text-xs text-[#71809A]">Langkah paling umum untuk mengelola layanan</p>
            </div>
            <Settings2 className="h-5 w-5 text-[#8A96AC]" />
          </CardHeader>
          <CardContent
            className={`grid gap-3 pb-5 ${
              isExecutive ? "grid-cols-1" : "md:grid-cols-3"
            }`}
          >
            {visibleQuickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex min-h-[88px] items-center gap-3.5 rounded-xl border border-[#D8E0EC] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#BDAFF3] hover:bg-[#F8F6FF] hover:shadow-[0_8px_20px_rgba(112,71,235,0.12)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#7047EB]/25"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEE9FF] text-[#7047EB] ring-1 ring-[#DCD3FF] transition-colors group-hover:bg-[#7047EB] group-hover:text-white group-hover:ring-[#7047EB]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-bold text-[#17223D]">{action.label}</h3>
                    <p className="mt-1 text-[13px] leading-[1.45] text-[#64718A]">{action.description}</p>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F0EDFF] text-[#7047EB] transition-all group-hover:translate-x-0.5 group-hover:bg-[#7047EB] group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card size="sm" className="self-start bg-[#F8FAFD]">
          <CardHeader className="pb-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102B50] text-white">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-[17px] text-[#14203B]">Perhatian Operasional</CardTitle>
                <p className="mt-1 text-xs text-[#71809A]">Prioritas yang membutuhkan tindak lanjut</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-0">
            <div className="grid min-w-0 gap-2.5">
              <Link
                href="/tickets"
                className="group flex min-w-0 items-center gap-3 rounded-xl border border-[#F1DFC2] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)] transition-colors hover:border-amber-300 hover:bg-amber-50/45 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-amber-200"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <CalendarClock className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#17223D]">Deadline dalam 24 jam</span>
                  <span className="block truncate text-[11px] text-[#71809A]">
                    {stats.dueSoon > 0
                      ? `${stats.dueSoon} tiket segera jatuh tempo`
                      : "Tidak ada tiket yang segera jatuh tempo"}
                  </span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${stats.dueSoon > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {stats.dueSoon}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#8A96AC] transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href={stats.oldestUnhandled ? `/tickets/${stats.oldestUnhandled.id}` : "/tickets?status=OPEN"}
                className="group flex min-w-0 items-center gap-3 rounded-xl border border-[#DCE6F2] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)] transition-colors hover:border-sky-300 hover:bg-sky-50/45 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-200"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <TimerReset className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#17223D]">Belum ditangani terlama</span>
                  <span className="block truncate text-[11px] text-[#71809A]">
                    {stats.oldestUnhandled
                      ? `${stats.oldestUnhandled.ticketNumber} · ${stats.oldestUnhandled.title}`
                      : "Semua tiket terbuka sudah ditangani"}
                  </span>
                </span>
                <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-extrabold ${stats.oldestUnhandled ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {stats.oldestUnhandled
                    ? stats.oldestUnhandled.ageDays === 0
                      ? "Hari ini"
                      : `${stats.oldestUnhandled.ageDays} hari`
                    : "Aman"}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#8A96AC] transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/tickets?status=ESCALATED"
                className="group flex min-w-0 items-center gap-3 rounded-xl border border-[#F0D8DB] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)] transition-colors hover:border-red-300 hover:bg-red-50/45 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-200"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <Siren className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#17223D]">Tiket eskalasi</span>
                  <span className="block truncate text-[11px] text-[#71809A]">
                    {stats.escalated > 0
                      ? `${stats.escalated} tiket membutuhkan perhatian khusus`
                      : "Tidak ada tiket yang dieskalasi"}
                  </span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${stats.escalated > 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {stats.escalated}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#8A96AC] transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/tickets"
                className="group flex min-w-0 items-center gap-3 rounded-xl border border-[#E3DCF6] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)] transition-colors hover:border-violet-300 hover:bg-violet-50/45 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-200"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <ShieldAlert className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#17223D]">Pelanggaran SLA</span>
                  <span className="block truncate text-[11px] text-[#71809A]">
                    {stats.slaBreached > 0
                      ? `${stats.slaBreached} tiket melewati target layanan`
                      : "Seluruh tiket masih dalam target layanan"}
                  </span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${stats.slaBreached > 0 ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {stats.slaBreached}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#8A96AC] transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {role === "SUPERVISOR" && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-[17px] text-[#14203B]">
              <Users className="h-5 w-5 text-[#7047EB]" />
              Performa Teknisi
            </CardTitle>
            <span className="text-xs text-[#71809A]">Bulan {new Date().toLocaleString("id-ID", { month: "long", year: "numeric" })}</span>
          </CardHeader>
          <CardContent className="pb-5">
            {agentPerformance.length === 0 ? (
              <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-[#D8E0EC] bg-[#F8FAFD] text-sm text-[#7A879D]">Belum ada data teknisi bulan ini</div>
            ) : (
              <AgentPerformanceChart data={agentPerformance} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

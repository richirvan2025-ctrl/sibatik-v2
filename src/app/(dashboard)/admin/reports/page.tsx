"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  BarChart3,
  Ticket,
  Clock,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Users,
  ArrowUpRight,
  Calendar,
  Star,
  Zap,
  Timer,
  Award,
  Target,
  Layers3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TechPerformance {
  name: string;
  resolvedCount: number;
  totalAssigned: number;
  avgResponseHours: number;
  avgResolutionHours: number;
  avgRating: number;
  escalationRate: number;
}

interface ReportData {
  statusCounts: { status: string; count: number }[];
  priorityCounts: { priority: string; count: number }[];
  categoryCounts: { category: string; count: number }[];
  totalTickets: number;
  openTickets: number;
  avgResolutionHours: number;
  technicianPerformance: TechPerformance[];
  dailyTrends: { date: string; created: number; resolved: number }[];
}

const statusConfig: Record<string, { color: string; label: string }> = {
  OPEN: { color: "#2563EB", label: "Open" },
  REOPENED: { color: "#06B6D4", label: "Reopened" },
  IN_PROGRESS: { color: "#F59E0B", label: "In Progress" },
  RESOLVED: { color: "#10B981", label: "Resolved" },
  CLOSED: { color: "#64748B", label: "Closed" },
  ESCALATED: { color: "#EF4444", label: "Escalated" },
};

const priorityConfig: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  LOW: { color: "#64748B", bg: "bg-slate-100", label: "Low" },
  MEDIUM: { color: "#7C3AED", bg: "bg-blue-50", label: "Medium" },
  HIGH: { color: "#0EA5E9", bg: "bg-orange-50", label: "High" },
  URGENT: { color: "#EF4444", bg: "bg-red-50", label: "Urgent" },
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/reports")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as ReportData;
      })
      .then((result) => {
        if (!cancelled && result) setData(result);
      })
      .catch((error) => {
        console.error("Failed to fetch reports:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-100 border-t-[#7C3AED]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-96 items-center justify-center text-[#94A3B8]">
        Gagal memuat laporan
      </div>
    );
  }

  const maxDaily = Math.max(
    ...data.dailyTrends.map((d) => Math.max(d.created, d.resolved)),
    1,
  );
  const completedTickets = data.statusCounts
    .filter((item) => item.status === "RESOLVED" || item.status === "CLOSED")
    .reduce((total, item) => total + item.count, 0);
  const completionRate = Math.round(
    (completedTickets / Math.max(data.totalTickets, 1)) * 100,
  );
  const createdLastSevenDays = data.dailyTrends.reduce(
    (total, day) => total + day.created,
    0,
  );
  const resolvedLastSevenDays = data.dailyTrends.reduce(
    (total, day) => total + day.resolved,
    0,
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7C3AED]">
            <Activity className="h-3.5 w-3.5" />
            Analitik operasional
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] md:text-[28px]">
            Laporan Layanan
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Pantau volume, status, dan performa penanganan tiket dalam satu
            tampilan.
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Data operasional terkini
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Tiket"
          value={data.totalTickets}
          icon={Ticket}
          bgLight="bg-blue-50"
          textColor="text-blue-600"
          helper="Seluruh tiket tercatat"
          accent="bg-blue-500"
        />
        <StatCard
          label="Tiket Terbuka"
          value={data.openTickets}
          icon={Clock}
          bgLight="bg-amber-50"
          textColor="text-amber-600"
          helper="Perlu tindak lanjut"
          accent="bg-amber-500"
        />
        <StatCard
          label="Rata-rata Resolusi"
          value={`${data.avgResolutionHours}j`}
          icon={TrendingUp}
          bgLight="bg-emerald-50"
          textColor="text-emerald-600"
          helper="Waktu penyelesaian"
          accent="bg-emerald-500"
        />
        <StatCard
          label="Tingkat Penyelesaian"
          value={`${completionRate}%`}
          icon={Target}
          bgLight="bg-violet-50"
          textColor="text-violet-600"
          helper={`${completedTickets} tiket selesai`}
          accent="bg-violet-500"
          progress={completionRate}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Status Distribution */}
        <Card className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <CardHeader className="px-5 pb-3 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-[#7C3AED]">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-[15px] font-bold text-[#1E293B]">
                  Distribusi Status
                </CardTitle>
                <p className="mt-0.5 text-xs text-[#94A3B8]">
                  Posisi seluruh tiket saat ini
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            {data.statusCounts.map((item) => {
              const pct = Math.round(
                (item.count / Math.max(data.totalTickets, 1)) * 100,
              );
              const cfg = statusConfig[item.status] || {
                color: "#94A3B8",
                label: item.status,
              };
              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span className="text-sm font-medium text-[#1E293B]">
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#1E293B]">
                        {item.count}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] text-[10px]"
                      >
                        {pct}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: cfg.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <CardHeader className="px-5 pb-3 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-[#0EA5E9]">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-[15px] font-bold text-[#1E293B]">
                  Distribusi Prioritas
                </CardTitle>
                <p className="mt-0.5 text-xs text-[#94A3B8]">
                  Tingkat urgensi tiket masuk
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            {data.priorityCounts.map((item) => {
              const pct = Math.round(
                (item.count / Math.max(data.totalTickets, 1)) * 100,
              );
              const cfg = priorityConfig[item.priority] || {
                color: "#94A3B8",
                bg: "bg-slate-100",
                label: item.priority,
              };
              return (
                <div key={item.priority}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-[#1E293B]">
                      {cfg.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#1E293B]">
                        {item.count}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] text-[10px]"
                      >
                        {pct}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: cfg.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        {/* Daily Trends */}
        <Card className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <CardHeader className="px-5 pb-2 pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#10B981]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-[15px] font-bold text-[#1E293B]">
                    Tiket 7 Hari Terakhir
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-[#94A3B8]">
                    Perbandingan tiket dibuat dan diselesaikan
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">
                  {createdLastSevenDays} dibuat
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                  {resolvedLastSevenDays} selesai
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex h-44 items-end gap-2 rounded-xl bg-gradient-to-b from-[#FAFBFF] to-white px-3 pt-5">
              {data.dailyTrends.map((day) => {
                const date = new Date(day.date);
                const label = date.toLocaleDateString("id-ID", {
                  weekday: "short",
                });
                const createdH = Math.round((day.created / maxDaily) * 100);
                const resolvedH = Math.round((day.resolved / maxDaily) * 100);
                return (
                  <div
                    key={day.date}
                    className="group flex flex-1 flex-col items-center gap-1.5"
                  >
                    <div className="flex h-28 w-full items-end gap-1">
                      <div
                        className="min-h-[4px] flex-1 rounded-t-md bg-gradient-to-t from-[#7047EB] to-[#9B7CF5] shadow-[0_-3px_10px_rgba(112,71,235,0.12)] transition-all duration-500 group-hover:brightness-105"
                        style={{ height: `${Math.max(createdH, 4)}%` }}
                        title={`Dibuat: ${day.created}`}
                      />
                      <div
                        className="min-h-[4px] flex-1 rounded-t-md bg-gradient-to-t from-[#10B981] to-[#5ED5AB] shadow-[0_-3px_10px_rgba(16,185,129,0.12)] transition-all duration-500 group-hover:brightness-105"
                        style={{ height: `${Math.max(resolvedH, 4)}%` }}
                        title={`Resolved: ${day.resolved}`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-[#64748B] uppercase">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#7C3AED]" />
                Dibuat
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#10B981]" />
                Resolved
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Performer */}
        <Card className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <CardHeader className="px-5 pb-2 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-[#F59E0B]">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-[15px] font-bold text-[#1E293B]">
                  Top Performer
                </CardTitle>
                <p className="mt-0.5 text-xs text-[#94A3B8]">
                  Teknisi dengan performa terbaik
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {data.technicianPerformance.length === 0 && (
              <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-[#E2E8F0] bg-[#FAFBFC] px-5 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                  <Award className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-[#334155]">
                  Belum ada performa tercatat
                </p>
                <p className="mt-1 max-w-[240px] text-xs leading-5 text-[#94A3B8]">
                  Peringkat akan muncul setelah tiket mulai diselesaikan oleh
                  teknisi.
                </p>
              </div>
            )}
            {data.technicianPerformance.length > 0 && (
              <div className="space-y-4">
                {data.technicianPerformance.slice(0, 3).map((tech, idx) => (
                  <div
                    key={tech.name}
                    className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 transition-colors hover:border-violet-200 hover:bg-violet-50/40"
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg font-bold text-sm ${
                        idx === 0
                          ? "bg-amber-50 text-amber-600"
                          : idx === 1
                            ? "bg-slate-100 text-slate-500"
                            : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {tech.name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-[#64748B]">
                          {tech.resolvedCount} resolved
                        </span>
                        <span className="text-xs text-[#64748B]">
                          {tech.avgResolutionHours}j avg
                        </span>
                        {tech.avgRating > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-orange-600">
                            <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                            {tech.avgRating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Technician Performance Table */}
      <Card className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <CardHeader className="px-5 pb-3 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-[#8B5CF6]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-[15px] font-bold text-[#1E293B]">
                Detail Performa Teknisi
              </CardTitle>
              <p className="mt-0.5 text-xs text-[#94A3B8]">
                Produktivitas, kecepatan respons, dan kualitas penyelesaian
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {data.technicianPerformance.length === 0 && (
            <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-[#E2E8F0] bg-[#FAFBFC] px-5 text-center">
              <Users className="mb-2 h-6 w-6 text-violet-300" />
              <p className="text-sm font-semibold text-[#334155]">
                Belum ada data performa teknisi
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Data akan terisi otomatis setelah ada aktivitas penanganan
                tiket.
              </p>
            </div>
          )}
          {data.technicianPerformance.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      Teknisi
                    </th>
                    <th className="text-center py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      Ditugaskan
                    </th>
                    <th className="text-center py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      Selesai
                    </th>
                    <th className="text-center py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1">
                        <Timer className="h-3 w-3" />
                        Rata-rata Respons
                      </span>
                    </th>
                    <th className="text-center py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        Rata-rata Resolusi
                      </span>
                    </th>
                    <th className="text-center py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1">
                        <Star className="h-3 w-3" />
                        Penilaian
                      </span>
                    </th>
                    <th className="text-center py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1">
                        <Zap className="h-3 w-3" />
                        Eskalasi
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.technicianPerformance.map((tech) => (
                    <tr
                      key={tech.name}
                      className="border-b border-[#F1F5F9] transition-colors hover:bg-violet-50/40"
                    >
                      <td className="py-3 px-3 font-medium text-[#1E293B]">
                        {tech.name}
                      </td>
                      <td className="py-3 px-3 text-center text-[#64748B]">
                        {tech.totalAssigned}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-[#7C3AED]">
                        {tech.resolvedCount}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[#1E293B]">
                          {tech.avgResponseHours > 0
                            ? `${tech.avgResponseHours}j`
                            : "-"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[#1E293B]">
                          {tech.avgResolutionHours > 0
                            ? `${tech.avgResolutionHours}j`
                            : "-"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {tech.avgRating > 0 ? (
                          <span className="flex items-center justify-center gap-1 text-orange-600 font-semibold">
                            <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                            {tech.avgRating}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          className={`text-xs ${
                            tech.escalationRate <= 5
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : tech.escalationRate <= 15
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {tech.escalationRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <CardHeader className="px-5 pb-3 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-[#0EA5E9]">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-[15px] font-bold text-[#1E293B]">
                Tiket per Kategori
              </CardTitle>
              <p className="mt-0.5 text-xs text-[#94A3B8]">
                Sebaran permintaan berdasarkan divisi tujuan
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {data.categoryCounts.length === 0 ? (
            <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-[#E2E8F0] bg-[#FAFBFC] text-center">
              <BarChart3 className="mb-2 h-6 w-6 text-sky-300" />
              <p className="text-sm font-semibold text-[#334155]">
                Belum ada data kategori
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.categoryCounts.map((cat) => {
                const pct = Math.round(
                  (cat.count / Math.max(data.totalTickets, 1)) * 100,
                );
                return (
                  <div
                    key={cat.category}
                    className="group rounded-xl border border-[#E2E8F0] bg-gradient-to-br from-white to-[#F8FBFF] p-4 transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_8px_20px_rgba(14,165,233,0.08)]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#1E293B]">
                        {cat.category}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                      >
                        {cat.count}
                      </Badge>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EAF1F6]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] transition-all duration-500"
                        style={{
                          width: `${Math.max(pct, 5)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-[#94A3B8]">
                      {pct}% dari total
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  bgLight,
  textColor,
  helper,
  accent,
  progress,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  bgLight: string;
  textColor: string;
  helper: string;
  accent: string;
  progress?: number;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748B]">
              {label}
            </p>
            <div className="mt-3 text-[28px] font-bold leading-none tracking-tight text-[#172033]">
              {value}
            </div>
          </div>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bgLight}`}
          >
            <Icon className={`h-5 w-5 ${textColor}`} />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[#94A3B8]">
          <span>{helper}</span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
        {progress !== undefined && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-violet-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7047EB] to-[#9B7CF5] transition-all duration-500"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

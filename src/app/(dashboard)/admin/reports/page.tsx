"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Flame,
  Layers3,
  Printer,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Star,
  Target,
  Ticket,
  TimerReset,
  TrendingUp,
  UserRoundX,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StaffPerformance {
  name: string;
  resolvedCount: number;
  totalAssigned: number;
  medianResponseHours: number | null;
  medianResolutionHours: number | null;
  avgRating: number | null;
  escalationCount: number;
}

interface ReportData {
  meta: {
    from: string;
    to: string;
    updatedAt: string;
    days: number;
    label: string;
    bucket: "day" | "week";
  };
  summary: {
    totalTickets: number;
    activeTickets: number;
    completedTickets: number;
    completionRate: number | null;
    medianResponseHours: number | null;
    medianResolutionHours: number | null;
    slaComplianceRate: number | null;
    slaCompliant: number;
    previous: {
      totalTickets: number;
      activeTickets: number;
      completedTickets: number;
    };
    delta: {
      totalTickets: number | null;
      activeTickets: number | null;
      completedTickets: number | null;
    };
  };
  attention: {
    overdue: number;
    dueSoon: number;
    unassigned: number;
    slaBreached: number;
    escalated: number;
    highPriority: number;
  };
  backlogAge: { key: string; label: string; count: number }[];
  statusCounts: { status: string; count: number }[];
  priorityCounts: { priority: string; count: number }[];
  categoryCounts: { category: string; count: number }[];
  staffPerformance: StaffPerformance[];
  dailyTrends: {
    date: string;
    endDate: string;
    created: number;
    resolved: number;
  }[];
}

const statusConfig: Record<string, { color: string; label: string }> = {
  OPEN: { color: "#2563EB", label: "Terbuka" },
  REOPENED: { color: "#06B6D4", label: "Dibuka Kembali" },
  IN_PROGRESS: { color: "#F59E0B", label: "Dalam Proses" },
  RESOLVED: { color: "#10B981", label: "Selesai" },
  CLOSED: { color: "#64748B", label: "Ditutup" },
  ESCALATED: { color: "#EF4444", label: "Eskalasi" },
};

const priorityConfig: Record<
  string,
  { color: string; label: string }
> = {
  LOW: { color: "#64748B", label: "Rendah" },
  MEDIUM: { color: "#7C3AED", label: "Sedang" },
  HIGH: { color: "#F59E0B", label: "Tinggi" },
  URGENT: { color: "#EF4444", label: "Mendesak" },
};

const cardClass =
  "gap-0 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white py-0 shadow-[0_8px_30px_rgba(15,23,42,0.04)]";

const periodLabels: Record<string, string> = {
  "7": "7 hari terakhir",
  "30": "30 hari terakhir",
  "90": "90 hari terakhir",
  custom: "Rentang khusus",
};

const inputDate = (date: Date) => date.toISOString().slice(0, 10);

function initialFrom() {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return inputDate(date);
}

function formatHours(value: number | null) {
  return value === null ? "Belum ada data" : `${value} jam`;
}

function formatPercent(value: number | null) {
  return value === null ? "Belum ada data" : `${value}%`;
}

function formatIsoDay(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function csvCell(value: string | number | null) {
  return `"${String(value ?? "Belum ada data").replaceAll('"', '""')}"`;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("30");
  const [customFrom, setCustomFrom] = useState(initialFrom);
  const [customTo, setCustomTo] = useState(() => inputDate(new Date()));

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ period });
      if (period === "custom") {
        params.set("from", customFrom);
        params.set("to", customTo);
      }
      const response = await fetch(`/api/admin/reports?${params}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Gagal memuat laporan");
      setData((await response.json()) as ReportData);
    } catch (fetchError) {
      console.error("Failed to fetch reports:", fetchError);
      setError("Laporan belum dapat dimuat. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  }, [customFrom, customTo, period]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void fetchReports();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fetchReports]);

  const ticketPeriodQuery = useMemo(() => {
    if (!data) return "";
    const params = new URLSearchParams({
      from: data.meta.from.slice(0, 10),
      to: data.meta.to.slice(0, 10),
    });
    return params.toString();
  }, [data]);

  const exportCsv = () => {
    if (!data) return;
    const rows: (string | number | null)[][] = [
      ["Laporan Layanan SIBATIK", data.meta.label],
      ["Diperbarui", new Date(data.meta.updatedAt).toLocaleString("id-ID")],
      [],
      ["Ringkasan", "Nilai"],
      ["Total tiket", data.summary.totalTickets],
      ["Tiket aktif", data.summary.activeTickets],
      ["Tiket selesai", data.summary.completedTickets],
      ["Tingkat penyelesaian", data.summary.completionRate],
      ["Median respons pertama (jam)", data.summary.medianResponseHours],
      ["Median resolusi (jam)", data.summary.medianResolutionHours],
      ["Kepatuhan SLA (%)", data.summary.slaComplianceRate],
      [],
      ["Perhatian operasional", "Jumlah"],
      ["Deadline terlewat", data.attention.overdue],
      ["Deadline <24 jam", data.attention.dueSoon],
      ["Belum ditugaskan", data.attention.unassigned],
      ["Pelanggaran SLA", data.attention.slaBreached],
      ["Eskalasi", data.attention.escalated],
      ["Prioritas tinggi/mendesak", data.attention.highPriority],
      [],
      [
        "Staff",
        "Ditugaskan",
        "Selesai",
        "Median respons (jam)",
        "Median resolusi (jam)",
        "Penilaian",
        "Eskalasi",
      ],
      ...data.staffPerformance.map((staff) => [
        staff.name,
        staff.totalAssigned,
        staff.resolvedCount,
        staff.medianResponseHours,
        staff.medianResolutionHours,
        staff.avgRating,
        staff.escalationCount,
      ]),
    ];
    const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", content], {
      type: "text/csv;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-sibatik-${data.meta.from.slice(0, 10)}-${data.meta.to.slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className="h-9 w-9 animate-spin rounded-full border-4 border-violet-100 border-t-[#7047EB]"
          role="status"
          aria-label="Memuat laporan"
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm font-semibold text-[#334155]">{error}</p>
        <Button variant="outline" onClick={() => void fetchReports()}>
          Coba kembali
        </Button>
      </div>
    );
  }

  const dateFrom = formatIsoDay(data.meta.from);
  const dateTo = formatIsoDay(data.meta.to);
  const maxDaily = Math.max(
    ...data.dailyTrends.map((item) => Math.max(item.created, item.resolved)),
    1,
  );
  const createdTotal = data.dailyTrends.reduce(
    (total, item) => total + item.created,
    0,
  );
  const resolvedTotal = data.dailyTrends.reduce(
    (total, item) => total + item.resolved,
    0,
  );
  const activeBacklog = data.backlogAge.reduce(
    (total, item) => total + item.count,
    0,
  );
  const rankedStaff = data.staffPerformance.filter(
    (staff) => staff.resolvedCount >= 3,
  );

  return (
    <div className="report-print-root mx-auto max-w-[1600px] space-y-5 print:max-w-none print:space-y-4">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7047EB]">
            <Activity className="h-3.5 w-3.5" />
            Analitik operasional lintas divisi
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] md:text-[28px]">
            Laporan Layanan
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#64748B]">
            Prioritaskan tindak lanjut, pantau SLA, dan evaluasi performa Staff
            dalam satu tampilan.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[#475569]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40 print:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Diperbarui {new Date(data.meta.updatedAt).toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </header>

      <Card className={`${cardClass} print:hidden`}>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-48">
              <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
                Periode laporan
              </label>
              <Select
                value={period}
                onValueChange={(value) => value && setPeriod(value)}
              >
                <SelectTrigger className="h-10 bg-[#F8FAFC]" aria-label="Periode laporan">
                  <SelectValue>{periodLabels[period]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 hari terakhir</SelectItem>
                  <SelectItem value="30">30 hari terakhir</SelectItem>
                  <SelectItem value="90">90 hari terakhir</SelectItem>
                  <SelectItem value="custom">Rentang khusus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
                    Dari
                  </label>
                  <Input
                    type="date"
                    aria-label="Tanggal mulai laporan"
                    value={customFrom}
                    max={customTo}
                    onChange={(event) => setCustomFrom(event.target.value)}
                    className="h-10 bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
                    Sampai
                  </label>
                  <Input
                    type="date"
                    aria-label="Tanggal akhir laporan"
                    value={customTo}
                    min={customFrom}
                    max={inputDate(new Date())}
                    onChange={(event) => setCustomTo(event.target.value)}
                    className="h-10 bg-[#F8FAFC]"
                  />
                </div>
              </div>
            )}
            <div className="flex h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-medium text-[#475569]">
              <CalendarDays className="h-4 w-4 text-[#7047EB]" />
              {dateFrom} – {dateTo}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchReports()}
              disabled={loading}
              className="h-10"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Perbarui</span>
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} className="h-10">
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-10"
            >
              <Printer className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 print:hidden">
          {error} Data terakhir yang berhasil dimuat tetap ditampilkan.
        </div>
      )}

      <section aria-labelledby="ringkasan-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="ringkasan-title" className="text-base font-bold text-[#1E293B]">
              Ringkasan Kinerja
            </h2>
            <p className="mt-0.5 text-xs text-[#64748B]">
              Setiap kartu dapat dibuka untuk melihat tiket terkait.
            </p>
          </div>
          <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
            {data.meta.label}
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatCard
            label="Total tiket"
            value={String(data.summary.totalTickets)}
            helper="Tiket dibuat dalam periode"
            icon={Ticket}
            iconClass="bg-blue-50 text-blue-600"
            accent="bg-blue-500"
            delta={data.summary.delta.totalTickets}
            href={`/tickets?${ticketPeriodQuery}`}
          />
          <StatCard
            label="Tiket aktif"
            value={String(data.summary.activeTickets)}
            helper="Masih perlu tindak lanjut"
            icon={Clock3}
            iconClass="bg-amber-50 text-amber-600"
            accent="bg-amber-500"
            delta={data.summary.delta.activeTickets}
            href={`/tickets?attention=active&${ticketPeriodQuery}`}
          />
          <StatCard
            label="Penyelesaian"
            value={formatPercent(data.summary.completionRate)}
            helper={`${data.summary.completedTickets} tiket selesai`}
            icon={Target}
            iconClass="bg-violet-50 text-violet-600"
            accent="bg-violet-500"
            progress={data.summary.completionRate}
            delta={data.summary.delta.completedTickets}
            href={`/tickets?status=COMPLETED&${ticketPeriodQuery}`}
          />
          <StatCard
            label="Median respons"
            value={formatHours(data.summary.medianResponseHours)}
            helper="Respons pertama Staff"
            icon={TimerReset}
            iconClass="bg-sky-50 text-sky-600"
            accent="bg-sky-500"
            href={`/tickets?${ticketPeriodQuery}`}
          />
          <StatCard
            label="Median resolusi"
            value={formatHours(data.summary.medianResolutionHours)}
            helper="Waktu hingga tiket selesai"
            icon={TrendingUp}
            iconClass="bg-emerald-50 text-emerald-600"
            accent="bg-emerald-500"
            href={`/tickets?status=COMPLETED&${ticketPeriodQuery}`}
          />
          <StatCard
            label="Kepatuhan SLA"
            value={formatPercent(data.summary.slaComplianceRate)}
            helper={`${data.summary.slaCompliant} tiket memenuhi SLA`}
            icon={ShieldCheck}
            iconClass="bg-teal-50 text-teal-600"
            accent="bg-teal-500"
            progress={data.summary.slaComplianceRate}
            href={`/tickets?status=COMPLETED&${ticketPeriodQuery}`}
          />
        </div>
      </section>

      <section aria-labelledby="attention-title">
        <div className="mb-3">
          <h2 id="attention-title" className="text-base font-bold text-[#1E293B]">
            Perhatian Operasional
          </h2>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Kondisi tiket aktif saat ini, di luar filter periode laporan.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <AttentionCard
            label="Deadline terlewat"
            value={data.attention.overdue}
            helper="Perlu penanganan segera"
            icon={AlertTriangle}
            tone="red"
            href="/tickets?attention=overdue"
          />
          <AttentionCard
            label="Deadline <24 jam"
            value={data.attention.dueSoon}
            helper="Segera jatuh tempo"
            icon={Clock3}
            tone="amber"
            href="/tickets?attention=due24"
          />
          <AttentionCard
            label="Belum ditugaskan"
            value={data.attention.unassigned}
            helper="Belum memiliki Staff"
            icon={UserRoundX}
            tone="sky"
            href="/tickets?attention=unassigned"
          />
          <AttentionCard
            label="Pelanggaran SLA"
            value={data.attention.slaBreached}
            helper="SLA tiket aktif terlewati"
            icon={ShieldAlert}
            tone="violet"
            href="/tickets?attention=sla"
          />
          <AttentionCard
            label="Tiket eskalasi"
            value={data.attention.escalated}
            helper="Membutuhkan koordinasi"
            icon={Siren}
            tone="rose"
            href="/tickets?attention=escalated"
          />
          <AttentionCard
            label="Prioritas tinggi"
            value={data.attention.highPriority}
            helper="Tinggi dan mendesak"
            icon={Flame}
            tone="orange"
            href="/tickets?attention=high"
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <DistributionCard
          title="Distribusi Status"
          subtitle="Tiket yang dibuat dalam periode"
          icon={CheckCircle2}
          iconClass="bg-violet-50 text-violet-600"
          items={data.statusCounts.map((item) => ({
            key: item.status,
            label: statusConfig[item.status]?.label || item.status,
            count: item.count,
            color: statusConfig[item.status]?.color || "#94A3B8",
            href: `/tickets?status=${item.status}&${ticketPeriodQuery}`,
          }))}
          total={data.summary.totalTickets}
        />
        <DistributionCard
          title="Distribusi Prioritas"
          subtitle="Tingkat urgensi tiket masuk"
          icon={AlertTriangle}
          iconClass="bg-sky-50 text-sky-600"
          items={data.priorityCounts.map((item) => ({
            key: item.priority,
            label: priorityConfig[item.priority]?.label || item.priority,
            count: item.count,
            color: priorityConfig[item.priority]?.color || "#94A3B8",
            href: `/tickets?priority=${item.priority}&${ticketPeriodQuery}`,
          }))}
          total={data.summary.totalTickets}
        />
        <DistributionCard
          title="Usia Backlog"
          subtitle="Umur tiket aktif saat ini"
          icon={CalendarDays}
          iconClass="bg-amber-50 text-amber-600"
          items={data.backlogAge.map((item, index) => ({
            key: item.key,
            label: item.label,
            count: item.count,
            color: ["#10B981", "#38BDF8", "#F59E0B", "#EF4444"][index],
            href: "/tickets?attention=active",
          }))}
          total={activeBacklog}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className={cardClass}>
          <CardHeader className="px-5 pb-2 pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeading
                title="Tren Tiket"
                subtitle={`Perbandingan tiket dibuat dan selesai per ${data.meta.bucket === "week" ? "minggu" : "hari"}`}
                icon={BarChart3}
                iconClass="bg-emerald-50 text-emerald-600"
              />
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">
                  {createdTotal} dibuat
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                  {resolvedTotal} selesai
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-5 sm:px-5">
            <div
              className="flex h-52 items-end gap-1.5 overflow-x-auto rounded-xl bg-gradient-to-b from-[#FAFBFF] to-white px-2 pt-5 sm:gap-2 sm:px-3"
              role="img"
              aria-label={`Grafik ${data.meta.label}: ${createdTotal} tiket dibuat dan ${resolvedTotal} tiket selesai`}
            >
              {data.dailyTrends.map((item) => {
                const from = new Date(item.date);
                const to = new Date(item.endDate);
                const label =
                  data.meta.bucket === "week"
                    ? `${from.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`
                    : from.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
                const ariaDate =
                  data.meta.bucket === "week"
                    ? `${label} sampai ${to.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`
                    : label;
                return (
                  <div
                    key={item.date}
                    className="group flex min-w-8 flex-1 flex-col items-center gap-1.5"
                    role="group"
                    aria-label={`${ariaDate}: ${item.created} dibuat, ${item.resolved} selesai`}
                  >
                    <div className="flex h-32 w-full items-end gap-1" aria-hidden="true">
                      <div
                        className="min-h-1 flex-1 rounded-t bg-gradient-to-t from-[#7047EB] to-[#9B7CF5] transition-all duration-500 group-hover:brightness-105"
                        style={{ height: `${Math.max((item.created / maxDaily) * 100, 3)}%` }}
                        title={`${item.created} dibuat`}
                      />
                      <div
                        className="min-h-1 flex-1 rounded-t bg-gradient-to-t from-[#10B981] to-[#5ED5AB] transition-all duration-500 group-hover:brightness-105"
                        style={{ height: `${Math.max((item.resolved / maxDaily) * 100, 3)}%` }}
                        title={`${item.resolved} selesai`}
                      />
                    </div>
                    <span className="whitespace-nowrap text-[9px] font-medium text-[#64748B] sm:text-[10px]">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-[#475569]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#7047EB]" /> Dibuat
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#10B981]" /> Selesai
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="px-5 pb-2 pt-5">
            <SectionHeading
              title="Top Staff"
              subtitle="Minimal 3 tiket selesai dalam periode"
              icon={Award}
              iconClass="bg-amber-50 text-amber-600"
            />
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {rankedStaff.length === 0 ? (
              <EmptyState
                icon={Award}
                title="Sampel belum mencukupi"
                description="Peringkat akan muncul setelah seorang Staff menyelesaikan minimal 3 tiket pada periode ini."
              />
            ) : (
              <div className="space-y-3">
                {rankedStaff.slice(0, 3).map((staff, index) => (
                  <div
                    key={staff.name}
                    className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                      index === 0
                        ? "bg-amber-100 text-amber-700"
                        : index === 1
                          ? "bg-slate-200 text-slate-600"
                          : "bg-orange-100 text-orange-700"
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#1E293B]">{staff.name}</p>
                      <p className="mt-0.5 text-xs text-[#64748B]">
                        {staff.resolvedCount} selesai · {formatHours(staff.medianResolutionHours)}
                      </p>
                    </div>
                    {staff.avgRating !== null && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {staff.avgRating}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className={cardClass}>
        <CardHeader className="px-5 pb-3 pt-5">
          <SectionHeading
            title="Detail Performa Staff"
            subtitle="Produktivitas, kecepatan respons, kualitas, dan eskalasi"
            icon={UsersRound}
            iconClass="bg-violet-50 text-violet-600"
          />
        </CardHeader>
        <CardContent className="px-4 pb-5 sm:px-5">
          {data.staffPerformance.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="Belum ada data performa Staff"
              description="Data akan terisi otomatis setelah terdapat aktivitas penanganan tiket dalam periode ini."
            />
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {data.staffPerformance.map((staff) => (
                  <StaffCard key={staff.name} staff={staff} />
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      {[
                        "Staff",
                        "Ditugaskan",
                        "Selesai",
                        "Median Respons",
                        "Median Resolusi",
                        "Penilaian",
                        "Eskalasi",
                      ].map((heading, index) => (
                        <th
                          key={heading}
                          className={`${index === 0 ? "text-left" : "text-center"} px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-[#64748B]`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.staffPerformance.map((staff) => (
                      <tr key={staff.name} className="border-b border-[#F1F5F9] hover:bg-violet-50/40">
                        <td className="px-3 py-3 font-semibold text-[#1E293B]">{staff.name}</td>
                        <td className="px-3 py-3 text-center text-[#475569]">{staff.totalAssigned}</td>
                        <td className="px-3 py-3 text-center font-semibold text-[#7047EB]">{staff.resolvedCount}</td>
                        <td className="px-3 py-3 text-center text-[#334155]">{formatHours(staff.medianResponseHours)}</td>
                        <td className="px-3 py-3 text-center text-[#334155]">{formatHours(staff.medianResolutionHours)}</td>
                        <td className="px-3 py-3 text-center">
                          {staff.avgRating === null ? (
                            <span className="text-[#64748B]">Belum ada data</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {staff.avgRating}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Badge variant="outline" className={staff.escalationCount === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>
                            {staff.escalationCount}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader className="px-5 pb-3 pt-5">
          <SectionHeading
            title="Tiket per Kategori"
            subtitle="Sebaran permintaan berdasarkan divisi tujuan"
            icon={Layers3}
            iconClass="bg-sky-50 text-sky-600"
          />
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {data.categoryCounts.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Belum ada data kategori"
              description="Kategori akan tampil setelah ada tiket pada periode ini."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.categoryCounts.map((category) => {
                const percentage = Math.round(
                  (category.count / Math.max(data.summary.totalTickets, 1)) * 100,
                );
                return (
                  <div key={category.category} className="rounded-xl border border-[#E2E8F0] bg-gradient-to-br from-white to-[#F8FBFF] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-[#1E293B]">{category.category}</span>
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">{category.count}</Badge>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#EAF1F6]" aria-label={`${percentage}% dari total tiket`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]" style={{ width: `${percentage}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-[#64748B]">{percentage}% dari total periode</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          .sibatik-shell-enter {
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            background: white !important;
          }

          .sibatik-shell-enter > aside,
          .sibatik-shell-enter > div > header {
            display: none !important;
          }

          .sibatik-shell-enter > div,
          .sibatik-shell-enter main {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
          }

          .sibatik-shell-enter main > div {
            max-width: none !important;
            padding: 0 !important;
          }

          .report-print-root [data-slot="card"] {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
  icon: Icon,
  iconClass,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <CardTitle className="text-[15px] font-bold text-[#1E293B]">{title}</CardTitle>
        <p className="mt-0.5 text-xs text-[#64748B]">{subtitle}</p>
      </div>
    </div>
  );
}

function DeltaBadge({ value }: { value: number | null }) {
  const label = value === null ? "Baru" : value === 0 ? "Tetap" : `${value > 0 ? "+" : ""}${value}%`;
  return (
    <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-bold text-[#475569]">
      {label} vs sebelumnya
    </span>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  iconClass,
  accent,
  href,
  delta,
  progress,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  iconClass: string;
  accent: string;
  href: string;
  delta?: number | null;
  progress?: number | null;
}) {
  const compactValue = value === "Belum ada data";
  return (
    <Link href={href} className="group block rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7047EB] focus:ring-offset-2">
      <Card className={`${cardClass} relative h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-violet-200 group-hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]`}>
        <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748B]">{label}</p>
              <p className={`${compactValue ? "text-sm leading-6" : "text-2xl"} mt-2 font-bold tracking-tight text-[#172033]`}>{value}</p>
            </div>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex min-h-8 items-end justify-between gap-2">
            <p className="text-[11px] leading-4 text-[#64748B]">{helper}</p>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#64748B] transition-transform group-hover:translate-x-0.5" />
          </div>
          {delta !== undefined && <div className="mt-2"><DeltaBadge value={delta} /></div>}
          {progress !== undefined && progress !== null && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-violet-100" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gradient-to-r from-[#7047EB] to-[#9B7CF5]" style={{ width: `${progress}%` }} />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

const attentionTones = {
  red: "border-red-200 bg-red-50 text-red-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
};

function AttentionCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: number;
  helper: string;
  icon: LucideIcon;
  tone: keyof typeof attentionTones;
  href: string;
}) {
  return (
    <Link href={href} className="group rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7047EB] focus:ring-offset-2">
      <Card className="h-full gap-0 rounded-2xl border border-[#E2E8F0] bg-white py-0 shadow-[0_6px_20px_rgba(15,23,42,0.035)] transition-all group-hover:-translate-y-0.5 group-hover:border-[#CFC4F6]">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${attentionTones[tone]}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#172033]">{value}</span>
          </div>
          <p className="mt-3 text-sm font-bold text-[#1E293B]">{label}</p>
          <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[#64748B]">
            <span>{helper}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function DistributionCard({
  title,
  subtitle,
  icon,
  iconClass,
  items,
  total,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconClass: string;
  items: { key: string; label: string; count: number; color: string; href: string }[];
  total: number;
}) {
  return (
    <Card className={cardClass}>
      <CardHeader className="px-5 pb-3 pt-5">
        <SectionHeading title={title} subtitle={subtitle} icon={icon} iconClass={iconClass} />
      </CardHeader>
      <CardContent className="space-y-3.5 px-5 pb-5">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center text-sm text-[#64748B]">Belum ada data</p>
        ) : (
          items.map((item) => {
            const percentage = Math.round((item.count / Math.max(total, 1)) * 100);
            return (
              <Link key={item.key} href={item.href} className="group block rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7047EB] focus:ring-offset-2">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate text-sm font-medium text-[#334155] group-hover:text-[#7047EB]">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-[#1E293B]">{item.count} <span className="text-[10px] font-medium text-[#64748B]">({percentage}%)</span></span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#F1F5F9]" role="progressbar" aria-label={`${item.label}: ${percentage}%`} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-5 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-violet-500">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-[#334155]">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-[#64748B]">{description}</p>
    </div>
  );
}

function StaffCard({ staff }: { staff: StaffPerformance }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[#1E293B]">{staff.name}</p>
          <p className="mt-0.5 text-xs text-[#64748B]">{staff.totalAssigned} ditugaskan · {staff.resolvedCount} selesai</p>
        </div>
        <Badge variant="outline" className={staff.escalationCount === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>
          {staff.escalationCount} eskalasi
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-[#64748B]">Median respons</p>
          <p className="mt-1 font-semibold text-[#334155]">{formatHours(staff.medianResponseHours)}</p>
        </div>
        <div>
          <p className="text-[#64748B]">Median resolusi</p>
          <p className="mt-1 font-semibold text-[#334155]">{formatHours(staff.medianResolutionHours)}</p>
        </div>
      </div>
      <div className="mt-3 border-t border-[#E2E8F0] pt-3 text-xs text-[#64748B]">
        Penilaian: <span className="font-semibold text-[#334155]">{staff.avgRating === null ? "Belum ada data" : staff.avgRating}</span>
      </div>
    </div>
  );
}

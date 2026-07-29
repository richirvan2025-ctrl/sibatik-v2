"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Building2,
  ShieldAlert,
  Calendar,
  Crown,
} from "lucide-react";

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  URGENT: { label: "Urgent", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  HIGH: { label: "High", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  MEDIUM: { label: "Medium", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  LOW: { label: "Low", color: "text-slate-600", bg: "bg-slate-100 border-slate-200" },
};

const statusConfig: Record<string, { label: string }> = {
  OPEN: { label: "Open" },
  IN_PROGRESS: { label: "In Progress" },
  RESOLVED: { label: "Resolved" },
  CLOSED: { label: "Closed" },
  ESCALATED: { label: "Escalated" },
};

interface DeptStat {
  department: string;
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  slaBreached: number;
}

interface UrgentTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  department: string;
  createdAt: string;
}

interface DailyTrend {
  date: string;
  created: number;
  resolved: number;
}

interface Summary {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  slaBreached: number;
  slaComplianceRate: number;
}

interface ExecStats {
  summary: Summary;
  deptStats: DeptStat[];
  urgentTickets: UrgentTicket[];
  dailyTrends: DailyTrend[];
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function ExecutiveDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<ExecStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/executive/stats")
      .then((r) => r.ok ? r.json() : null)
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-100 border-t-[#7C3AED]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-96 items-center justify-center text-[#94A3B8]">
        Gagal memuat data
      </div>
    );
  }

  const { summary, deptStats, urgentTickets, dailyTrends } = stats;
  const maxDept = Math.max(...deptStats.map((d) => d.total), 1);
  const maxDaily = Math.max(...dailyTrends.map((d) => Math.max(d.created, d.resolved)), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">
            Dashboard Eksekutif
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Selamat datang,{" "}
            <span className="font-semibold text-[#7C3AED]">{session?.user?.name}</span>
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200 font-semibold px-3 py-1 text-xs"
        >
          <Crown className="mr-1.5 h-3.5 w-3.5" />
          EXECUTIVE
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Tiket", value: summary.totalTickets, icon: Ticket, bg: "bg-blue-50", text: "text-blue-600" },
          { label: "Open / In Progress", value: summary.openTickets + summary.inProgressTickets, icon: Clock, bg: "bg-amber-50", text: "text-amber-600" },
          { label: "Selesai", value: summary.resolvedTickets + summary.closedTickets, icon: CheckCircle, bg: "bg-emerald-50", text: "text-emerald-600" },
          { label: "SLA Compliance", value: `${summary.slaComplianceRate}%`, icon: TrendingUp, bg: summary.slaComplianceRate >= 90 ? "bg-emerald-50" : summary.slaComplianceRate >= 70 ? "bg-amber-50" : "bg-red-50", text: summary.slaComplianceRate >= 90 ? "text-emerald-600" : summary.slaComplianceRate >= 70 ? "text-amber-600" : "text-red-600" },
        ].map((card) => (
          <Card key={card.label} className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
              <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                {card.label}
              </CardTitle>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.text}`} />
              </div>
            </CardHeader>
            <CardContent className="pb-5 px-5">
              <div className="text-2xl font-bold tracking-tight text-[#1E293B]">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SLA Breached alert */}
      {summary.slaBreached > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            <span className="font-bold">{summary.slaBreached} tiket</span> melewati batas SLA — segera tindak lanjuti bersama tim terkait.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tiket per Divisi */}
        <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="h-1 bg-[#7C3AED]" />
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
              <Building2 className="h-4 w-4 text-[#7C3AED]" />
              Tiket per Divisi
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            {deptStats.length === 0 && (
              <p className="text-sm text-[#94A3B8] text-center py-4">Belum ada tiket</p>
            )}
            {deptStats.map((d) => (
              <div key={d.department}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-[#1E293B] truncate max-w-[60%]">{d.department}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-[#1E293B]">{d.total}</span>
                    {d.slaBreached > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                        {d.slaBreached} SLA ⚠
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#7C3AED] transition-all duration-500"
                    style={{ width: `${Math.round((d.total / maxDept) * 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-[#94A3B8]">
                  <span className="text-orange-600 font-medium">{d.open} open</span>
                  <span className="text-amber-600 font-medium">{d.inProgress} in progress</span>
                  <span className="text-emerald-600 font-medium">{d.resolved} selesai</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trend 7 Hari */}
        <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="h-1 bg-[#10B981]" />
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
              <Calendar className="h-4 w-4 text-[#10B981]" />
              Tiket 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex items-end gap-3 h-40">
              {dailyTrends.map((day) => {
                const label = new Date(day.date).toLocaleDateString("id-ID", { weekday: "short" });
                const createdH = Math.round((day.created / maxDaily) * 100);
                const resolvedH = Math.round((day.resolved / maxDaily) * 100);
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex gap-0.5 items-end w-full h-28">
                      <div className="flex-1 rounded-t-md bg-[#7C3AED] min-h-[4px]" style={{ height: `${Math.max(createdH, 4)}%` }} title={`Dibuat: ${day.created}`} />
                      <div className="flex-1 rounded-t-md bg-[#10B981] min-h-[4px]" style={{ height: `${Math.max(resolvedH, 4)}%` }} title={`Resolved: ${day.resolved}`} />
                    </div>
                    <span className="text-[10px] font-medium text-[#64748B] uppercase">{label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#7C3AED]" />Dibuat</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#10B981]" />Resolved</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tiket Mendesak */}
      <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="h-1 bg-[#EF4444]" />
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
            <AlertCircle className="h-4 w-4 text-[#EF4444]" />
            Tiket Mendesak yang Belum Selesai
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {urgentTickets.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-4">Tidak ada tiket mendesak</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    {["No. Tiket", "Judul", "Divisi", "Prioritas", "Status", "Umur"].map((h) => (
                      <th key={h} className="text-left py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {urgentTickets.map((t) => {
                    const p = priorityConfig[t.priority] || priorityConfig.MEDIUM;
                    const days = daysSince(t.createdAt);
                    return (
                      <tr key={t.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-3 font-mono text-xs text-[#7C3AED] font-semibold">{t.ticketNumber}</td>
                        <td className="py-3 px-3 text-[#1E293B] max-w-[200px] truncate">{t.title}</td>
                        <td className="py-3 px-3 text-[#64748B] text-xs">{t.department}</td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className={`text-xs ${p.bg} ${p.color}`}>{p.label}</Badge>
                        </td>
                        <td className="py-3 px-3 text-xs text-[#64748B]">{statusConfig[t.status]?.label || t.status}</td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-semibold ${days >= 3 ? "text-red-600" : days >= 1 ? "text-amber-600" : "text-[#64748B]"}`}>
                            {days === 0 ? "Hari ini" : `${days} hari`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

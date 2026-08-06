"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
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
} from "lucide-react";

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

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  LOW: { color: "#64748B", bg: "bg-slate-100", label: "Low" },
  MEDIUM: { color: "#7C3AED", bg: "bg-blue-50", label: "Medium" },
  HIGH: { color: "#0EA5E9", bg: "bg-orange-50", label: "High" },
  URGENT: { color: "#EF4444", bg: "bg-red-50", label: "Urgent" },
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/reports");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

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
    1
  );
  const maxCategory = Math.max(...data.categoryCounts.map((c) => c.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">
          Laporan
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Analitik dan statistik tiket support
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Tiket"
          value={data.totalTickets}
          icon={Ticket}
          color="#7C3AED"
          bgLight="bg-blue-50"
          textColor="text-blue-600"
        />
        <StatCard
          label="Tiket Terbuka"
          value={data.openTickets}
          icon={Clock}
          color="#F59E0B"
          bgLight="bg-amber-50"
          textColor="text-amber-600"
        />
        <StatCard
          label="Avg Resolution"
          value={`${data.avgResolutionHours}j`}
          icon={TrendingUp}
          color="#10B981"
          bgLight="bg-emerald-50"
          textColor="text-emerald-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="h-1 bg-[#7C3AED]" />
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
              <CheckCircle className="h-4 w-4 text-[#7C3AED]" />
              Distribusi Status
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            {data.statusCounts.map((item) => {
              const pct = Math.round(
                (item.count / Math.max(data.totalTickets, 1)) * 100
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
                  <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
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
        <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="h-1 bg-[#0EA5E9]" />
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
              <AlertCircle className="h-4 w-4 text-[#0EA5E9]" />
              Distribusi Prioritas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            {data.priorityCounts.map((item) => {
              const pct = Math.round(
                (item.count / Math.max(data.totalTickets, 1)) * 100
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
                  <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Trends */}
        <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="h-1 bg-[#10B981]" />
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
              <Calendar className="h-4 w-4 text-[#10B981]" />
              Tiket 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex items-end gap-3 h-40">
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
                    className="flex flex-1 flex-col items-center gap-1.5"
                  >
                    <div className="flex gap-0.5 items-end w-full h-28">
                      <div
                        className="flex-1 rounded-t-md bg-[#7C3AED] transition-all duration-500 min-h-[4px]"
                        style={{ height: `${Math.max(createdH, 4)}%` }}
                        title={`Dibuat: ${day.created}`}
                      />
                      <div
                        className="flex-1 rounded-t-md bg-[#10B981] transition-all duration-500 min-h-[4px]"
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
        <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="h-1 bg-[#F59E0B]" />
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
              <Award className="h-4 w-4 text-[#F59E0B]" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {data.technicianPerformance.length === 0 && (
              <p className="text-sm text-[#94A3B8] text-center py-4">
                Belum ada data technician
              </p>
            )}
            {data.technicianPerformance.length > 0 && (
              <div className="space-y-4">
                {data.technicianPerformance.slice(0, 3).map((tech, idx) => (
                  <div
                    key={tech.name}
                    className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-3 border border-[#E2E8F0]"
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
      <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="h-1 bg-[#8B5CF6]" />
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
            <Users className="h-4 w-4 text-[#8B5CF6]" />
            Detail Performa Technician
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {data.technicianPerformance.length === 0 && (
            <p className="text-sm text-[#94A3B8] text-center py-4">
              Belum ada data technician
            </p>
          )}
          {data.technicianPerformance.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      Technician
                    </th>
                    <th className="text-center py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      Assigned
                    </th>
                    <th className="text-center py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      Resolved
                    </th>
                    <th className="text-center py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1">
                        <Timer className="h-3 w-3" />
                        Avg Response
                      </span>
                    </th>
                    <th className="text-center py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        Avg Resolution
                      </span>
                    </th>
                    <th className="text-center py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1">
                        <Star className="h-3 w-3" />
                        Rating
                      </span>
                    </th>
                    <th className="text-center py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1">
                        <Zap className="h-3 w-3" />
                        Escalation
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.technicianPerformance.map((tech) => (
                    <tr
                      key={tech.name}
                      className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
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
      <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="h-1 bg-[#0EA5E9]" />
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
            <BarChart3 className="h-4 w-4 text-[#0EA5E9]" />
            Tiket per Kategori
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.categoryCounts.map((cat) => {
              const pct = Math.round(
                (cat.count / Math.max(data.totalTickets, 1)) * 100
              );
              return (
                <div
                  key={cat.category}
                  className="rounded-xl border border-[#E2E8F0] p-4"
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
                  <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0EA5E9] transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, 5)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-[#94A3B8]">{pct}% dari total</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgLight,
  textColor,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  bgLight: string;
  textColor: string;
}) {
  return (
    <Card className="group border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
        <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
          {label}
        </CardTitle>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgLight}`}
        >
          <Icon className={`h-5 w-5 ${textColor}`} />
        </div>
      </CardHeader>
      <CardContent className="pb-5 px-5">
        <div className="text-2xl font-bold tracking-tight text-[#1E293B]">
          {value}
        </div>
        <div className="mt-2 flex items-center text-xs text-[#94A3B8]">
          <ArrowUpRight className="mr-1 h-3 w-3" />
          Statistik
        </div>
      </CardContent>
    </Card>
  );
}

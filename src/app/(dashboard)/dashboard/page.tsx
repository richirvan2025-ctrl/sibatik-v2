"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentPerformanceChart, type AgentPerformance } from "@/components/dashboard/agent-performance-chart";
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  BarChart3,
  ArrowUpRight,
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
    icon: Ticket,
    color: "#7C3AED",
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
    href: "/tickets",
  },
  {
    key: "open" as const,
    label: "Open",
    icon: AlertCircle,
    color: "#0EA5E9",
    bgLight: "bg-orange-50",
    textColor: "text-orange-600",
    href: "/tickets?status=OPEN",
  },
  {
    key: "inProgress" as const,
    label: "In Progress",
    icon: Clock,
    color: "#F59E0B",
    bgLight: "bg-amber-50",
    textColor: "text-amber-600",
    href: "/tickets?status=IN_PROGRESS",
  },
  {
    key: "resolved" as const,
    label: "Resolved",
    icon: CheckCircle,
    color: "#10B981",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-600",
    href: "/tickets?status=RESOLVED",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (session?.user?.role === "SUPERVISOR") {
      fetch("/api/dashboard/agent-performance")
        .then((r) => r.json())
        .then((data) => setAgentPerformance(data))
        .catch(() => {});
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
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

  if (!stats) {
    return (
      <div className="flex h-96 items-center justify-center text-[#94A3B8]">
        Gagal memuat data
      </div>
    );
  }

  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Selamat datang kembali,{" "}
            <span className="font-semibold text-[#7C3AED]">
              {session?.user?.name}
            </span>
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-blue-50 text-[#7C3AED] border-blue-200 font-semibold px-3 py-1 text-xs"
        >
          <Zap className="mr-1.5 h-3.5 w-3.5" />
          {role}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key];
          const isClickable = value > 0;
          return (
            <Link
              key={card.key}
              href={isClickable ? card.href : "#"}
              className={isClickable ? "block" : "block pointer-events-none"}
            >
              <Card
                className={`group border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200 ${
                  isClickable
                    ? "hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
                  <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    {card.label}
                  </CardTitle>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bgLight}`}
                  >
                    <Icon className={`h-5 w-5 ${card.textColor}`} />
                  </div>
                </CardHeader>
                <CardContent className="pb-5 px-5">
                  <div className="text-2xl font-bold tracking-tight text-[#1E293B]">
                    {value}
                  </div>
                  <div className="mt-2 flex items-center text-xs text-[#94A3B8]">
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    Tiket aktif
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Admin Stats */}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="h-1 bg-[#EF4444]" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
              <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                SLA Breached
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="pb-5 px-5">
              <div className="text-2xl font-bold tracking-tight text-red-600">
                {stats.slaBreached}
              </div>
              <p className="mt-2 text-xs text-[#94A3B8]">
                Tiket yang melewati batas waktu SLA
              </p>
            </CardContent>
          </Card>

          <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="h-1 bg-[#7C3AED]" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
              <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Avg Resolution Time
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pb-5 px-5">
              <div className="text-2xl font-bold tracking-tight text-[#1E293B]">
                {stats.avgResolutionHours}
                <span className="text-sm font-medium text-[#94A3B8] ml-1">
                  jam
                </span>
              </div>
              <p className="mt-2 text-xs text-[#94A3B8]">
                Rata-rata waktu penyelesaian tiket
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Performance - Supervisor only */}
      {role === "SUPERVISOR" && (
        <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="h-1 bg-[#7C3AED]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              Agent Performance
            </CardTitle>
            <span className="text-xs text-[#94A3B8]">
              Bulan {new Date().toLocaleString("id-ID", { month: "long", year: "numeric" })}
            </span>
          </CardHeader>
          <CardContent className="pb-5 px-5">
            {agentPerformance.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-[#94A3B8]">
                Belum ada data agent bulan ini
              </div>
            ) : (
              <AgentPerformanceChart data={agentPerformance} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Info */}
      <Card className="border-0 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl shadow-lg shadow-[#7C3AED]/25">
        <CardContent className="flex items-center gap-4 py-5 px-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Performance Overview</h3>
            <p className="text-blue-100 text-sm">
              Monitor dan kelola tiket support dengan efisien
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Ticket, Eye } from "lucide-react";
import Link from "next/link";

interface TicketItem {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  category: { name: string; department: string | null };
  createdBy: { name: string; email: string };
  assignedTo: { name: string } | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "bg-blue-50 text-blue-700 border-blue-200" },
  IN_PROGRESS: { label: "In Progress", color: "bg-amber-50 text-amber-700 border-amber-200" },
  RESOLVED: { label: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CLOSED: { label: "Closed", color: "bg-slate-100 text-slate-600 border-slate-200" },
  ESCALATED: { label: "Escalated", color: "bg-red-50 text-red-700 border-red-200" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  URGENT: { label: "Urgent", color: "bg-red-50 text-red-700 border-red-200" },
  HIGH: { label: "High", color: "bg-orange-50 text-orange-700 border-orange-200" },
  MEDIUM: { label: "Medium", color: "bg-blue-50 text-blue-700 border-blue-200" },
  LOW: { label: "Low", color: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function ExecutiveTicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.ticketNumber.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.createdBy.name.toLowerCase().includes(q) ||
      (t.category.department || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">Monitor Tiket</h1>
        <p className="text-sm text-[#64748B] mt-1">Pantau semua tiket yang sedang ditangani tim</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            placeholder="Cari tiket, judul, pemohon, divisi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 border-[#E2E8F0] bg-white rounded-xl text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "ALL")}>
          <SelectTrigger className="h-10 w-44 border-[#E2E8F0] rounded-xl text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
            <SelectItem value="ESCALATED">Escalated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v ?? "ALL")}>
          <SelectTrigger className="h-10 w-44 border-[#E2E8F0] rounded-xl text-sm">
            <SelectValue placeholder="Prioritas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Prioritas</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center text-xs text-[#94A3B8] px-2">
          {filtered.length} tiket
        </div>
      </div>

      {/* Table */}
      <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="h-1 bg-[#7C3AED]" />
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-100 border-t-[#7C3AED]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  {["No. Tiket", "Judul", "Pemohon", "Divisi", "Prioritas", "Status", "Ditangani", "Tgl Buat", ""].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider first:px-5 last:px-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const s = statusConfig[t.status] || { label: t.status, color: "" };
                  const p = priorityConfig[t.priority] || { label: t.priority, color: "" };
                  return (
                    <tr key={t.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-5 font-mono text-xs text-[#7C3AED] font-semibold">{t.ticketNumber}</td>
                      <td className="py-3 px-3 max-w-[180px]">
                        <p className="font-medium text-[#1E293B] truncate">{t.title}</p>
                      </td>
                      <td className="py-3 px-3 text-xs text-[#64748B]">{t.createdBy.name}</td>
                      <td className="py-3 px-3 text-xs text-[#64748B]">{t.category.department || t.category.name}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className={`text-xs ${p.color}`}>{p.label}</Badge>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className={`text-xs ${s.color}`}>{s.label}</Badge>
                      </td>
                      <td className="py-3 px-3 text-xs text-[#64748B]">{t.assignedTo?.name || <span className="text-[#CBD5E1]">-</span>}</td>
                      <td className="py-3 px-3 text-xs text-[#94A3B8]">
                        {new Date(t.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3 px-5">
                        <Link href={`/tickets/${t.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#64748B] hover:text-[#7C3AED]">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Ticket className="h-12 w-12 text-[#E2E8F0] mb-3" />
                <p className="text-[#64748B] font-medium text-sm">Tidak ada tiket ditemukan</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
  Search,
  Plus,
  MessageSquare,
  Ticket,
  Filter,
  ArrowRight,
  Clock,
} from "lucide-react";

interface TicketItem {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  category: { name: string };
  createdBy: { name: string; email: string };
  assignedTo: { name: string; email: string } | null;
  onBehalfOf: { name: string; email: string } | null;
  _count: { comments: number };
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  OPEN: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Open" },
  IN_PROGRESS: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "In Progress" },
  RESOLVED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Resolved" },
  CLOSED: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", label: "Closed" },
  ESCALATED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Escalated" },
};

const priorityConfig: Record<string, { bg: string; text: string }> = {
  LOW: { bg: "bg-slate-100", text: "text-slate-600" },
  MEDIUM: { bg: "bg-blue-50", text: "text-blue-700" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-700" },
  URGENT: { bg: "bg-red-50", text: "text-red-700" },
};

export default function TicketsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/tickets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTickets();
  };

  const role = session?.user?.role;
  const pageTitle =
    role === "ADMIN"
      ? "Semua Tiket"
      : role === "AGENT" || role === "SUPERVISOR"
      ? "Tiket"
      : "Tiket Saya";

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-100 border-t-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">
            {pageTitle}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Kelola dan pantau tiket support
          </p>
        </div>
        <Link href="/tickets/new">
          <Button className="h-10 bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md shadow-[#7C3AED]/25 transition-all duration-200 rounded-xl text-sm font-semibold">
            <Plus className="mr-2 h-4 w-4" />
            Buat Tiket
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 min-w-[240px] items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <Input
                  placeholder="Cari tiket..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED]"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleSearch}
                className="h-10 border-[#E2E8F0] rounded-xl text-sm"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#94A3B8]" />
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value || "")}
              >
                <SelectTrigger className="w-36 h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="ESCALATED">Escalated</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={(value) => setPriorityFilter(value || "")}
              >
                <SelectTrigger className="w-36 h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-3">
        {tickets.map((ticket) => {
          const status = statusConfig[ticket.status] || statusConfig.OPEN;
          const priority = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;
          const created = new Date(ticket.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
              <Card className="group border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1 bg-[#7C3AED] opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F1F5F9] px-2 py-0.5 text-xs font-mono font-semibold text-[#64748B]">
                          <Ticket className="h-3 w-3" />
                          {ticket.ticketNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                          />
                          {status.label}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${priority.bg} ${priority.text}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-[#1E293B] group-hover:text-[#7C3AED] transition-colors truncate">
                        {ticket.title}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-[#64748B] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {created}
                        </span>
                        <span className="rounded-md bg-[#F8FAFC] px-2 py-0.5 font-medium text-[#64748B] border border-[#E2E8F0]">
                          {ticket.category.name}
                        </span>
                        <span>
                          Oleh:{" "}
                          <span className="font-medium text-[#1E293B]">
                            {ticket.onBehalfOf
                              ? ticket.onBehalfOf.name
                              : ticket.createdBy.name}
                          </span>
                        </span>
                        {ticket.assignedTo && (
                          <span>
                            Technician:{" "}
                            <span className="font-medium text-[#2563EB]">
                              {ticket.assignedTo.name}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 rounded-lg bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#64748B] border border-[#E2E8F0]">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="font-medium">
                          {ticket._count.comments}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#CBD5E1] group-hover:text-[#7C3AED] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {tickets.length === 0 && (
          <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9] mb-4">
                <Ticket className="h-8 w-8 text-[#CBD5E1]" />
              </div>
              <p className="text-[#64748B] font-medium text-sm">
                Tidak ada tiket ditemukan
              </p>
              <p className="text-xs text-[#94A3B8] mt-1">
                Coba ubah filter atau buat tiket baru
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

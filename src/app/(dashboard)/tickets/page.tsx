"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/components/auth/session-provider";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
  Building2,
  ChevronDown,
  Layers3,
} from "lucide-react";

interface TicketItem {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  category: { name: string; department: string | null };
  createdBy: { name: string; email: string };
  assignedTo: { name: string; email: string } | null;
  onBehalfOf: { name: string; email: string } | null;
  _count: { comments: number };
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  OPEN: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Terbuka" },
  IN_PROGRESS: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Dalam Proses" },
  RESOLVED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Selesai" },
  CLOSED: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", label: "Ditutup" },
  ESCALATED: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Dalam Proses" },
  REOPENED: { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500", label: "Dibuka Kembali" },
  CANCELLED: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-400", label: "Dibatalkan" },
};

const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
  LOW: { bg: "bg-slate-100", text: "text-slate-600", label: "Rendah" },
  MEDIUM: { bg: "bg-blue-50", text: "text-blue-700", label: "Sedang" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-700", label: "Tinggi" },
  URGENT: { bg: "bg-red-50", text: "text-red-700", label: "Mendesak" },
};

const attentionLabels: Record<string, string> = {
  active: "Tiket aktif",
  overdue: "Deadline terlewat",
  due24: "Deadline kurang dari 24 jam",
  unassigned: "Belum ditugaskan",
  high: "Prioritas tinggi dan mendesak",
};

const activeTicketStatuses = new Set([
  "OPEN",
  "IN_PROGRESS",
  "ESCALATED",
  "REOPENED",
]);

interface DepartmentTicketGroup {
  department: string;
  tickets: TicketItem[];
  activeCount: number;
  completedCount: number;
  highPriorityCount: number;
}

function TicketListItem({ ticket }: { ticket: TicketItem }) {
  const status = statusConfig[ticket.status] || statusConfig.OPEN;
  const priority = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;
  const created = new Date(ticket.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link href={`/tickets/${ticket.id}`} className="block">
      <Card className="group cursor-pointer overflow-hidden py-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#CFC4F6] hover:shadow-[0_10px_26px_rgba(29,43,76,0.09)]">
        <div className="absolute left-0 top-0 h-full w-1 bg-[#7047EB] opacity-0 transition-opacity group-hover:opacity-100" />
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F1F5F9] px-2 py-0.5 font-mono text-xs font-semibold text-[#64748B]">
                  <Ticket className="h-3 w-3" />
                  {ticket.ticketNumber}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${priority.bg} ${priority.text}`}
                >
                  {priority.label}
                </span>
              </div>

              <h3 className="truncate text-base font-bold text-[#17223D] transition-colors group-hover:text-[#7047EB]">
                {ticket.title}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {created}
                </span>
                <span className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 font-medium text-[#64748B]">
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
                    Assignee:{" "}
                    <span className="font-semibold text-[#7047EB]">
                      {ticket.assignedTo.name}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#64748B]">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="font-medium">{ticket._count.comments}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-[#B7C0D0] transition-all group-hover:translate-x-1 group-hover:text-[#7047EB]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function TicketsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const requestedStatus = searchParams.get("status") || "";
  const requestedPriority = searchParams.get("priority") || "";
  const requestedDepartment = searchParams.get("department") || "";
  const requestedAttention = searchParams.get("attention") || "";
  const requestedFrom = searchParams.get("from") || "";
  const requestedTo = searchParams.get("to") || "";
  const scopeParam = searchParams.get("scope");
  const scope =
    scopeParam === "department"
      ? "department"
      : scopeParam === "mine"
      ? "mine"
      : "";
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(requestedStatus);
  const [priorityFilter, setPriorityFilter] = useState(requestedPriority);
  const [departmentFilter, setDepartmentFilter] = useState(requestedDepartment);
  const [departments, setDepartments] = useState<string[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(
    () => new Set(requestedDepartment ? [requestedDepartment] : [])
  );
  const attention = attentionLabels[requestedAttention]
    ? requestedAttention
    : "";

  useEffect(() => {
    let cancelled = false;

    const loadDepartments = async () => {
      try {
        const res = await fetch("/api/departments");
        if (!res.ok || cancelled) return;

        const departmentNames = (await res.json()) as string[];
        if (!cancelled) setDepartments(departmentNames);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    };

    void loadDepartments();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTickets = async () => {
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.append("status", statusFilter);
        if (priorityFilter) params.append("priority", priorityFilter);
        if (departmentFilter) params.append("department", departmentFilter);
        if (appliedSearch) params.append("search", appliedSearch);
        if (scope) params.append("scope", scope);
        if (attention) params.append("attention", attention);
        if (requestedFrom) params.append("from", requestedFrom);
        if (requestedTo) params.append("to", requestedTo);

        const res = await fetch(`/api/tickets?${params}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setTickets(data);
        }
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadTickets();
    return () => {
      cancelled = true;
    };
  }, [
    appliedSearch,
    attention,
    departmentFilter,
    priorityFilter,
    requestedFrom,
    requestedTo,
    scope,
    statusFilter,
  ]);

  const handleSearch = () => {
    setAppliedSearch(search);
  };

  const role = session?.user?.role;
  const isExecutive = role === "EXECUTIVE";
  const canCreateTicket = true;
  const pageTitle =
    isExecutive
      ? scope === "mine"
        ? "Tiket Saya"
        : "Monitor Tiket"
      : scope === "department"
      ? "Tiket Divisi"
      : role === "ADMIN"
      ? "Semua Tiket"
      : role === "AGENT" || role === "SUPERVISOR"
      ? "Tiket"
      : "Tiket Saya";

  const executiveTicketGroups = useMemo<DepartmentTicketGroup[]>(() => {
    if (!isExecutive) return [];

    const groups = new Map<string, TicketItem[]>();
    tickets.forEach((ticket) => {
      const department = ticket.category.department?.trim() || "Tanpa Divisi";
      groups.set(department, [...(groups.get(department) || []), ticket]);
    });

    return Array.from(groups, ([department, departmentTickets]) => ({
      department,
      tickets: departmentTickets,
      activeCount: departmentTickets.filter((ticket) =>
        activeTicketStatuses.has(ticket.status)
      ).length,
      completedCount: departmentTickets.filter((ticket) =>
        ["RESOLVED", "CLOSED"].includes(ticket.status)
      ).length,
      highPriorityCount: departmentTickets.filter((ticket) =>
        ["HIGH", "URGENT"].includes(ticket.priority)
      ).length,
    })).sort((a, b) => a.department.localeCompare(b.department, "id-ID"));
  }, [isExecutive, tickets]);

  const toggleDepartment = (department: string) => {
    setExpandedDepartments((current) => {
      const next = new Set(current);
      if (next.has(department)) {
        next.delete(department);
      } else {
        next.add(department);
      }
      return next;
    });
  };

  const allDepartmentsExpanded =
    executiveTicketGroups.length > 0 &&
    executiveTicketGroups.every((group) =>
      expandedDepartments.has(group.department)
    );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#E6E0FA] border-t-[#7047EB]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-[16px] bg-[var(--brand-header)] px-5 py-5 text-white shadow-[0_12px_32px_rgba(4,76,113,0.18)] sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div>
          <h1 className="text-[27px] font-bold tracking-[-0.03em] text-white">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-[#BDCCE0]">
            Kelola, prioritaskan, dan pantau progres layanan
          </p>
        </div>
        {canCreateTicket && (
          <Link href="/tickets/new">
            <Button className="h-11 bg-white px-4 text-[#102B50] shadow-sm hover:bg-[#F0EDFF] hover:text-[#5F39DB]">
              <Plus className="mr-2 h-4 w-4" />
              Buat Tiket
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="py-0">
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 min-w-[240px] items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <Input
                  aria-label="Cari tiket"
                  placeholder="Cari tiket..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-10 bg-[#F8FAFD] pl-10 text-sm focus:bg-white"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleSearch}
                className="h-10 px-3 text-sm"
                aria-label="Cari tiket"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 items-center gap-2 sm:flex">
              <Filter className="hidden h-4 w-4 text-[#94A3B8] sm:block" />
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value || "")}
              >
                <SelectTrigger
                  aria-label="Filter status tiket"
                  className="h-10 w-full bg-[#F8FAFD] text-sm sm:w-40"
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Status</SelectItem>
                  <SelectItem value="OPEN">Terbuka</SelectItem>
                  <SelectItem value="IN_PROGRESS">Dalam Proses</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                  <SelectItem value="RESOLVED">Selesai</SelectItem>
                  <SelectItem value="CLOSED">Ditutup</SelectItem>
                  <SelectItem value="REOPENED">Dibuka Kembali</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={(value) => setPriorityFilter(value || "")}
              >
                <SelectTrigger
                  aria-label="Filter prioritas tiket"
                  className="h-10 w-full bg-[#F8FAFD] text-sm sm:w-40"
                >
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Priority</SelectItem>
                  <SelectItem value="LOW">Rendah</SelectItem>
                  <SelectItem value="MEDIUM">Sedang</SelectItem>
                  <SelectItem value="HIGH">Tinggi</SelectItem>
                  <SelectItem value="URGENT">Mendesak</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={departmentFilter}
                onValueChange={(value) => {
                  const nextDepartment = value || "";
                  setDepartmentFilter(nextDepartment);
                  if (nextDepartment) {
                    setExpandedDepartments((current) => {
                      const next = new Set(current);
                      next.add(nextDepartment);
                      return next;
                    });
                  }
                }}
              >
                <SelectTrigger
                  aria-label="Filter divisi tiket"
                  className="col-span-2 h-10 w-full bg-[#F8FAFD] text-sm sm:w-56"
                >
                  <SelectValue placeholder="Divisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Divisi</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {attention && (
        <div className="flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Filter insight aktif: <strong>{attentionLabels[attention]}</strong>
          </span>
          <Link
            href="/tickets"
            className="font-semibold text-sky-700 underline-offset-4 hover:underline"
          >
            Hapus filter
          </Link>
        </div>
      )}

      {(requestedFrom || requestedTo) && (
        <div className="flex flex-col gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Periode laporan: <strong>{requestedFrom || "awal"}</strong> sampai{" "}
            <strong>{requestedTo || "hari ini"}</strong>
          </span>
          <Link
            href="/tickets"
            className="font-semibold text-violet-700 underline-offset-4 hover:underline"
          >
            Hapus periode
          </Link>
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-3">
        {isExecutive && tickets.length > 0 ? (
          <>
            <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4EF] bg-white px-4 py-3 shadow-[var(--shadow-surface)] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0EDFF] text-[#7047EB]">
                  <Layers3 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#17223D]">Tiket per divisi</p>
                  <p className="text-xs text-[#71809A]">
                    {executiveTicketGroups.length} divisi · {tickets.length} tiket
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={allDepartmentsExpanded}
                  onClick={() =>
                    setExpandedDepartments(
                      new Set(executiveTicketGroups.map((group) => group.department))
                    )
                  }
                  className="h-8 rounded-lg px-3 text-xs"
                >
                  Buka semua
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={
                    !executiveTicketGroups.some((group) =>
                      expandedDepartments.has(group.department)
                    )
                  }
                  onClick={() => setExpandedDepartments(new Set())}
                  className="h-8 rounded-lg px-3 text-xs text-[#64748B]"
                >
                  Tutup semua
                </Button>
              </div>
            </div>

            {executiveTicketGroups.map((group, index) => {
              const isExpanded = expandedDepartments.has(group.department);
              const panelId = `department-ticket-panel-${index}`;

              return (
                <Card
                  key={group.department}
                  className={`overflow-hidden py-0 transition-[border-color,box-shadow] duration-200 ${
                    isExpanded
                      ? "border-[#CFC4F6] shadow-[var(--shadow-surface)]"
                      : "hover:border-[#C7D3E3] hover:shadow-[0_6px_18px_rgba(29,43,76,0.06)]"
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    onClick={() => toggleDepartment(group.department)}
                    className="group flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors hover:bg-[#FAFBFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7047EB]/30 sm:flex-row sm:items-center sm:justify-between md:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isExpanded
                            ? "bg-[#7047EB] text-white"
                            : "bg-[#EEF4FA] text-[#49617F] group-hover:bg-[#F0EDFF] group-hover:text-[#7047EB]"
                        }`}
                      >
                        <Building2 className="h-[18px] w-[18px]" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-[15px] font-bold text-[#17223D]">
                          {group.department}
                        </h2>
                        <p className="mt-0.5 text-xs text-[#71809A]">
                          {group.tickets.length} tiket dalam divisi ini
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full items-center justify-between gap-3 pl-[52px] sm:w-auto sm:justify-end sm:pl-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                          {group.activeCount} aktif
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          {group.completedCount} selesai
                        </span>
                        {group.highPriorityCount > 0 && (
                          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                            {group.highPriorityCount} prioritas tinggi
                          </span>
                        )}
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[#8795AA] transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-[#7047EB]" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div
                      id={panelId}
                      className="space-y-3 border-t border-[#E8EDF4] bg-[#F8FAFD] p-3 md:p-4"
                    >
                      {group.tickets.map((ticket) => (
                        <TicketListItem key={ticket.id} ticket={ticket} />
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </>
        ) : (
          tickets.map((ticket) => (
            <TicketListItem key={ticket.id} ticket={ticket} />
          ))
        )}

        {tickets.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#F0EDFF] text-[#7047EB]">
                <Ticket className="h-8 w-8" />
              </div>
              <p className="text-base font-bold text-[#26334D]">
                Tidak ada tiket ditemukan
              </p>
              <p className="mt-1 max-w-sm text-sm text-[#71809A]">
                Coba ubah filter atau buat tiket baru
              </p>
              {canCreateTicket && (
                <Link href="/tickets/new" className="mt-5">
                  <Button>
                    <Plus className="h-4 w-4" />
                    Buat tiket pertama
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

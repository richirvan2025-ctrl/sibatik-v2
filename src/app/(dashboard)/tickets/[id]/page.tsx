"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/components/auth/session-provider";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  User,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Star,
  Shield,
  Calendar,
  Tag,
  Send,
  Lock,
  FileText,
  Paperclip,
  ImageIcon,
  Download,
  RotateCcw,
  Link as LinkIcon,
  ExternalLink,
  CircleDot,
  Flag,
  Info,
  Hash,
} from "lucide-react";

interface Comment {
  id: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  type?: 'file' | 'link';
}

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt: string | null;
  deadline: string | null;
  rating: number | null;
  feedback: string | null;
  firstResponseAt: string | null;
  category: { name: string; department: string | null };
  reopenCount?: number;
  createdBy: { id: string; name: string; email: string };
  assignedTo: { id: string; name: string; email: string } | null;
  onBehalfOf: { id: string; name: string; email: string } | null;
  comments: Comment[];
  attachments: Attachment[];
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  OPEN: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Open" },
  IN_PROGRESS: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "In Progress" },
  RESOLVED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Resolved" },
  CLOSED: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", label: "Closed" },
  ESCALATED: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Dalam Proses" },
};

const priorityConfig: Record<string, { bg: string; text: string; border: string }> = {
  LOW: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  MEDIUM: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  URGENT: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

function formatTicketDate(value: string, includeYear = true) {
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDeadlineSummary(value: string) {
  const deadline = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineDay = new Date(
    deadline.getFullYear(),
    deadline.getMonth(),
    deadline.getDate()
  );
  const differenceInDays = Math.round(
    (deadlineDay.getTime() - startOfToday.getTime()) / 86400000
  );
  const time = deadline.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (differenceInDays === 0) return `Deadline hari ini · ${time}`;
  if (differenceInDays === 1) return `Deadline besok · ${time}`;
  return `Deadline ${deadline.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  })} · ${time}`;
}

export default function TicketDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const role = session?.user?.role;
  const userId = session?.user?.id;
  const isAdmin = role === "ADMIN";
  const isAgent = role === "AGENT";
  const isSupervisor = role === "SUPERVISOR";
  const isExecutive = role === "EXECUTIVE";
  const canManage = isAdmin || isAgent || isSupervisor;
  const isTicketParticipant =
    ticket?.createdBy.id === userId ||
    ticket?.onBehalfOf?.id === userId ||
    ticket?.assignedTo?.id === userId;
  const canComment = !isExecutive || isTicketParticipant;

  const fetchTicket = useCallback(
    async (silent = false) => {
      try {
        const res = await fetch(`/api/tickets/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setTicket(data);
        }
      } catch (error) {
        console.error("Failed to fetch ticket:", error);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [params.id]
  );

  useEffect(() => {
    // Initial data loading is intentionally synchronized with the route id.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTicket();
  }, [fetchTicket]);

  // Polling komentar setiap 20 detik — hanya jika tab aktif dan tiket belum selesai
  useEffect(() => {
    const shouldPoll = () =>
      document.visibilityState === "visible" &&
      ticket?.status !== "RESOLVED" &&
      ticket?.status !== "CLOSED";

    const poll = () => {
      if (shouldPoll()) fetchTicket(true);
    };

    const interval = setInterval(poll, 20000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [fetchTicket, ticket?.status]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/tickets/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchTicket();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleAssign = async (assignedToId: string) => {
    try {
      const res = await fetch(`/api/tickets/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: assignedToId || null }),
      });
      if (res.ok) fetchTicket();
    } catch (error) {
      console.error("Failed to assign ticket:", error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: comment, isInternal }),
      });
      if (res.ok) {
        setComment("");
        setIsInternal(false);
        fetchTicket();
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRating = async (rating: number) => {
    try {
      const res = await fetch(`/api/tickets/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, status: "CLOSED" }),
      });
      if (res.ok) fetchTicket();
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-100 border-t-[#7C3AED]" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex h-96 items-center justify-center text-[#94A3B8]">
        Tiket tidak ditemukan
      </div>
    );
  }

  const status = statusConfig[ticket.status] || statusConfig.OPEN;
  const priority = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;
  const deadlineIsUrgent = ticket.deadline
    ? new Date(ticket.deadline).getTime() <=
      new Date().setHours(23, 59, 59, 999)
    : false;

  return (
    <div className="mx-auto w-full max-w-[1176px] pb-6">
      {/* Operational brief */}
      <header>
        <Button
          variant="ghost"
          className="-ml-2 h-8 rounded-lg px-2 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]"
          onClick={() => router.push("/tickets")}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Kembali
        </Button>

        <div className="mt-7 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] shadow-sm">
            <Hash className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-mono text-base font-semibold tracking-tight text-[#64748B] sm:text-lg">
            {ticket.ticketNumber}
          </span>
        </div>

        <h1 className="mt-4 max-w-5xl text-2xl font-bold leading-tight tracking-[-0.025em] text-[#17233A] sm:text-[30px]">
          {ticket.title}
        </h1>

        <section
          aria-label="Ringkasan operasional tiket"
          className="mt-8 grid overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[var(--shadow-raised)] sm:grid-cols-2 xl:grid-cols-4"
        >
          <div className="flex min-h-[60px] items-center gap-3 px-5 py-2">
            <CircleDot className={`h-5 w-5 shrink-0 ${status.text}`} aria-hidden="true" />
            <p className={`truncate text-sm font-semibold ${status.text}`}>
              {status.label}
            </p>
          </div>
          <div className="flex min-h-[60px] items-center gap-3 border-t border-[#E2E8F0] px-5 py-2 sm:border-l sm:border-t-0">
            <Flag className={`h-5 w-5 shrink-0 ${priority.text}`} aria-hidden="true" />
            <p className={`truncate text-sm font-semibold ${priority.text}`}>
              {ticket.priority}
            </p>
          </div>
          <div className="flex min-h-[60px] items-center gap-3 border-t border-[#E2E8F0] px-5 py-2 xl:border-l xl:border-t-0">
            <Clock
              className={`h-5 w-5 shrink-0 ${
                deadlineIsUrgent ? "text-red-500" : "text-[#64748B]"
              }`}
              aria-hidden="true"
            />
            <p
              className={`truncate text-sm font-semibold ${
                deadlineIsUrgent ? "text-red-600" : "text-[#334155]"
              }`}
            >
              {ticket.deadline
                ? formatDeadlineSummary(ticket.deadline)
                : "Tanpa deadline"}
            </p>
          </div>
          <div className="flex min-h-[60px] items-center gap-3 border-t border-[#E2E8F0] px-5 py-2 sm:border-l xl:border-t-0">
            <User className="h-5 w-5 shrink-0 text-[#64748B]" aria-hidden="true" />
            <p className="truncate text-sm font-semibold text-[#475569]">
              {ticket.assignedTo?.name || "Belum di-assign"}
            </p>
          </div>
        </section>
      </header>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main Content */}
        <main className="min-w-0 space-y-4">
          {/* Description */}
          <Card variant="surface" className="gap-0 overflow-hidden rounded-xl border border-[#DCE3EC] bg-white py-0">
            <CardHeader className="border-b border-[#E2E8F0] px-5 py-4">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-[#17233A]">
                <FileText className="h-[18px] w-[18px] text-[#334155]" aria-hidden="true" />
                Deskripsi
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[178px] px-5 py-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-[#334155]">
                {ticket.description}
              </p>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mt-5 border-t border-[#E2E8F0] pt-4">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    <Paperclip className="h-3.5 w-3.5" />
                    Lampiran ({ticket.attachments.length})
                  </p>
                  <div className="space-y-2">
                    {ticket.attachments.map((att) => {
                      // Check if this is a link attachment
                      if (att.type === 'link') {
                        return (
                          <a
                            key={att.id}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B] hover:bg-[#F1F5F9] transition-colors group"
                          >
                            <LinkIcon className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="flex-1 truncate text-xs font-medium">{att.fileName}</span>
                            <ExternalLink className="h-3.5 w-3.5 text-[#94A3B8] group-hover:text-[#7C3AED] shrink-0" />
                          </a>
                        );
                      }

                      // Detect image from mimeType OR file extension (fallback for camera uploads)
                      const ext = att.fileName.split(".").pop()?.toLowerCase() || "";
                      const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"];
                      const isImage = att.mimeType?.startsWith("image/") || imageExts.includes(ext);
                      return (
                        <div key={att.id}>
                          {isImage && (
                            <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                              <img
                                src={att.fileUrl}
                                alt={att.fileName}
                                className="max-h-64 rounded-xl border border-[#E2E8F0] object-contain bg-[#F8FAFC]"
                              />
                            </a>
                          )}
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={att.fileName}
                            className="flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B] hover:bg-[#F1F5F9] transition-colors group"
                          >
                            {isImage ? (
                              <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 text-orange-500 shrink-0" />
                            )}
                            <span className="flex-1 truncate text-xs font-medium">{att.fileName}</span>
                            <span className="text-[10px] text-[#94A3B8] shrink-0">
                              {(att.fileSize / 1024).toFixed(0)} KB
                            </span>
                            <Download className="h-3.5 w-3.5 text-[#94A3B8] group-hover:text-[#7C3AED] shrink-0" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card variant="surface" className="gap-0 overflow-hidden rounded-xl border border-[#DCE3EC] bg-white py-0">
            <CardHeader className="border-b border-[#E2E8F0] px-5 py-4">
              <CardTitle className="flex items-center justify-between gap-3 text-base font-semibold text-[#17233A]">
                <span className="flex min-w-0 items-center gap-2.5">
                  <MessageSquare className="h-[18px] w-[18px] shrink-0 text-[#334155]" aria-hidden="true" />
                  <span className="truncate">Aktivitas / Komentar</span>
                </span>
                <span className="shrink-0 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#64748B]">
                  {ticket.comments.length} komentar
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-5 py-5">
              {ticket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`rounded-xl p-4 transition-all ${
                    comment.isInternal
                      ? "bg-amber-50 border border-amber-200"
                      : "bg-[#F8FAFC] border border-[#E2E8F0]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          comment.user.role === "ADMIN"
                            ? "bg-blue-100 text-blue-600"
                            : comment.user.role === "AGENT"
                            ? "bg-orange-100 text-orange-600"
                            : comment.user.role === "SUPERVISOR"
                            ? "bg-purple-100 text-purple-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-[#1E293B]">
                          {comment.user.name}
                        </span>
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                          {comment.user.role}
                        </span>
                      </div>
                      {comment.isInternal && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                          <Lock className="mr-1 h-3 w-3" />
                          Internal
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-[#94A3B8]">
                      {new Date(comment.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-[#1E293B] leading-relaxed pl-10">
                    {comment.message}
                  </p>
                </div>
              ))}

              {ticket.comments.length === 0 && (
                <div className="flex min-h-[228px] flex-col items-center justify-center rounded-xl border border-[#E5EAF1] bg-[#F8FAFC] px-4 text-center shadow-[var(--shadow-inset)]">
                  <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B]">
                    <MessageSquare className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold text-[#1E293B]">Belum ada komentar</p>
                  <p className="mt-1 text-sm text-[#94A3B8]">
                    Belum ada komentar pada tiket ini.
                  </p>
                </div>
              )}

              {canComment && (
                <>
                  <Separator className="my-4" />

                  {/* Add Comment */}
                  <form onSubmit={handleSubmitComment} className="space-y-3">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                        <Send className="h-4 w-4 text-[#7C3AED]" />
                        Tambah Komentar
                      </Label>
                      <Textarea
                        placeholder="Tulis komentar..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED] resize-none"
                      />
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="internal"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="rounded border-[#E2E8F0] text-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                        <Label
                          htmlFor="internal"
                          className="text-sm font-normal text-[#64748B]"
                        >
                          Komentar Internal (hanya Admin/Assignee)
                        </Label>
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="h-9 bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md shadow-[#7C3AED]/25 rounded-xl text-sm"
                    >
                      {submitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Kirim Komentar
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>

          {/* Rating */}
          {ticket.status === "RESOLVED" &&
            !ticket.rating &&
            ticket.createdBy.id === userId && (
              <Card variant="surface" className="gap-0 overflow-hidden rounded-xl border border-[#E2E8F0] bg-gradient-to-br from-orange-50 to-amber-50 py-0">
                <CardHeader className="pb-3 pt-5 px-5">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                    <Star className="h-4 w-4 text-[#0EA5E9]" />
                    Rating
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <p className="text-sm text-[#64748B] mb-4">
                    Bagaimana pelayanan kami? Berikan rating untuk menutup
                    tiket ini.
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant="outline"
                        onClick={() => handleRating(star)}
                        className="h-9 border-orange-200 hover:bg-orange-50 hover:text-orange-700 transition-all rounded-xl text-sm"
                      >
                        <Star className="h-4 w-4 mr-1 text-orange-400" />
                        {star}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </main>

        {/* Sidebar Info */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-4" aria-label="Informasi dan aksi tiket">
          {/* Ticket Info */}
          <Card variant="surface" className="order-2 gap-0 overflow-hidden rounded-xl border border-[#DCE3EC] bg-white py-0 lg:min-h-[590px]">
            <CardHeader className="border-b border-[#E2E8F0] px-5 py-4">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-[#17233A]">
                <Info className="h-[18px] w-[18px] text-[#334155]" aria-hidden="true" />
                Informasi Tiket
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col divide-y divide-[#E2E8F0] px-5 py-0">
              <InfoRow
                icon={<Tag className="h-4 w-4" />}
                label="Kategori"
                value={ticket.category.name}
              />
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Dibuat Oleh"
                value={
                  ticket.onBehalfOf
                    ? `${ticket.onBehalfOf.name} (oleh ${ticket.createdBy.name})`
                    : ticket.createdBy.name
                }
              />
              <InfoRow
                icon={<Shield className="h-4 w-4" />}
                label="Assigned To"
                value={ticket.assignedTo?.name || "Belum di-assign"}
                valueClass={ticket.assignedTo ? "text-[#7C3AED] font-medium" : ""}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Dibuat Pada"
                value={formatTicketDate(ticket.createdAt)}
              />
              {ticket.deadline && (
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Deadline"
                  value={formatTicketDate(ticket.deadline)}
                  valueClass={
                    new Date(ticket.deadline) < new Date() &&
                    !["RESOLVED", "CLOSED"].includes(ticket.status)
                      ? "text-red-600 font-medium"
                      : "text-orange-600 font-medium"
                  }
                />
              )}
              {ticket.resolvedAt && (
                <InfoRow
                  icon={<CheckCircle className="h-4 w-4" />}
                  label="Diselesaikan"
                  value={formatTicketDate(ticket.resolvedAt, false)}
                  valueClass="text-emerald-600"
                />
              )}
              {ticket.firstResponseAt && (
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="First Response"
                  value={formatTicketDate(ticket.firstResponseAt, false)}
                />
              )}
              {ticket.rating && (
                <InfoRow
                  icon={<Star className="h-4 w-4 text-orange-400" />}
                  label="Rating"
                  value={`${ticket.rating} / 5 bintang`}
                  valueClass="text-orange-600 font-semibold"
                />
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {canManage && (
            <Card variant="surface" className="order-1 gap-0 overflow-hidden rounded-xl border border-[#DCE3EC] bg-white py-0">
              <CardHeader className="border-b border-[#E2E8F0] px-5 py-4">
                <CardTitle className="text-sm font-semibold text-[#1E293B]">
                  Aksi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5 pt-4">
                {ticket.status === "CLOSED" ? (
                  // Locked state - show reopen button
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                      <Lock className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600">Tiket telah ditutup</span>
                    </div>
                    {(isAdmin || ticket.createdBy.id === userId || ticket.onBehalfOf?.id === userId) && (ticket.reopenCount ?? 0) < 1 ? (
                      <Button
                        onClick={async () => {
                          if (!confirm("Apakah Anda yakin ingin membuka kembali tiket ini?")) return;
                          try {
                            const res = await fetch(`/api/tickets/${params.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: "REOPENED" }),
                            });
                            if (res.ok) {
                              await fetchTicket();
                            } else {
                              const err = await res.json();
                              alert(err.error || "Gagal membuka kembali tiket");
                            }
                          } catch {
                            alert("Terjadi kesalahan");
                          }
                        }}
                        variant="outline"
                        className="w-full h-10 border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Buka Kembali Tiket
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-amber-700">Tiket ini tidak dapat dibuka kembali</span>
                      </div>
                    )}
                  </div>
                ) : (
                  // Normal state - show status dropdown
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Update Status
                    </Label>
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => handleStatusChange(value || "")}
                    >
                      <SelectTrigger className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#2563EB] w-full">
                        <SelectValue>
                          {statusConfig[ticket.status]?.label || ticket.status}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="min-w-[var(--radix-select-trigger-width)] !w-auto">
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        {(isAdmin || ticket.createdBy.id === userId || ticket.onBehalfOf?.id === userId) && (
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {ticket.status !== "CLOSED" && (
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Assign ke
                    </Label>
                    <AssigneeSelect
                      currentId={ticket.assignedTo?.id}
                      currentName={ticket.assignedTo?.name}
                      onAssign={handleAssign}
                      categoryDept={ticket.category.department}
                    />
                  </div>
                )}

              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueClass = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="grid flex-1 grid-cols-[20px_102px_minmax(0,1fr)] items-center gap-2.5 py-4">
      <div className="mt-0.5 text-[#64748B]" aria-hidden="true">{icon}</div>
      <p className="pt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
          {label}
      </p>
      <p className={`min-w-0 break-words text-sm leading-5 text-[#334155] ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function AssigneeSelect({
  currentId,
  currentName,
  onAssign,
  categoryDept = null,
}: {
  currentId?: string;
  currentName?: string;
  onAssign: (id: string) => void;
  categoryDept?: string | null;
}) {
  const [assignees, setAssignees] = useState<
    { id: string; name: string; role: string; department: string | null }[]
  >([]);

  useEffect(() => {
    if (!categoryDept) return;

    const controller = new AbortController();
    fetch(`/api/users/assignees?departments=${encodeURIComponent(categoryDept)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((users) => setAssignees(Array.isArray(users) ? users : []))
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Failed to fetch assignees:", error);
        }
      });

    return () => controller.abort();
  }, [categoryDept]);

  const staff = assignees.filter(
    (a) => a.role === "AGENT" || a.role === "ADMIN",
  );
  const supervisors = assignees.filter((a) => a.role === "SUPERVISOR");
  const selectedName = assignees.find((a) => a.id === currentId)?.name || currentName;

  return (
    <Select
      value={currentId || ""}
      onValueChange={(value) => onAssign(value || "")}
    >
      <SelectTrigger
        aria-label="Pilih assignee"
        className="h-9 min-w-0 w-full rounded-lg border-[#D9E1EB] bg-[#F8FAFC] px-2.5 text-sm font-semibold text-[#475569] shadow-none transition-colors hover:border-[#B8A9F2] hover:bg-[#F4F1FF] focus:bg-white focus:border-[#7C3AED]"
      >
        <SelectValue placeholder="Pilih assignee">
          {selectedName || (currentId ? currentId : "Pilih assignee")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        align="end"
        alignItemWithTrigger={false}
        sideOffset={8}
        className="max-h-80 w-[360px] max-w-[calc(100vw-24px)] p-1.5"
      >
        <SelectItem value="" className="py-2.5 text-[#64748B]">
          Belum di-assign
        </SelectItem>
        {staff.length > 0 && (
          <>
            <div className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Staff
            </div>
            {staff.map((t) => (
              <SelectItem
                key={t.id}
                value={t.id}
                className="py-2.5 [&>span:first-child]:min-w-0 [&>span:first-child]:shrink [&>span:first-child]:whitespace-normal"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-[#334155]">{t.name}</span>
                  {t.department && (
                    <span className="mt-0.5 block truncate text-[11px] font-normal text-[#94A3B8]">
                      {t.department}
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </>
        )}
        {supervisors.length > 0 && (
          <>
            <div className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Supervisor
            </div>
            {supervisors.map((d) => (
              <SelectItem
                key={d.id}
                value={d.id}
                className="py-2.5 [&>span:first-child]:min-w-0 [&>span:first-child]:shrink [&>span:first-child]:whitespace-normal"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-[#334155]">{d.name}</span>
                  {d.department && (
                    <span className="mt-0.5 block truncate text-[11px] font-normal text-[#94A3B8]">
                      {d.department}
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  slaBreached: boolean;
  responseSlaBreached: boolean;
  category: { name: string };
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
  ESCALATED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Escalated" },
};

const priorityConfig: Record<string, { bg: string; text: string; border: string }> = {
  LOW: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  MEDIUM: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  URGENT: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

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
  const canManage = isAdmin || isAgent || isSupervisor;

  useEffect(() => {
    fetchTicket();
  }, [params.id]);

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
  }, [params.id, ticket?.status]);

  const fetchTicket = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
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
  };

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

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Button
          variant="ghost"
          className="mb-3 -ml-2 text-[#64748B] hover:text-[#1E293B] h-9 text-sm"
          onClick={() => router.push("/tickets")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Kembali
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-xs font-mono font-semibold text-[#64748B]">
                <Tag className="h-3 w-3" />
                {ticket.ticketNumber}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${priority.bg} ${priority.text} ${priority.border}`}
              >
                {ticket.priority}
              </span>
              {ticket.slaBreached && (
                <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 text-xs">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  SLA Breached
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1E293B]">
              {ticket.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="h-1 bg-[#7C3AED]" />
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <FileText className="h-4 w-4 text-[#7C3AED]" />
                Deskripsi
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-sm text-[#1E293B] whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">
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
          <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="h-1 bg-[#0EA5E9]" />
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                <MessageSquare className="h-4 w-4 text-[#0EA5E9]" />
                Komentar
                <span className="ml-1 rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#64748B]">
                  {ticket.comments.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
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
                <div className="flex flex-col items-center py-8 text-[#94A3B8]">
                  <MessageSquare className="h-10 w-10 mb-2 text-[#E2E8F0]" />
                  <p className="text-sm">Belum ada komentar</p>
                </div>
              )}

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
                      Komentar Internal (hanya Admin/Technician)
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
            </CardContent>
          </Card>

          {/* Rating */}
          {ticket.status === "RESOLVED" &&
            !ticket.rating &&
            ticket.createdBy.id === userId && (
              <Card className="border border-[#E2E8F0] bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="h-1 bg-[#0EA5E9]" />
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
        </div>

        {/* Sidebar Info */}
        <div className="space-y-5">
          {/* Ticket Info */}
          <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="h-1 bg-[#7C3AED]" />
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-semibold text-[#1E293B]">
                Informasi Tiket
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
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
                value={new Date(ticket.createdAt).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
              {ticket.deadline && (
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Deadline"
                  value={new Date(ticket.deadline).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
                  value={new Date(ticket.resolvedAt).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  valueClass="text-emerald-600"
                />
              )}
              {ticket.firstResponseAt && (
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="First Response"
                  value={new Date(ticket.firstResponseAt).toLocaleString(
                    "id-ID",
                    { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
                  )}
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
            <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="h-1 bg-[#0EA5E9]" />
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-semibold text-[#1E293B]">
                  Aksi
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                {ticket.status === "CLOSED" ? (
                  // Locked state - show reopen button
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                      <Lock className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600">Tiket telah ditutup</span>
                    </div>
                    {(isAdmin || ticket.createdBy.id === userId || ticket.onBehalfOf?.id === userId) && (ticket as any).reopenCount < 1 ? (
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
                        <SelectItem value="ESCALATED">Escalated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(isAdmin || isAgent || isSupervisor) && (
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Assign ke
                    </Label>
                    <AssigneeSelect
                      currentId={ticket.assignedTo?.id}
                      onAssign={handleAssign}
                      isSupervisor={isSupervisor}
                      categoryDept={(ticket.category as any)?.department ?? null}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
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
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[#94A3B8]">{icon}</div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
          {label}
        </p>
        <p className={`text-sm text-[#1E293B] mt-0.5 ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

function AssigneeSelect({
  currentId,
  onAssign,
  isSupervisor = false,
  categoryDept = null,
}: {
  currentId?: string;
  onAssign: (id: string) => void;
  isSupervisor?: boolean;
  categoryDept?: string | null;
}) {
  const [assignees, setAssignees] = useState<
    { id: string; name: string; role: string; department: string | null }[]
  >([]);

  const isItCategory = categoryDept === "Sistem Informasi & IT Support";

  useEffect(() => {
    Promise.all([
      fetch("/api/users?role=AGENT").then((r) => r.json()),
      fetch("/api/users?role=SUPERVISOR").then((r) => r.json()),
    ]).then(([agents, supervisors]) => {
      const all = [...(Array.isArray(agents) ? agents : []), ...(Array.isArray(supervisors) ? supervisors : [])];
      setAssignees(all);
    });
  }, []);

  // SUPERVISOR: hanya lihat divisinya sendiri, kecuali kategori IT Support boleh lihat semua
  const filteredAssignees = isSupervisor && !isItCategory
    ? assignees.filter((a) => a.department === categoryDept)
    : assignees;

  const agents = filteredAssignees.filter((a) => a.role === "AGENT");
  const supervisors = filteredAssignees.filter((a) => a.role === "SUPERVISOR");
  const selectedName = assignees.find((a) => a.id === currentId)?.name;

  return (
    <Select
      value={currentId || ""}
      onValueChange={(value) => onAssign(value || "")}
    >
      <SelectTrigger className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED] w-full">
        <SelectValue placeholder="Pilih assignee">
          {selectedName || (currentId ? currentId : "Pilih assignee")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[var(--radix-select-trigger-width)] !w-auto">
        <SelectItem value="">Unassign</SelectItem>
        {agents.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Agent
            </div>
            {agents.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
                {t.department && (
                  <span className="ml-1 text-[#94A3B8]">({t.department})</span>
                )}
              </SelectItem>
            ))}
          </>
        )}
        {supervisors.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Supervisor
            </div>
            {supervisors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
                {d.department && (
                  <span className="ml-1 text-[#94A3B8]">({d.department})</span>
                )}
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
}

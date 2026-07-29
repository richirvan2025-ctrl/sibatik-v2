"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "@/components/auth/session-provider";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Loader2,
  Ticket,
  ArrowLeft,
  Send,
  User,
  FolderOpen,
  Flag,
  Type,
  FileText,
  Paperclip,
  Upload,
  X,
  ImageIcon,
  File,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  department: string | null;
  children: { id: string; name: string; department: string | null }[];
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  LOW: { color: "text-slate-600", bg: "bg-slate-100", label: "Low - Rendah" },
  MEDIUM: { color: "text-blue-700", bg: "bg-blue-50", label: "Medium - Sedang" },
  HIGH: { color: "text-orange-700", bg: "bg-orange-50", label: "High - Tinggi" },
  URGENT: { color: "text-red-700", bg: "bg-red-50", label: "Urgent - Darurat" },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-[#7047EB]" />;
  if (mimeType === "application/pdf") return <FileText className="h-4 w-4 text-red-500" />;
  return <File className="h-4 w-4 text-[#64748B]" />;
}

export default function NewTicketPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [onBehalfOfId, setOnBehalfOfId] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const role = session?.user?.role;
  const canCreateOnBehalf = role === "ADMIN" || role === "AGENT" || role === "SUPERVISOR";

  useEffect(() => {
    fetchCategories();
    if (canCreateOnBehalf) fetchUsers();
  }, [canCreateOnBehalf]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.filter((u: UserItem) => u.role === "USER"));
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const combined = [...attachments, ...selected];
    if (combined.length > 5) {
      setError("Maksimal 5 file lampiran");
      return;
    }
    const oversized = combined.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) {
      setError(`File terlalu besar (maks. 10MB): ${oversized.name}`);
      return;
    }
    setError("");
    setAttachments(combined);
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const effectiveCategoryId = subCategoryId || parentCategoryId;
    if (!effectiveCategoryId) {
      setError("Pilih kategori terlebih dahulu");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let uploadedAttachments: any[] = [];

      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach((f) => formData.append("files", f));
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          setError(data.error || "Gagal upload lampiran");
          setLoading(false);
          return;
        }
        uploadedAttachments = await uploadRes.json();
      }

      const body: any = { title, description, categoryId: effectiveCategoryId, priority };
      if (onBehalfOfId) body.onBehalfOfId = onBehalfOfId;
      if (uploadedAttachments.length > 0) body.attachments = uploadedAttachments;

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push("/tickets");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal membuat tiket");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Header */}
      <div className="rounded-[16px] bg-[#102B50] px-5 py-5 text-white shadow-[0_10px_28px_rgba(16,43,80,0.14)] md:px-6">
        <Button
          variant="ghost"
          className="mb-3 -ml-2 h-9 bg-transparent text-sm text-[#C3D0E2] shadow-none hover:bg-white/10 hover:text-white"
          onClick={() => router.push("/tickets")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Kembali
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7047EB] shadow-[0_8px_20px_rgba(112,71,235,0.28)]">
            <Ticket className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.025em] text-white">
              Buat Tiket Baru
            </h1>
            <p className="mt-0.5 text-sm text-[#BDCCE0]">
              Berikan detail yang jelas agar tim dapat membantu lebih cepat
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden py-0">
        <div className="h-1 bg-[#7047EB]" />
        <CardContent className="space-y-5 p-5 md:p-7">
          <div className="flex flex-col gap-2 rounded-xl border border-[#DCE4EF] bg-[#F8FAFD] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#26334D]">Informasi permintaan</p>
              <p className="mt-0.5 text-xs text-[#71809A]">Kolom bertanda wajib perlu diisi sebelum tiket dikirim.</p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-[#EAF8F2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#168660]">Respons terpantau SLA</span>
          </div>
          {error && (
            <Alert
              variant="destructive"
              className="border-red-200 bg-red-50 text-red-800 rounded-xl"
            >
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {canCreateOnBehalf && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                  <User className="h-4 w-4 text-[#2563EB]" />
                  Dibuat Untuk (Opsional)
                </Label>
                <Select
                  value={onBehalfOfId}
                  onValueChange={(value) => setOnBehalfOfId(value || "")}
                >
                  <SelectTrigger aria-label="Dibuat untuk" className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#2563EB] w-full">
                    <SelectValue placeholder="Pilih user (default: diri sendiri)">
                      {users.find((u) => u.id === onBehalfOfId)?.name || (onBehalfOfId ? onBehalfOfId : "Diri Sendiri")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="min-w-[var(--radix-select-trigger-width)] !w-auto">
                    <SelectItem value="">Diri Sendiri</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                <Type className="h-4 w-4 text-[#2563EB]" />
                Judul
              </Label>
              <Input
                aria-label="Judul tiket"
                placeholder="Ringkasan masalah"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#2563EB]"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                  <FolderOpen className="h-4 w-4 text-[#2563EB]" />
                  Kategori
                </Label>
                <Select
                  value={parentCategoryId}
                  onValueChange={(value) => {
                    setParentCategoryId(value || "");
                    setSubCategoryId("");
                  }}
                >
                  <SelectTrigger aria-label="Kategori tiket" className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#2563EB] w-full">
                    <SelectValue placeholder="Pilih kategori">
                      {categories.find((c) => c.id === parentCategoryId)?.name || (parentCategoryId ? parentCategoryId : "Pilih kategori")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="min-w-[var(--radix-select-trigger-width)] !w-auto">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex flex-col">
                          <span>{cat.name}</span>
                          {cat.department && (
                            <span className="text-[10px] text-[#94A3B8]">
                              {cat.department}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                  <Flag className="h-4 w-4 text-[#F97316]" />
                  Prioritas
                </Label>
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value || "MEDIUM")}
                >
                  <SelectTrigger aria-label="Prioritas tiket" className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#2563EB] w-full">
                    <SelectValue>
                      {priorityConfig[priority]?.label || priority}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="min-w-[var(--radix-select-trigger-width)] !w-auto">
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span className={`inline-block h-2 w-2 rounded-full ${config.bg.replace("bg-", "bg-")} ${config.color.replace("text-", "bg-")}`} />
                          {config.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(() => {
              const parent = categories.find((c) => c.id === parentCategoryId);
              if (!parent || parent.children.length === 0) return null;
              return (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                    <FolderOpen className="h-4 w-4 text-[#2563EB]" />
                    Sub-Kategori
                    <span className="text-xs font-normal text-[#94A3B8]">(opsional)</span>
                  </Label>
                  <Select
                    value={subCategoryId}
                    onValueChange={(value) => setSubCategoryId(value || "")}
                  >
                    <SelectTrigger aria-label="Sub-kategori tiket" className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#2563EB] w-full">
                      <SelectValue placeholder="Pilih sub-kategori (opsional)">
                        {parent.children.find((c) => c.id === subCategoryId)?.name || "Pilih sub-kategori (opsional)"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="min-w-[var(--radix-select-trigger-width)] !w-auto">
                      <SelectItem value="">— Gunakan kategori utama —</SelectItem>
                      {parent.children.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                <FileText className="h-4 w-4 text-[#2563EB]" />
                Deskripsi
              </Label>
              <Textarea
                aria-label="Deskripsi tiket"
                placeholder="Jelaskan masalah secara detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#2563EB] resize-none"
                required
              />
            </div>

            {/* Lampiran */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                <Paperclip className="h-4 w-4 text-[#2563EB]" />
                Lampiran
                <span className="text-xs font-normal text-[#94A3B8]">(opsional, maks. 5 file)</span>
              </Label>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Drop zone */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-4 py-5 text-center transition-colors hover:border-[#2563EB] hover:bg-blue-50/40 active:bg-blue-50"
              >
                <Upload className="mx-auto mb-2 h-7 w-7 text-[#94A3B8]" />
                <p className="text-sm font-medium text-[#64748B]">
                  Pilih file atau ambil foto
                </p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  PNG, JPG, PDF, DOC, XLS — maks. 10MB per file
                </p>
              </button>

              {/* File list */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E2E8F0]">
                        <FileIcon mimeType={file.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#1E293B]">
                          {file.name}
                        </p>
                        <p className="text-xs text-[#94A3B8]">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="h-11 flex-1 bg-[#7047EB] text-sm font-bold text-white shadow-[0_8px_20px_rgba(112,71,235,0.20)] hover:bg-[#5F39DB]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {attachments.length > 0 ? "Mengupload..." : "Membuat..."}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Buat Tiket
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/tickets")}
                className="h-11 text-sm text-[#59667E]"
              >
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

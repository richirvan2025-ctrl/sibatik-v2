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
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
  Check,
  ChevronDown,
  Link as LinkIcon,
  CalendarClock,
  Users,
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

interface Assignee {
  id: string;
  name: string;
  role: string;
  department: string | null;
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
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [subCategoryId, setSubCategoryId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [onBehalfOfId, setOnBehalfOfId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [loadingAssignees, setLoadingAssignees] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamic fields state
  // NOTE: fitur dynamic-fields (getDynamicFieldConfig / DynamicFieldConfig) DINONAKTIFKAN
  // sementara — lib `@/lib/dynamic-field-config` tidak ada di master (dibuat di commit
  // sebelum a2cbde1, tidak ikut ter-cherry-pick). Type diganti `any` agar build aman.
  // dynamicFields selalu null sehingga blok render/validasi terkait menjadi inert.
  const [dynamicFields, setDynamicFields] = useState<any | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState({
    emailAktif: "",
    pinLaptop: "",
    softwareList: {
      standard: [] as string[],
      dkv: [] as string[],
      diArsitektur: [] as string[],
      desainMode: [] as string[],
      bdSti: [] as string[],
    },
  });

  const [attachmentType, setAttachmentType] = useState<'file' | 'link'>('file');
  const [attachmentLinks, setAttachmentLinks] = useState<string[]>([]);

  const role = session?.user?.role;
  const canCreateOnBehalf = role === "ADMIN" || role === "AGENT" || role === "SUPERVISOR";

  useEffect(() => {
    fetchCategories();
    if (canCreateOnBehalf) fetchUsers();
  }, [canCreateOnBehalf]);

  // Update dynamic fields when subcategory changes
  // NOTE: DINONAKTIFKAN SEMENTARA — getDynamicFieldConfig belum tersedia di master
  // (lib @/lib/dynamic-field-config tidak ikut ter-cherry-pick). dynamicFields dibiarkan null.
  useEffect(() => {
    // if (subCategoryId && selectedCategoryIds.length === 1 && role === "MAHASISWA") {
    //   const config = getDynamicFieldConfig(selectedCategoryIds[0], subCategoryId);
    //   setDynamicFields(config);
    // } else {
    //   setDynamicFields(null);
    // }
    setDynamicFields(null);
  }, [selectedCategoryIds, subCategoryId, role]);

  // Fetch assignees berdasarkan divisi dari kategori yang dipilih
  useEffect(() => {
    const departments = Array.from(
      new Set(
        selectedCategoryIds
          .map((id) => categories.find((c) => c.id === id)?.department)
          .filter((d): d is string => !!d)
      )
    );

    if (departments.length === 0) {
      setAssignees([]);
      setAssigneeId("");
      return;
    }

    let cancelled = false;
    setLoadingAssignees(true);
    fetch(`/api/users/assignees?departments=${encodeURIComponent(departments.join(","))}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Assignee[]) => {
        if (cancelled) return;
        setAssignees(data);
        // Reset pilihan jika assignee sebelumnya tidak ada di daftar baru
        setAssigneeId((prev) => (data.some((a) => a.id === prev) ? prev : ""));
      })
      .catch(() => {
        if (!cancelled) setAssignees([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAssignees(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryIds, categories]);

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

    if (selectedCategoryIds.length === 0) {
      setError("Pilih minimal 1 kategori terlebih dahulu");
      return;
    }

    // Validasi dynamic fields jika ada (hanya jika 1 kategori dipilih)
    // NOTE: dynamicFields selalu null untuk saat ini (lihat catatan di atas), blok inert.
    if (dynamicFields) {
      if (dynamicFields.fields.emailAktif.required && !customFieldValues.emailAktif) {
        setError("Email Aktif wajib diisi");
        return;
      }
      if (dynamicFields.fields.pinLaptop.required && !customFieldValues.pinLaptop) {
        setError("PIN/Sandi Laptop wajib diisi");
        return;
      }
      const totalSoftware = Object.values(customFieldValues.softwareList).flat().length;
      if (totalSoftware === 0) {
        setError("Pilih minimal 1 software yang akan diinstal");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      let uploadedAttachments: any[] = [];

      if (attachmentType === 'file' && attachments.length > 0) {
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
      } else if (attachmentType === 'link' && attachmentLinks.length > 0) {
        // Filter link kosong dan buat objek attachment link
        uploadedAttachments = attachmentLinks
          .filter(link => link.trim() !== '')
          .map(link => ({ type: 'link', url: link.trim(), name: link.trim() }));
      }

      // Buat 1 tiket untuk setiap kategori yang dipilih
      const ticketPromises = selectedCategoryIds.map(async (categoryId) => {
        const body: any = { title, description, categoryId, priority };
        if (deadline) body.deadline = new Date(deadline).toISOString();
        if (assigneeId) body.assignedToId = assigneeId;
        if (onBehalfOfId) body.onBehalfOfId = onBehalfOfId;
        if (uploadedAttachments.length > 0) body.attachments = uploadedAttachments;

        // Tambahkan custom fields jika ada (hanya untuk 1 kategori)
        if (dynamicFields && selectedCategoryIds.length === 1) {
          body.customFields = {
            emailAktif: customFieldValues.emailAktif,
            pinLaptop: customFieldValues.pinLaptop,
            softwareList: customFieldValues.softwareList,
          };
        }

        return fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      });

      const results = await Promise.all(ticketPromises);

      // Cek apakah ada yang gagal
      const failedResults = results.filter((res) => !res.ok);
      if (failedResults.length > 0) {
        const data = await failedResults[0].json();
        if (Array.isArray(data.error)) {
          setError(data.error.map((e: any) => e.message).join(", "));
        } else if (typeof data.error === "string") {
          setError(data.error);
        } else {
          setError("Gagal membuat beberapa tiket");
        }
      } else {
        router.push("/tickets");
        router.refresh();
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
                <Type className="h-4 w-4 text-[#7C3AED]" />
                Judul
              </Label>
              <Input
                aria-label="Judul tiket"
                placeholder="Ringkasan masalah"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED]"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                  <FolderOpen className="h-4 w-4 text-[#7C3AED]" />
                  Divisi Tujuan
                </Label>
                <div className="relative" ref={categoryDropdownRef}>
                  <input
                    type="text"
                    placeholder="Cari divisi tujuan..."
                    value={categorySearch}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setShowCategoryDropdown(true);
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm transition-colors focus:bg-white focus:border-[#7C3AED] focus:outline-none"
                  />
                  {showCategoryDropdown && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-[#E2E8F0] bg-white shadow-lg max-h-60 overflow-y-auto">
                      {categories
                        .filter((cat) =>
                          cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                          cat.department?.toLowerCase().includes(categorySearch.toLowerCase())
                        )
                        .map((cat) => {
                          const isSelected = selectedCategoryIds.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                if (!isSelected) {
                                  setSelectedCategoryIds((prev) => [...prev, cat.id]);
                                  setCategorySearch("");
                                }
                                setSubCategoryId("");
                              }}
                              disabled={isSelected}
                              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                                isSelected
                                  ? "bg-blue-50 opacity-60 cursor-not-allowed"
                                  : "hover:bg-[#F8FAFC] cursor-pointer"
                              }`}
                            >
                              <div
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                                  isSelected
                                    ? "border-[#7C3AED] bg-[#7C3AED]"
                                    : "border-[#94A3B8] bg-white"
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <span className="flex flex-col items-start">
                                <span className="text-[#1E293B]">{cat.name}</span>
                                {cat.department && (
                                  <span className="text-[10px] text-[#94A3B8]">
                                    {cat.department}
                                  </span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      {categories.filter((cat) =>
                        cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                        cat.department?.toLowerCase().includes(categorySearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-sm text-[#94A3B8] text-center">
                          Divisi tujuan tidak ditemukan
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Selected categories chips */}
                {selectedCategoryIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedCategoryIds.map((id) => {
                      const cat = categories.find((c) => c.id === id);
                      if (!cat) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-xs text-[#7C3AED]"
                        >
                          {cat.name}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategoryIds((prev) => prev.filter((cid) => cid !== id));
                              setSubCategoryId("");
                            }}
                            className="hover:text-red-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                  <Flag className="h-4 w-4 text-[#0EA5E9]" />
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

            {/* Assignees - muncul setelah divisi tujuan dipilih */}
            {selectedCategoryIds.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                  <Users className="h-4 w-4 text-[#7C3AED]" />
                  Assignees
                  <span className="text-xs font-normal text-[#94A3B8]">(opsional)</span>
                </Label>
                {loadingAssignees ? (
                  <div className="flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#94A3B8]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat daftar anggota divisi...
                  </div>
                ) : assignees.length === 0 ? (
                  <div className="flex h-10 items-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#94A3B8]">
                    Tidak ada anggota di divisi ini
                  </div>
                ) : (
                  <Select
                    value={assigneeId}
                    onValueChange={(value) => setAssigneeId(value || "")}
                  >
                    <SelectTrigger className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED] w-full">
                      <SelectValue placeholder="Pilih orang yang menangani (opsional)">
                        {assignees.find((a) => a.id === assigneeId)
                          ? `${assignees.find((a) => a.id === assigneeId)?.name}${
                              assignees.find((a) => a.id === assigneeId)?.department
                                ? ` — ${assignees.find((a) => a.id === assigneeId)?.department}`
                                : ""
                            }`
                          : "Pilih orang yang menangani (opsional)"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="min-w-[var(--radix-select-trigger-width)] !w-auto">
                      <SelectItem value="">— Otomatis (default) —</SelectItem>
                      {assignees.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <span className="flex flex-col items-start">
                            <span>{user.name}</span>
                            <span className="text-[10px] text-[#94A3B8]">
                              {user.role}
                              {user.department ? ` · ${user.department}` : ""}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-[#94A3B8]">
                  Daftar nama sesuai anggota divisi tujuan yang dipilih
                </p>
              </div>
            )}

            {(() => {
              // Only show sub-category when exactly 1 category is selected
              if (selectedCategoryIds.length !== 1) return null;
              const parent = categories.find((c) => c.id === selectedCategoryIds[0]);
              if (!parent || parent.children.length === 0) return null;
              return (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                    <FolderOpen className="h-4 w-4 text-[#7C3AED]" />
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

            {/* Dynamic Fields untuk Instalasi Software */}
            {/* NOTE: dynamicFields selalu null saat ini (lib dynamic-field-config belum ada), blok inert. */}
            {dynamicFields && (
              <div className="space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                    <Type className="h-4 w-4 text-[#7C3AED]" />
                    Email Aktif
                  </Label>
                  <Input
                    type="email"
                    placeholder="email@contoh.com"
                    value={customFieldValues.emailAktif}
                    onChange={(e) =>
                      setCustomFieldValues({ ...customFieldValues, emailAktif: e.target.value })
                    }
                    className="h-10 border-[#E2E8F0] bg-white rounded-xl text-sm focus:border-[#7C3AED]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                    <Type className="h-4 w-4 text-[#7C3AED]" />
                    PIN Laptop
                  </Label>
                  <Input
                    type="password"
                    placeholder="Masukkan PIN laptop"
                    value={customFieldValues.pinLaptop}
                    onChange={(e) =>
                      setCustomFieldValues({ ...customFieldValues, pinLaptop: e.target.value })
                    }
                    className="h-10 border-[#E2E8F0] bg-white rounded-xl text-sm focus:border-[#7C3AED]"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                    <Type className="h-4 w-4 text-[#7C3AED]" />
                    Software yang Diinstal
                  </Label>
                  {dynamicFields.fields.softwareCategories.map((category: any) => (
                    <div key={category.id} className="space-y-2">
                      <p className="text-xs font-semibold text-[#64748B] uppercase">
                        {category.label}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {category.options.map((sw: string) => (
                          <label
                            key={sw}
                            className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm hover:border-[#7C3AED] cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={customFieldValues.softwareList[
                                category.id as keyof typeof customFieldValues.softwareList
                              ]?.includes(sw)}
                              onChange={(e) => {
                                const categoryKey =
                                  category.id as keyof typeof customFieldValues.softwareList;
                                const currentList =
                                  customFieldValues.softwareList[categoryKey] || [];
                                const newList = e.target.checked
                                  ? [...currentList, sw]
                                  : currentList.filter((s) => s !== sw);
                                setCustomFieldValues({
                                  ...customFieldValues,
                                  softwareList: {
                                    ...customFieldValues.softwareList,
                                    [categoryKey]: newList,
                                  },
                                });
                              }}
                              className="rounded border-[#E2E8F0] text-[#7C3AED] focus:ring-[#7C3AED]"
                            />
                            <span className="text-[#1E293B]">{sw}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                <CalendarClock className="h-4 w-4 text-[#7C3AED]" />
                Deadline
                <span className="text-xs font-normal text-[#94A3B8]">(opsional)</span>
              </Label>
              <DateTimePicker
                value={deadline}
                onChange={setDeadline}
                min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)}
                placeholder="Pilih tanggal & jam deadline"
              />
              <p className="text-xs text-[#94A3B8]">
                Tanggal dan jam batas waktu penyelesaian yang diharapkan
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                <FileText className="h-4 w-4 text-[#7C3AED]" />
                Deskripsi
              </Label>
              <Textarea
                aria-label="Deskripsi tiket"
                placeholder="Jelaskan masalah secara detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED] resize-none"
                required
              />
            </div>

            {/* Lampiran */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                  <Paperclip className="h-4 w-4 text-[#7C3AED]" />
                  Lampiran
                  <span className="text-xs font-normal text-[#94A3B8]">(opsional, maks. 5)</span>
                </Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="attachmentType"
                      value="file"
                      checked={attachmentType === 'file'}
                      onChange={() => setAttachmentType('file')}
                      className="h-3.5 w-3.5 accent-[#7C3AED]"
                    />
                    <span className="text-xs text-[#64748B]">File</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="attachmentType"
                      value="link"
                      checked={attachmentType === 'link'}
                      onChange={() => setAttachmentType('link')}
                      className="h-3.5 w-3.5 accent-[#7C3AED]"
                    />
                    <span className="text-xs text-[#64748B]">Link</span>
                  </label>
                </div>
              </div>

              {attachmentType === 'file' ? (
                <>
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
                    className="w-full rounded-xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-4 py-5 text-center transition-colors hover:border-[#7C3AED] hover:bg-violet-50/40 active:bg-blue-50"
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
                </>
              ) : (
                <div className="space-y-2">
                  {attachmentLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 shrink-0 text-[#7C3AED]" />
                      <Input
                        type="url"
                        value={link}
                        onChange={(e) => {
                          const newLinks = [...attachmentLinks];
                          newLinks[idx] = e.target.value;
                          setAttachmentLinks(newLinks);
                        }}
                        placeholder="https://drive.google.com/..."
                        className="flex-1 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED]"
                      />
                      <button
                        type="button"
                        onClick={() => setAttachmentLinks(attachmentLinks.filter((_, i) => i !== idx))}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {attachmentLinks.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAttachmentLinks([...attachmentLinks, ""])}
                      className="w-full h-10 border-[#E2E8F0] text-[#64748B] rounded-xl text-sm"
                    >
                      + Tambah Link
                    </Button>
                  )}
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

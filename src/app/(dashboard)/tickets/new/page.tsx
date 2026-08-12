"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
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
  ArrowLeft,
  Send,
  FileText,
  Upload,
  X,
  ImageIcon,
  File,
  Check,
  Link as LinkIcon,
  Search,
  ChevronDown,
  Info,
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

interface DynamicFieldConfig {
  fields: {
    emailAktif: { required: boolean };
    pinLaptop: { required: boolean };
    softwareCategories: Array<{
      id: string;
      label: string;
      options: string[];
    }>;
  };
}

interface TicketRequestBody extends Record<string, unknown> {
  title: string;
  description: string;
  categoryId: string;
  priority: string;
}

const priorityConfig: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  LOW: { color: "text-slate-600", bg: "bg-slate-100", dot: "bg-slate-400", label: "Low - Rendah" },
  MEDIUM: { color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-400", label: "Medium - Sedang" },
  HIGH: { color: "text-orange-700", bg: "bg-orange-50", dot: "bg-orange-500", label: "High - Tinggi" },
  URGENT: { color: "text-red-700", bg: "bg-red-50", dot: "bg-red-500", label: "Urgent - Darurat" },
};

const fieldClassName =
  "h-11 scroll-mt-24 rounded-xl border border-[#E2E8F0] bg-white text-sm shadow-[var(--shadow-inset)] transition-[border-color,box-shadow,background-color] duration-200 focus-visible:border-[#7047EB] focus-visible:ring-0 focus-visible:shadow-[var(--shadow-focus)] data-[popup-open]:border-[#7047EB] data-[popup-open]:ring-0 data-[popup-open]:shadow-[var(--shadow-focus)] motion-reduce:transition-none";
const fieldLabelClassName = "text-[13px] font-bold text-[#26334D]";
const minimumDeadline = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 16);

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

function FormSection({
  number,
  title,
  children,
  isLast = false,
}: {
  number: number;
  title: string;
  children: ReactNode;
  isLast?: boolean;
}) {
  return (
    <section className="relative">
      <div className="flex items-center gap-3">
        <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#8B5CF6] bg-white text-sm font-bold text-[#7047EB] shadow-[inset_0_1px_0_rgba(255,255,255,0.90),0_4px_12px_rgba(112,71,235,0.16)]">
          {number}
        </span>
        <h2 className="text-base font-bold text-[#17223D]">{title}</h2>
      </div>
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute bottom-[-24px] left-[17px] top-10 hidden w-px bg-[#DCE3ED] sm:block"
        />
      )}
      <div className="mt-3 min-w-0 sm:ml-[56px]">{children}</div>
    </section>
  );
}

export default function NewTicketPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    category?: string;
    description?: string;
  }>({});

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
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
  const [dynamicFields] = useState<DynamicFieldConfig | null>(null);
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
    let cancelled = false;

    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Category[]) => {
        if (!cancelled) setCategories(data);
      })
      .catch((error) => console.error("Failed to fetch categories:", error));

    if (canCreateOnBehalf) {
      fetch("/api/users")
        .then((res) => (res.ok ? res.json() : []))
        .then((data: UserItem[]) => {
          if (!cancelled) setUsers(data.filter((user) => user.role === "USER"));
        })
        .catch((error) => console.error("Failed to fetch users:", error));
    }

    return () => {
      cancelled = true;
    };
  }, [canCreateOnBehalf]);

  // Update dynamic fields when subcategory changes
  // NOTE: DINONAKTIFKAN SEMENTARA — getDynamicFieldConfig belum tersedia di master
  // (lib @/lib/dynamic-field-config tidak ikut ter-cherry-pick). dynamicFields dibiarkan null.
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
      queueMicrotask(() => {
        setAssignees([]);
        setAssigneeId("");
        setLoadingAssignees(false);
      });
      return;
    }

    let cancelled = false;
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

  const clearFieldError = (field: "title" | "category" | "description") => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError((current) =>
      current === "Lengkapi kolom wajib yang masih kosong." ? "" : current
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextFieldErrors: {
      title?: string;
      category?: string;
      description?: string;
    } = {};

    if (!title.trim()) nextFieldErrors.title = "Judul tiket wajib diisi.";
    if (selectedCategoryIds.length === 0) {
      nextFieldErrors.category = "Pilih minimal satu divisi tujuan.";
    }
    if (!description.trim()) {
      nextFieldErrors.description = "Deskripsi request/masalah wajib diisi.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError("Lengkapi kolom wajib yang masih kosong.");

      const firstInvalid = nextFieldErrors.title
        ? titleInputRef.current
        : nextFieldErrors.category
          ? categoryInputRef.current
          : descriptionInputRef.current;

      firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => firstInvalid?.focus(), 250);
      return;
    }

    setFieldErrors({});

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
      let uploadedAttachments: Array<Record<string, unknown>> = [];

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
        const uploadData: unknown = await uploadRes.json();
        uploadedAttachments = Array.isArray(uploadData)
          ? uploadData.filter(
              (item): item is Record<string, unknown> =>
                typeof item === "object" && item !== null
            )
          : [];
      } else if (attachmentType === 'link' && attachmentLinks.length > 0) {
        // Filter link kosong dan buat objek attachment link
        uploadedAttachments = attachmentLinks
          .filter(link => link.trim() !== '')
          .map(link => ({ type: 'link', url: link.trim(), name: link.trim() }));
      }

      // Buat 1 tiket untuk setiap kategori yang dipilih
      const ticketPromises = selectedCategoryIds.map(async (categoryId) => {
        const body: TicketRequestBody = { title, description, categoryId, priority };
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
        const data: { error?: unknown } = await failedResults[0].json();
        if (Array.isArray(data.error)) {
          setError(
            data.error
              .map((item: unknown) => {
                if (typeof item === "string") return item;
                if (typeof item === "object" && item !== null && "message" in item) {
                  const message = (item as { message?: unknown }).message;
                  return typeof message === "string" ? message : "";
                }
                return "";
              })
              .filter(Boolean)
              .join(", ") || "Gagal membuat beberapa tiket"
          );
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
    <div className="mx-auto max-w-[1056px] space-y-4">
      <header className="relative px-1 pt-1 sm:px-6">
        <button
          type="button"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#64748B] transition-colors hover:text-[#44516A] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#7047EB]/15 sm:absolute sm:right-full sm:top-1 sm:mr-3 sm:mb-0"
          onClick={() => router.push("/tickets")}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#17223D] md:text-[30px]">
            Buat Tiket Baru
          </h1>
          <p className="mt-1 text-sm leading-6 text-[#64748B]">
            Berikan detail yang jelas agar divisi terkait dapat membantu Anda lebih cepat.
          </p>
        </div>
      </header>

      <Card variant="surface" className="overflow-hidden rounded-[14px] border-[#DDE5EF] py-0">
        <CardContent className="space-y-5 p-5 md:p-6">
          {error && (
            <Alert
              variant="destructive"
              aria-live="assertive"
              className="border-red-200 bg-red-50 text-red-800 rounded-xl"
            >
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormSection number={1} title="Detail Permintaan">
              <div className="space-y-4">
            {canCreateOnBehalf && (
              <div className="space-y-2">
                <Label className={fieldLabelClassName}>
                  Dibuat Untuk
                  <span className="ml-1 text-xs font-medium text-[#64748B]">(opsional)</span>
                </Label>
                <Select
                  value={onBehalfOfId}
                  onValueChange={(value) => setOnBehalfOfId(value || "")}
                >
                  <SelectTrigger aria-label="Dibuat untuk" className={`${fieldClassName} w-full`}>
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
              <Label htmlFor="ticket-title" className={fieldLabelClassName}>
                Judul Tiket <span className="text-[#E5484D]">*</span>
              </Label>
              <Input
                ref={titleInputRef}
                id="ticket-title"
                aria-label="Judul tiket"
                aria-describedby={fieldErrors.title ? "ticket-title-error" : undefined}
                aria-invalid={Boolean(fieldErrors.title)}
                aria-required="true"
                placeholder="Ringkasan request/masalah"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  clearFieldError("title");
                }}
                className={`${fieldClassName} ${fieldErrors.title ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/15" : ""}`}
                required
              />
              {fieldErrors.title && (
                <p id="ticket-title-error" className="text-xs font-medium text-red-600">
                  {fieldErrors.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ticket-category" className={fieldLabelClassName}>
                  Divisi Tujuan <span className="text-[#E5484D]">*</span>
                </Label>
                <div className="relative" ref={categoryDropdownRef}>
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#71809A]"
                  />
                  <input
                    ref={categoryInputRef}
                    id="ticket-category"
                    type="text"
                    placeholder="Cari divisi tujuan..."
                    value={categorySearch}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setShowCategoryDropdown(true);
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    aria-label="Divisi tujuan"
                    aria-required="true"
                    aria-expanded={showCategoryDropdown}
                    aria-controls="ticket-category-listbox"
                    aria-autocomplete="list"
                    aria-describedby={fieldErrors.category ? "ticket-category-error" : "ticket-category-help"}
                    aria-invalid={Boolean(fieldErrors.category)}
                    role="combobox"
                    className={`${fieldClassName} w-full px-9 outline-none ${fieldErrors.category ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/15" : ""}`}
                  />
                  <ChevronDown
                    aria-hidden="true"
                    className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71809A] transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`}
                  />
                  {showCategoryDropdown && (
                    <div
                      id="ticket-category-listbox"
                      role="listbox"
                      aria-label="Daftar divisi tujuan"
                      aria-multiselectable="true"
                      className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[#E2E8F0] bg-white py-1 shadow-[var(--shadow-overlay)]"
                    >
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
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                if (!isSelected) {
                                  setSelectedCategoryIds((prev) => [...prev, cat.id]);
                                  setLoadingAssignees(true);
                                  setCategorySearch("");
                                  clearFieldError("category");
                                }
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
                                  <span className="text-[10px] text-[#64748B]">
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
                        <div className="px-3 py-2 text-center text-sm text-[#64748B]">
                          Divisi tujuan tidak ditemukan
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {fieldErrors.category ? (
                  <p id="ticket-category-error" className="text-xs font-medium text-red-600">
                    {fieldErrors.category}
                  </p>
                ) : (
                  <p id="ticket-category-help" className="text-xs text-[#64748B]">
                    Ketik untuk melihat saran divisi. Anda dapat memilih lebih dari satu.
                  </p>
                )}
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
                            aria-label={`Hapus ${cat.name} dari divisi tujuan`}
                            onClick={() => {
                              const nextCategoryIds = selectedCategoryIds.filter((cid) => cid !== id);
                              setSelectedCategoryIds(nextCategoryIds);
                              if (nextCategoryIds.length === 0) {
                                setAssignees([]);
                                setAssigneeId("");
                                setLoadingAssignees(false);
                              } else {
                                setLoadingAssignees(true);
                              }
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
                <Label htmlFor="ticket-priority" className={fieldLabelClassName}>
                  Prioritas <span className="text-[#E5484D]">*</span>
                </Label>
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value || "MEDIUM")}
                >
                  <SelectTrigger id="ticket-priority" aria-label="Prioritas tiket" aria-required="true" className={`${fieldClassName} w-full`}>
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${priorityConfig[priority]?.dot || "bg-slate-400"}`} />
                        {priorityConfig[priority]?.label || priority}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="min-w-[var(--radix-select-trigger-width)] !w-auto">
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${config.dot}`} />
                          {config.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

              </div>
            </FormSection>

            <div className="border-t border-[#E4E9F1]" />

            <FormSection number={2} title="Waktu & Deskripsi">
              <div className="space-y-4">

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className={fieldLabelClassName}>
                  Deadline
                  <span className="ml-1 text-xs font-medium text-[#64748B]">(opsional)</span>
                </Label>
                <DateTimePicker
                  value={deadline}
                  onChange={setDeadline}
                  min={minimumDeadline}
                  placeholder="Pilih tanggal & jam deadline"
                  className={fieldClassName}
                />
              </div>

              {/* Assignees - muncul setelah divisi tujuan dipilih */}
              {selectedCategoryIds.length > 0 ? (
                <div className="space-y-2">
                  <Label className={fieldLabelClassName}>
                    Assignee
                    <span className="ml-1 text-xs font-medium text-[#64748B]">(opsional)</span>
                  </Label>
                  {loadingAssignees ? (
                    <div className="flex h-11 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#64748B] shadow-[var(--shadow-inset)]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memuat daftar anggota divisi...
                    </div>
                  ) : assignees.length === 0 ? (
                    <div className="flex h-11 items-center rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#64748B] shadow-[var(--shadow-inset)]">
                      Tidak ada anggota di divisi ini
                    </div>
                  ) : (
                    <Select
                      value={assigneeId}
                      onValueChange={(value) => setAssigneeId(value || "")}
                    >
                      <SelectTrigger className={`${fieldClassName} w-full`}>
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
                              <span className="text-[10px] text-[#64748B]">
                                {user.role}
                                {user.department ? ` · ${user.department}` : ""}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-[#64748B]">
                    Sesuai anggota divisi tujuan yang dipilih
                  </p>
                </div>
              ) : (
                <div className="flex min-h-11 items-start gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-[#59667E] shadow-[var(--shadow-inset)]">
                  <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#71809A]" />
                  <div className="space-y-0.5 text-xs leading-5">
                    <p className="font-semibold text-[#44516A]">
                      Tanggal dan jam batas waktu yang diharapkan.
                    </p>
                    <p>Kosongkan jika tidak ada batas waktu khusus.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Fields untuk Instalasi Software */}
            {/* NOTE: dynamicFields selalu null saat ini (lib dynamic-field-config belum ada), blok inert. */}
            {dynamicFields && (
              <div className="space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="space-y-2">
                  <Label className={fieldLabelClassName}>
                    Email Aktif <span className="text-[#E5484D]">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="email@contoh.com"
                    value={customFieldValues.emailAktif}
                    onChange={(e) =>
                      setCustomFieldValues({ ...customFieldValues, emailAktif: e.target.value })
                    }
                    className={fieldClassName}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className={fieldLabelClassName}>
                    PIN Laptop <span className="text-[#E5484D]">*</span>
                  </Label>
                  <Input
                    type="password"
                    placeholder="Masukkan PIN laptop"
                    value={customFieldValues.pinLaptop}
                    onChange={(e) =>
                      setCustomFieldValues({ ...customFieldValues, pinLaptop: e.target.value })
                    }
                    className={fieldClassName}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className={fieldLabelClassName}>
                    Software yang Diinstal <span className="text-[#E5484D]">*</span>
                  </Label>
                  {dynamicFields.fields.softwareCategories.map((category) => (
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
              <Label htmlFor="ticket-description" className={fieldLabelClassName}>
                Deskripsi <span className="text-[#E5484D]">*</span>
              </Label>
              <Textarea
                ref={descriptionInputRef}
                id="ticket-description"
                aria-label="Deskripsi tiket"
                aria-describedby={fieldErrors.description ? "ticket-description-error" : "ticket-description-help"}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-required="true"
                placeholder="Jelaskan request/masalah secara detail…"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearFieldError("description");
                }}
                rows={4}
                className={`min-h-24 scroll-mt-24 resize-none border-[#E2E8F0] bg-white text-sm focus-visible:border-[#7047EB] focus-visible:ring-3 focus-visible:ring-[#7047EB]/15 ${fieldErrors.description ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/15" : ""}`}
                required
              />
              {fieldErrors.description ? (
                <p id="ticket-description-error" className="text-xs font-medium text-red-600">
                  {fieldErrors.description}
                </p>
              ) : (
                <p id="ticket-description-help" className="text-xs text-[#64748B]">
                  Sertakan konteks, dampak, dan hasil yang Anda harapkan.
                </p>
              )}
            </div>

              </div>
            </FormSection>

            <div className="border-t border-[#E4E9F1]" />

            <FormSection number={3} title="Lampiran" isLast>

            {/* Lampiran */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className={fieldLabelClassName}>
                  Lampiran
                  <span className="ml-1 text-xs font-medium text-[#64748B]">(opsional, maks. 5)</span>
                </Label>
                <div className="flex items-center gap-3">
                  <label className="-my-2 flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 transition-colors hover:bg-[#F5F2FF]">
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
                  <label className="-my-2 flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 transition-colors hover:bg-[#F5F2FF]">
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
                    className="group flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-5 py-4 text-center shadow-[var(--shadow-inset)] transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#A995EE] hover:bg-[#F7F5FF] hover:shadow-[var(--shadow-raised)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[var(--shadow-focus)] motion-reduce:transform-none motion-reduce:transition-none sm:flex-row sm:text-left"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEE9FF] text-[#7047EB] ring-1 ring-[#DDD4FA] transition-colors group-hover:bg-[#7047EB] group-hover:text-white">
                      <Upload className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-[#34415A]">Tambahkan file pendukung</span>
                      <span className="mt-1 block text-xs text-[#64748B]">PNG, JPG, PDF, DOC, XLS · maks. 10MB per file</span>
                    </span>
                    <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#D6CCF7] bg-white px-3.5 text-xs font-bold text-[#7047EB] shadow-sm transition-colors group-hover:border-[#7047EB] group-hover:bg-[#7047EB] group-hover:text-white">
                      Pilih File
                    </span>
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
                            <p className="text-xs text-[#64748B]">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            aria-label={`Hapus lampiran ${file.name}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#71809A] transition-colors hover:bg-red-50 hover:text-red-500"
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
                        className={`flex-1 ${fieldClassName}`}
                      />
                      <button
                        type="button"
                        onClick={() => setAttachmentLinks(attachmentLinks.filter((_, i) => i !== idx))}
                        aria-label={`Hapus tautan lampiran ${idx + 1}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#71809A] transition-colors hover:bg-red-50 hover:text-red-500"
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

            </FormSection>

            <div className="sticky bottom-0 z-20 -mx-5 -mb-5 flex flex-col-reverse gap-3 border-t border-[#E4E9F1] bg-white/95 px-5 py-5 shadow-[0_-10px_26px_rgba(29,43,76,0.08)] backdrop-blur-sm sm:flex-row sm:justify-end md:-mx-6 md:-mb-6 md:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/tickets")}
                className="h-11 w-full rounded-xl border-[#D7DFEA] bg-white px-5 text-sm font-semibold text-[#59667E] shadow-none hover:bg-[#F8FAFC] hover:text-[#34415A] sm:min-w-[132px] sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-[#7047EB] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(112,71,235,0.20)] transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#5F39DB] hover:shadow-[0_10px_24px_rgba(112,71,235,0.26)] active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none sm:min-w-[148px] sm:w-auto"
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

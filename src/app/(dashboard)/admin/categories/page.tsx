"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Settings,
  FolderOpen,
  FileText,
  Building,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const DEPARTMENTS = [
  "BAA/Akademik",
  "Keuangan",
  "Marketing",
  "Kerjasama",
  "HRD/Kepegawaian",
  "Operasional",
  "DCC",
  "Penjamin Mutu",
  "Sistem Informasi & IT Support",
  "Prodi DKV",
  "Prodi Desain Interior",
  "Prodi Desain Mode",
  "Prodi Arsitektur",
  "Prodi Bisnis Digital",
  "Prodi STI",
  "Prodi Manajemen Retail",
  "Prodi MBD",
  "Prodi MDS",
  "LKTI (Litbang Kerjasama & Terapan Inovasi)",
  "Kesekretariatan, Tata Usaha, dan Administrasi Umum ( KTA )",
  "Branding Humas dan Kerjasama",
  "Rektorat",
];

interface SubCategory {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  isActive: boolean;
  parentId: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  isActive: boolean;
  parentId: string | null;
  children: SubCategory[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | SubCategory | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [parentId, setParentId] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Category | SubCategory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body: Record<string, unknown> = {
        name,
        description,
        department: department || null,
        parentId: parentId || null,
      };

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingCategory ? "Kategori diperbarui" : "Kategori ditambahkan");
        setDialogOpen(false);
        resetForm();
        fetchCategories();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menyimpan kategori");
      }
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error("Terjadi kesalahan");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setDepartment("");
    setParentId("");
    setEditingCategory(null);
  };

  const openEdit = (category: Category | SubCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setDepartment(category.department || "");
    setParentId(category.parentId || "");
    setDialogOpen(true);
  };

  const openAddSubcategory = (parentCategory: Category) => {
    resetForm();
    setParentId(parentCategory.id);
    setDepartment(parentCategory.department || "");
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Kategori berhasil dihapus");
        setDeleteTarget(null);
        fetchCategories();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus kategori");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setDeleteLoading(false);
    }
  };

  const editingIsParent =
    editingCategory
      ? "children" in editingCategory && (editingCategory as Category).children?.length > 0
      : false;

  const selectedParent = categories.find((c) => c.id === parentId);

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
            Kategori
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Kelola kategori tiket
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger render={<Button className="h-10 bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md shadow-[#7C3AED]/25 transition-all duration-200 rounded-xl text-sm font-semibold" />}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kategori
          </DialogTrigger>
          <DialogContent className="border border-[#E2E8F0] shadow-xl rounded-xl">
            <div className="h-1 bg-[#7C3AED] rounded-t-lg -mt-6 mx-6" />
            <DialogHeader className="pt-2">
              <DialogTitle className="text-lg font-bold text-[#1E293B]">
                {editingCategory
                  ? `Edit ${editingCategory.parentId ? "Subkategori" : "Kategori"}`
                  : parentId
                  ? "Tambah Subkategori"
                  : "Tambah Kategori Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingIsParent && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                    <FolderOpen className="h-4 w-4 text-[#7C3AED]" />
                    Kategori Induk
                    <span className="text-xs font-normal text-[#94A3B8]">(kosongkan untuk kategori utama)</span>
                  </Label>
                  <Select
                    value={parentId}
                    onValueChange={(value) => {
                      setParentId(value || "");
                      if (value) {
                        const parent = categories.find((c) => c.id === value);
                        if (parent?.department) setDepartment(parent.department);
                      }
                    }}
                  >
                    <SelectTrigger className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED]">
                      <SelectValue placeholder="Tidak ada (kategori utama)">
                        {selectedParent ? selectedParent.name : "Tidak ada (kategori utama)"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tidak ada (kategori utama)</SelectItem>
                      {categories
                        .filter((c) => c.id !== editingCategory?.id)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {selectedParent && (
                    <p className="text-xs text-[#94A3B8]">
                      Subkategori dari:{" "}
                      <span className="font-medium text-[#64748B]">{selectedParent.name}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                  <Settings className="h-4 w-4 text-[#7C3AED]" />
                  Nama {parentId ? "Subkategori" : "Kategori"}
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                  <FileText className="h-4 w-4 text-[#7C3AED]" />
                  Detail / Deskripsi
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Registrasi semester, pengambilan/perubahan mata kuliah"
                  className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED]"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                  <Building className="h-4 w-4 text-[#7C3AED]" />
                  Divisi Penanganan
                  {parentId && <span className="text-xs font-normal text-[#94A3B8]">(dari kategori induk)</span>}
                </Label>
                <Select
                  value={department}
                  onValueChange={(value) => setDepartment(value || "")}
                >
                  <SelectTrigger className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED]">
                    <SelectValue placeholder="Pilih divisi (opsional)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 w-[320px]">
                    <SelectItem value="" className="whitespace-normal">Tidak ada (IT/Umum)</SelectItem>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d} className="whitespace-normal">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full h-10 bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md rounded-xl text-sm font-semibold"
              >
                {editingCategory ? "Update" : "Tambah"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Table */}
      <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="h-1 bg-[#7C3AED]" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-center py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider w-12">
                  No.
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider w-44">
                  Kategori
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider w-48">
                  Sub Kategori
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Detail
                </th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider w-20">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.flatMap((category, catIndex) => {
                const rowCount = Math.max(category.children.length, 1);

                if (category.children.length === 0) {
                  return [
                    <tr
                      key={category.id}
                      className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-sm font-semibold text-[#94A3B8] align-middle">
                        {catIndex + 1}
                      </td>
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                            <Settings className="h-3.5 w-3.5 text-[#7C3AED]" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#1E293B] text-sm leading-tight">
                              {category.name}
                            </p>
                            {category.department && (
                              <p className="text-[10px] text-[#94A3B8] mt-0.5">{category.department}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#94A3B8] align-middle">—</td>
                      <td className="py-3 px-4 text-sm text-[#64748B] align-middle">
                        {category.description || "—"}
                      </td>
                      <td className="py-3 px-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAddSubcategory(category)}
                            className="h-8 w-8 p-0 text-[#94A3B8] hover:text-[#7C3AED] hover:bg-violet-50 rounded-lg"
                            title="Tambah subkategori"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(category)}
                            className="h-8 w-8 p-0 text-[#64748B] hover:text-[#7C3AED] hover:bg-violet-50 rounded-lg"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(category)}
                            className="h-8 w-8 p-0 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>,
                  ];
                }

                return category.children.map((sub, subIndex) => (
                  <tr
                    key={sub.id}
                    className={`border-b border-[#F1F5F9] transition-colors ${
                      subIndex % 2 === 0 ? "hover:bg-[#F8FAFC]" : "bg-[#FAFBFC] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    {subIndex === 0 && (
                      <td
                        rowSpan={rowCount}
                        className="py-3 px-4 text-center text-sm font-semibold text-[#94A3B8] align-middle border-r border-[#F1F5F9]"
                      >
                        {catIndex + 1}
                      </td>
                    )}
                    {subIndex === 0 && (
                      <td
                        rowSpan={rowCount}
                        className="py-3 px-4 align-top border-r border-[#F1F5F9]"
                      >
                        <div className="flex items-start gap-2 pt-0.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 mt-0.5">
                            <Settings className="h-3.5 w-3.5 text-[#7C3AED]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1E293B] text-sm leading-tight">
                              {category.name}
                            </p>
                            {category.department && (
                              <p className="text-[10px] text-[#94A3B8] mt-0.5">{category.department}</p>
                            )}
                            <div className="flex gap-1 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAddSubcategory(category)}
                                className="h-6 px-2 text-[10px] text-[#94A3B8] hover:text-[#7C3AED] hover:bg-violet-50 rounded-md font-normal"
                                title="Tambah subkategori"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Tambah
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(category)}
                                className="h-6 px-2 text-[10px] text-[#94A3B8] hover:text-[#7C3AED] hover:bg-violet-50 rounded-md font-normal"
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="py-3 px-4 align-middle">
                      <p className="text-sm font-medium text-[#334155]">{sub.name}</p>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <p className="text-sm text-[#64748B] leading-relaxed">
                        {sub.description || <span className="text-[#CBD5E1]">—</span>}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right align-middle">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(sub as unknown as Category)}
                          className="h-8 w-8 p-0 text-[#64748B] hover:text-[#7C3AED] hover:bg-violet-50 rounded-lg"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(sub)}
                          className="h-8 w-8 p-0 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Settings className="h-12 w-12 text-[#E2E8F0] mb-3" />
            <p className="text-[#64748B] font-medium text-sm">Tidak ada kategori ditemukan</p>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="border border-[#E2E8F0] shadow-xl rounded-xl p-0 gap-0 overflow-hidden sm:max-w-md">
          <div className="h-1 bg-red-500" />
          <div className="p-5 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Hapus Kategori
              </DialogTitle>
            </DialogHeader>
            {deleteTarget && (
              <div className="space-y-4">
                <p className="text-sm text-[#64748B]">
                  Apakah Anda yakin ingin menghapus kategori{" "}
                  <span className="font-semibold text-[#1E293B]">{deleteTarget.name}</span>?
                  {deleteTarget.parentId && (
                    <span className="block mt-1">Ini adalah subkategori.</span>
                  )}
                </p>
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteTarget(null)}
                    className="h-10 rounded-xl text-sm font-semibold border-[#E2E8F0] text-[#64748B]"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                  >
                    {deleteLoading ? "Menghapus..." : "Hapus"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

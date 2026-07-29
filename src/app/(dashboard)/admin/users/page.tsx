"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  UserCheck,
  UserX,
  Users,
  Shield,
  Wrench,
  Search,
  Mail,
  Building,
  Building2,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string | null;
  role: string;
  department: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  department: string | null;
  parentId: string | null;
}

const roleConfig: Record<
  string,
  { bg: string; text: string; icon: React.ElementType; label: string }
> = {
  ADMIN: { bg: "bg-blue-50", text: "text-blue-700", icon: Shield, label: "Admin" },
  AGENT: { bg: "bg-orange-50", text: "text-orange-700", icon: Wrench, label: "Agent" },
  USER: { bg: "bg-slate-100", text: "text-slate-600", icon: Users, label: "User" },
  SUPERVISOR: { bg: "bg-purple-50", text: "text-purple-700", icon: Building, label: "Supervisor" },
  EXECUTIVE: { bg: "bg-indigo-50", text: "text-indigo-700", icon: Building2, label: "Eksekutif" },
  MAHASISWA: { bg: "bg-cyan-50", text: "text-cyan-700", icon: Users, label: "Mahasiswa" },
};

interface DeleteBlockDetails {
  createdTickets: number;
  assignedTickets: number;
  ownedTickets: number;
  comments: number;
  attachments: number;
  kbArticles: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBlockDetails, setDeleteBlockDetails] =
    useState<DeleteBlockDetails | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [department, setDepartment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch((error) => console.error("Failed to fetch users:", error))
      .finally(() => setLoading(false));

    fetch("/api/admin/categories")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      const body = { name, email, role, department };

      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : "/api/admin/users";
      const method = editingUser ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setDialogOpen(false);
        resetForm();
        fetchUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data.error || `HTTP ${res.status}`;
        console.error("Update failed:", { status: res.status, data });
        setFormError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }
    } catch (error) {
      console.error("Failed to save user:", error);
      setFormError("Terjadi kesalahan jaringan");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error("Failed to toggle user:", error);
    }
  };

  const openDeleteDialog = (user: User) => {
    setDeleteTarget(user);
    setDeleteError(null);
    setDeleteBlockDetails(null);
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteError(null);
    setDeleteBlockDetails(null);
    setDeleteLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      setDeleteBlockDetails(null);

      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        closeDeleteDialog();
        fetchUsers();
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.details) {
        setDeleteBlockDetails(data.details);
        setDeleteError(data.error || "User tidak bisa dihapus");
      } else {
        setDeleteError(data.error || "Gagal menghapus user");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      setDeleteError("Terjadi kesalahan jaringan");
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("USER");
    setDepartment("");
    setEditingUser(null);
    setFormError(null);
    setFormLoading(false);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email || "");
    setRole(user.role);
    setDepartment(user.department || "");
    setDialogOpen(true);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">
            Manajemen User
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Kelola pengguna sistem</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger render={<Button className="h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-blue-200 transition-all duration-200 rounded-xl text-sm font-semibold" />}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah User
          </DialogTrigger>
          <DialogContent className="border border-[#E2E8F0] shadow-xl rounded-xl">
            <div className="h-1 bg-[#2563EB] rounded-t-lg -mt-6 mx-6" />
            <DialogHeader className="pt-2">
              <DialogTitle className="text-lg font-bold text-[#1E293B]">
                {editingUser ? "Edit User" : "Tambah User Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1E293B]">Nama</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#2563EB]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1E293B]">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#2563EB]"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1E293B]">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value || "USER")}>
                  <SelectTrigger className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#2563EB]">
                    <SelectValue>
                      {roleConfig[role as keyof typeof roleConfig]?.label || role}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="EXECUTIVE">Eksekutif</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    <SelectItem value="AGENT">Agent</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="MAHASISWA">Mahasiswa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1E293B]">Divisi</Label>
                <Select value={department} onValueChange={(value) => setDepartment(value || "")}>
                  <SelectTrigger className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#2563EB]">
                    <SelectValue placeholder="Pilih divisi" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 min-w-[280px]">
                    <SelectItem value="BAA/Akademik">BAA/Akademik</SelectItem>
                    <SelectItem value="Keuangan">Keuangan</SelectItem>
                    <SelectItem value="Kemahasiswaan">Kemahasiswaan</SelectItem>
                    <SelectItem value="LP2M">LP2M</SelectItem>
                    <SelectItem value="Humas & Marketing">Humas & Marketing</SelectItem>
                    <SelectItem value="Kerjasama">Kerjasama</SelectItem>
                    <SelectItem value="HRD/Kepegawaian">HRD/Kepegawaian</SelectItem>
                    <SelectItem value="Operasional dan Security">Operasional dan Security</SelectItem>
                    <SelectItem value="Perpustakaan">Perpustakaan</SelectItem>
                    <SelectItem value="Digital Communication">Digital Communication</SelectItem>
                    <SelectItem value="Penjamin Mutu">Penjamin Mutu</SelectItem>
                    <SelectItem value="Sistem Informasi & IT Support">Sistem Informasi & IT Support</SelectItem>
                    <SelectItem value="Prodi DKV">Prodi DKV</SelectItem>
                    <SelectItem value="Prodi Desain Interior">Prodi Desain Interior</SelectItem>
                    <SelectItem value="Prodi Desain Mode">Prodi Desain Mode</SelectItem>
                    <SelectItem value="Prodi Arsitektur">Prodi Arsitektur</SelectItem>
                    <SelectItem value="Prodi Bisnis Digital">Prodi Bisnis Digital</SelectItem>
                    <SelectItem value="Prodi STI">Prodi STI</SelectItem>
                    <SelectItem value="Prodi Manajemen Retail">Prodi Manajemen Retail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                disabled={formLoading}
                className="w-full h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {formLoading ? "Menyimpan..." : editingUser ? "Update" : "Tambah"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
        <Input
          placeholder="Cari user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 border-[#E2E8F0] bg-white rounded-xl text-sm focus:border-[#2563EB]"
        />
      </div>

      {/* Users Table */}
      <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="h-1 bg-[#2563EB]" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  User
                </th>
                <th className="text-left py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Divisi
                </th>
                <th className="text-left py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Kategori
                </th>
                <th className="text-center py-3 px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right py-3 px-5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const roleCfg = roleConfig[user.role] || roleConfig.USER;
                const RoleIcon = roleCfg.icon;
                return (
                  <tr
                    key={user.id}
                    className={`border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors ${
                      !user.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${roleCfg.bg}`}
                        >
                          <RoleIcon className={`h-4 w-4 ${roleCfg.text}`} />
                        </div>
                        <div>
                          <p className="font-medium text-[#1E293B] text-sm">
                            {user.name}
                          </p>
                          <p className="text-xs text-[#94A3B8]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleCfg.bg} ${roleCfg.text}`}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {roleCfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#64748B]">
                      {user.department ? (
                        <span className="flex items-center gap-1 text-xs">
                          <Building className="h-3 w-3" />
                          {user.department}
                        </span>
                      ) : (
                        <span className="text-xs text-[#94A3B8]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {user.department ? (
                        <div className="flex flex-wrap gap-1">
                          {categories
                            .filter(c => c.parentId === null && c.department === user.department)
                            .map(c => (
                              <span key={c.id} className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                {c.name}
                              </span>
                            ))}
                          {categories.filter(c => c.parentId === null && c.department === user.department).length === 0 && (
                            <span className="text-xs text-[#94A3B8]">-</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[#94A3B8]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          user.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(user)}
                          className="h-8 w-8 p-0 text-[#64748B] hover:text-[#2563EB]"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(user)}
                          className={`h-8 w-8 p-0 ${
                            user.isActive
                              ? "text-[#64748B] hover:text-red-600"
                              : "text-[#64748B] hover:text-emerald-600"
                          }`}
                          title={user.isActive ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {user.isActive ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(user)}
                          className="h-8 w-8 p-0 text-[#64748B] hover:text-red-600"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-[#E2E8F0] mb-3" />
            <p className="text-[#64748B] font-medium text-sm">
              Tidak ada user ditemukan
            </p>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <DialogContent className="border border-[#E2E8F0] shadow-xl rounded-xl">
          <div className="h-1 bg-red-500 rounded-t-lg -mt-6 mx-6" />
          <DialogHeader className="pt-2">
            <DialogTitle className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Hapus User
            </DialogTitle>
          </DialogHeader>

          {deleteTarget && (
            <div className="space-y-4">
              <p className="text-sm text-[#64748B]">
                Apakah Anda yakin ingin menghapus user{" "}
                <span className="font-semibold text-[#1E293B]">
                  {deleteTarget.name}
                </span>{" "}
                <span className="text-[#94A3B8]">({deleteTarget.email})</span>?
              </p>

              {deleteBlockDetails ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700 mb-2">
                    Tidak bisa dihapus
                  </p>
                  <p className="text-xs text-red-600 mb-3">
                    User ini masih memiliki data berikut:
                  </p>
                  <ul className="text-xs text-red-700 space-y-1">
                    {deleteBlockDetails.createdTickets > 0 && (
                      <li>• {deleteBlockDetails.createdTickets} tiket dibuat</li>
                    )}
                    {deleteBlockDetails.assignedTickets > 0 && (
                      <li>
                        • {deleteBlockDetails.assignedTickets} tiket di-assign
                      </li>
                    )}
                    {deleteBlockDetails.ownedTickets > 0 && (
                      <li>
                        • {deleteBlockDetails.ownedTickets} tiket on-behalf
                      </li>
                    )}
                    {deleteBlockDetails.comments > 0 && (
                      <li>• {deleteBlockDetails.comments} komentar</li>
                    )}
                    {deleteBlockDetails.attachments > 0 && (
                      <li>• {deleteBlockDetails.attachments} attachment</li>
                    )}
                    {deleteBlockDetails.kbArticles > 0 && (
                      <li>
                        • {deleteBlockDetails.kbArticles} artikel knowledge base
                      </li>
                    )}
                  </ul>
                  <p className="text-xs text-red-600 mt-3">
                    Gunakan tombol nonaktifkan{" "}
                    <UserX className="inline h-3 w-3" /> untuk menonaktifkan
                    user tanpa kehilangan data.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-700">
                    Aksi ini tidak dapat dibatalkan. User akan dihapus permanen
                    dari sistem.
                  </p>
                </div>
              )}

              {deleteError && !deleteBlockDetails && (
                <p className="text-xs text-red-600">{deleteError}</p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={closeDeleteDialog}
                  className="h-10 rounded-xl text-sm font-semibold border-[#E2E8F0] text-[#64748B]"
                >
                  Batal
                </Button>
                {!deleteBlockDetails && (
                  <Button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                  >
                    {deleteLoading ? "Menghapus..." : "Hapus"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

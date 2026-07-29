"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  UsersRound,
  Search,
  X,
  AlertTriangle,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Building,
} from "lucide-react";

interface GroupMemberUser {
  id: string;
  name: string;
  email: string | null;
  role: string;
  department: string | null;
  isActive: boolean;
}

interface GroupMember {
  id: string;
  userId: string;
  user: GroupMemberUser;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  members: GroupMember[];
}

interface UserOption {
  id: string;
  name: string;
  email: string | null;
  role: string;
  department: string | null;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // Create/edit group dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete group dialog
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Add member dialog
  const [memberDialogGroup, setMemberDialogGroup] = useState<Group | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setAllUsers(
            data.map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              department: u.department,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/admin/groups");
      if (res.ok) setGroups(await res.json());
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingGroup(null);
    setGroupName("");
    setGroupDescription("");
    setFormError(null);
    setFormLoading(false);
  };

  const openEdit = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || "");
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      const url = editingGroup
        ? `/api/admin/groups/${editingGroup.id}`
        : "/api/admin/groups";
      const method = editingGroup ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription || undefined,
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        resetForm();
        fetchGroups();
      } else {
        const data = await res.json().catch(() => ({}));
        setFormError(
          typeof data.error === "string" ? data.error : "Gagal menyimpan group"
        );
      }
    } catch {
      setFormError("Terjadi kesalahan jaringan");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        fetchGroups();
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openMemberDialog = (group: Group) => {
    setMemberDialogGroup(group);
    setMemberSearch("");
    setSelectedUserIds([]);
  };

  const handleAddMembers = async () => {
    if (!memberDialogGroup || selectedUserIds.length === 0) return;
    setMemberLoading(true);
    try {
      const res = await fetch(
        `/api/admin/groups/${memberDialogGroup.id}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: selectedUserIds }),
        }
      );
      if (res.ok) {
        setMemberDialogGroup(null);
        setSelectedUserIds([]);
        fetchGroups();
      }
    } catch (error) {
      console.error("Failed to add members:", error);
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    try {
      const res = await fetch(
        `/api/admin/groups/${groupId}/members?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      if (res.ok) fetchGroups();
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  // Kandidat anggota: user yang belum jadi anggota group + cocok pencarian
  const candidateUsers = memberDialogGroup
    ? allUsers.filter((u) => {
        const alreadyMember = memberDialogGroup.members.some(
          (m) => m.userId === u.id
        );
        if (alreadyMember) return false;
        const q = memberSearch.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.department || "").toLowerCase().includes(q)
        );
      })
    : [];

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
            Group User
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Kelola group pengguna (misal: ALL KAPRODI, ALL KABAG)
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="h-10 bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md shadow-[#7C3AED]/25 transition-all duration-200 rounded-xl text-sm font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Group
        </Button>
      </div>

      {/* Group list */}
      <div className="space-y-4">
        {groups.map((group) => {
          const expanded = expandedGroupId === group.id;
          return (
            <Card
              key={group.id}
              className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden"
            >
              <div className="h-1 bg-[#7C3AED]" />
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedGroupId(expanded ? null : group.id)
                    }
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF]">
                      <UsersRound className="h-5 w-5 text-[#7C3AED]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#1E293B] text-sm">
                          {group.name}
                        </p>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 text-[11px]"
                        >
                          {group.members.length} anggota
                        </Badge>
                      </div>
                      {group.description && (
                        <p className="text-xs text-[#94A3B8] mt-0.5 truncate">
                          {group.description}
                        </p>
                      )}
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-4 w-4 text-[#94A3B8] shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#94A3B8] shrink-0" />
                    )}
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openMemberDialog(group)}
                      className="h-8 px-2.5 text-[#7C3AED] hover:bg-[#EFF6FF] text-xs font-semibold"
                      title="Tambah Anggota"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add User
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(group)}
                      className="h-8 w-8 p-0 text-[#64748B] hover:text-[#7C3AED]"
                      title="Edit Group"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(group)}
                      className="h-8 w-8 p-0 text-[#64748B] hover:text-red-600"
                      title="Hapus Group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Members */}
                {expanded && (
                  <div className="mt-4 border-t border-[#F1F5F9] pt-4">
                    {group.members.length === 0 ? (
                      <div className="flex flex-col items-center py-6 text-center">
                        <Users className="h-8 w-8 text-[#E2E8F0] mb-2" />
                        <p className="text-sm text-[#94A3B8]">
                          Belum ada anggota. Klik &quot;Add User&quot; untuk
                          menambahkan.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {group.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#7C3AED] text-[11px] font-bold">
                              {member.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[#1E293B] truncate">
                                {member.user.name}
                                {!member.user.isActive && (
                                  <span className="ml-1 text-[10px] text-red-500">
                                    (nonaktif)
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-[#94A3B8] truncate flex items-center gap-1">
                                {member.user.department && (
                                  <>
                                    <Building className="h-3 w-3" />
                                    {member.user.department} ·
                                  </>
                                )}
                                {member.user.role}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveMember(group.id, member.userId)
                              }
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-red-50 hover:text-red-500"
                              title="Keluarkan dari group"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {groups.length === 0 && (
          <Card className="border border-[#E2E8F0] bg-white rounded-xl">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UsersRound className="h-12 w-12 text-[#E2E8F0] mb-3" />
              <p className="text-[#64748B] font-medium text-sm">
                Belum ada group. Klik &quot;Tambah Group&quot; untuk membuat.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Create/Edit Group Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="border border-[#E2E8F0] shadow-xl rounded-xl p-0 gap-0 overflow-hidden sm:max-w-md">
          <div className="h-1 bg-[#7C3AED]" />
          <div className="p-5 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#1E293B]">
                {editingGroup ? "Edit Group" : "Tambah Group Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1E293B]">
                  Nama Group
                </Label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="contoh: ALL KAPRODI"
                  className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1E293B]">
                  Deskripsi{" "}
                  <span className="text-xs font-normal text-[#94A3B8]">
                    (opsional)
                  </span>
                </Label>
                <Input
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="contoh: Semua Ketua Program Studi"
                  className="h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED]"
                />
              </div>
              <Button
                type="submit"
                disabled={formLoading}
                className="w-full h-10 bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {formLoading
                  ? "Menyimpan..."
                  : editingGroup
                  ? "Update"
                  : "Tambah"}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Members Dialog */}
      <Dialog
        open={memberDialogGroup !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMemberDialogGroup(null);
            setSelectedUserIds([]);
          }
        }}
      >
        <DialogContent className="border border-[#E2E8F0] shadow-xl rounded-xl p-0 gap-0 overflow-hidden w-full sm:max-w-lg">
          <div className="h-1 bg-[#7C3AED]" />
          <div className="p-5 space-y-3">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#1E293B]">
                Add User ke {memberDialogGroup?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <Input
                placeholder="Cari nama, email, atau divisi..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-10 h-10 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED]"
              />
            </div>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
              {candidateUsers.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-[#94A3B8]">
                  {memberSearch
                    ? "User tidak ditemukan"
                    : "Semua user sudah menjadi anggota"}
                </div>
              ) : (
                candidateUsers.map((user) => {
                  const checked = selectedUserIds.includes(user.id);
                  return (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedUserIds((prev) =>
                            e.target.checked
                              ? [...prev, user.id]
                              : prev.filter((id) => id !== user.id)
                          );
                        }}
                        className="h-4 w-4 shrink-0 rounded border-[#E2E8F0] accent-[#7C3AED]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#1E293B] truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-[#94A3B8] truncate">
                          {user.email || "-"}
                          {user.department ? ` · ${user.department}` : ""} ·{" "}
                          {user.role}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <div className="space-y-2 pt-1">
              <p className="text-xs text-[#64748B]">
                {selectedUserIds.length} user dipilih
              </p>
              {selectedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedUserIds.map((id) => {
                    const user = allUsers.find((u) => u.id === id);
                    if (!user) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-xs text-[#7C3AED]"
                      >
                        {user.name}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUserIds((prev) =>
                              prev.filter((uid) => uid !== id)
                            )
                          }
                          className="hover:text-red-500 transition-colors"
                          title="Hapus dari pilihan"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={handleAddMembers}
                  disabled={memberLoading || selectedUserIds.length === 0}
                  className="h-10 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {memberLoading ? "Menambahkan..." : "Tambahkan ke Group"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="border border-[#E2E8F0] shadow-xl rounded-xl p-0 gap-0 overflow-hidden sm:max-w-md">
          <div className="h-1 bg-red-500" />
          <div className="p-5 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Hapus Group
              </DialogTitle>
            </DialogHeader>
            {deleteTarget && (
              <div className="space-y-4">
                <p className="text-sm text-[#64748B]">
                  Apakah Anda yakin ingin menghapus group{" "}
                  <span className="font-semibold text-[#1E293B]">
                    {deleteTarget.name}
                  </span>
                  ? Keanggotaan {deleteTarget.members.length} user di group ini
                  juga akan dihapus (user tidak ikut terhapus).
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

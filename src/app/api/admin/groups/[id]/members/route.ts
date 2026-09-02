import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { actorFromSession, getClientIp, recordAuditEvent } from "@/lib/audit-log";

const addMemberSchema = z.object({
  userIds: z.array(z.string()).min(1, "Pilih minimal 1 user"),
});

// POST /api/admin/groups/[id]/members - tambah anggota ke group
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = addMemberSchema.parse(body);

    const group = await prisma.userGroup.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: "Group tidak ditemukan" }, { status: 404 });
    }

    // Pastikan semua user valid
    const users = await prisma.user.findMany({
      where: { id: { in: validated.userIds } },
      select: { id: true },
    });
    const validIds = users.map((u) => u.id);

    if (validIds.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 400 });
    }

    // Skip yang sudah jadi anggota (createMany + skipDuplicates tidak didukung SQLite,
    // jadi filter manual)
    const existingMembers = await prisma.userGroupMember.findMany({
      where: { groupId: id, userId: { in: validIds } },
      select: { userId: true },
    });
    const existingIds = new Set(existingMembers.map((m) => m.userId));
    const newIds = validIds.filter((uid) => !existingIds.has(uid));

    if (newIds.length > 0) {
      await prisma.userGroupMember.createMany({
        data: newIds.map((userId) => ({ groupId: id, userId })),
      });

      await recordAuditEvent({
        classification: "ADMIN",
        action: "GROUP_MEMBERS_ADDED",
        summary: `${session.user.name || session.user.email || "Admin"} menambahkan ${newIds.length} anggota ke group ${group.name}`,
        actor: actorFromSession(session),
        actorIp: getClientIp(req),
        resourceType: "USER_GROUP",
        resourceId: group.id,
        details: { userIds: newIds },
      });
    }

    return NextResponse.json({ added: newIds.length, skipped: existingIds.size });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Data tidak valid" }, { status: 400 });
    }
    console.error("POST group members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/groups/[id]/members?userId=xxx - hapus anggota dari group
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId wajib diisi" }, { status: 400 });
    }

    await prisma.userGroupMember.deleteMany({
      where: { groupId: id, userId },
    });

    await recordAuditEvent({
      classification: "ADMIN",
      action: "GROUP_MEMBER_REMOVED",
      summary: `${session.user.name || session.user.email || "Admin"} menghapus anggota dari group`,
      actor: actorFromSession(session),
      actorIp: getClientIp(req),
      resourceType: "USER_GROUP",
      resourceId: id,
      details: { userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE group member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

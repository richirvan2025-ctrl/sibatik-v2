import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { actorFromSession, getClientIp, recordAuditEvent } from "@/lib/audit-log";

const groupSchema = z.object({
  name: z.string().min(1, "Nama group wajib diisi").max(100),
  description: z.string().max(500).optional(),
});

// GET /api/admin/groups - daftar semua group + anggota
export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const groups = await prisma.userGroup.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                isActive: true,
              },
            },
          },
          orderBy: { user: { name: "asc" } },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("GET admin/groups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/groups - buat group baru
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validated = groupSchema.parse(body);

    const existing = await prisma.userGroup.findUnique({
      where: { name: validated.name },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Group dengan nama ini sudah ada" },
        { status: 400 }
      );
    }

    const group = await prisma.userGroup.create({
      data: {
        name: validated.name,
        description: validated.description || null,
      },
      include: { members: { include: { user: true } } },
    });

    await recordAuditEvent({
      classification: "ADMIN",
      action: "GROUP_CREATED",
      summary: `${session.user.name || session.user.email || "Admin"} membuat group ${group.name}`,
      actor: actorFromSession(session),
      actorIp: getClientIp(req),
      resourceType: "USER_GROUP",
      resourceId: group.id,
      details: { name: group.name },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Data tidak valid" }, { status: 400 });
    }
    console.error("POST admin/groups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

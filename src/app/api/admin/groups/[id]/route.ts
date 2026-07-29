import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

// PATCH /api/admin/groups/[id] - update nama/deskripsi group
export async function PATCH(
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
    const validated = updateSchema.parse(body);

    const group = await prisma.userGroup.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: "Group tidak ditemukan" }, { status: 404 });
    }

    if (validated.name && validated.name !== group.name) {
      const dup = await prisma.userGroup.findUnique({ where: { name: validated.name } });
      if (dup) {
        return NextResponse.json(
          { error: "Group dengan nama ini sudah ada" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.userGroup.update({
      where: { id },
      data: {
        ...(validated.name ? { name: validated.name } : {}),
        ...(validated.description !== undefined
          ? { description: validated.description }
          : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    console.error("PATCH admin/groups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/groups/[id] - hapus group (beserta keanggotaan)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const group = await prisma.userGroup.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: "Group tidak ditemukan" }, { status: 404 });
    }

    await prisma.userGroup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE admin/groups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "USER", "AGENT", "SUPERVISOR", "EXECUTIVE", "MAHASISWA"]).optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
});

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
    const validated = updateUserSchema.parse(body);

    const user = await prisma.user.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    // Handle Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: { target?: string[] } };
      if (prismaError.code === 'P2002') {
        const field = prismaError.meta?.target?.join(', ') || 'email';
        return NextResponse.json(
          { error: `${field} sudah digunakan oleh user lain` },
          { status: 409 }
        );
      }
    }
    console.error("PATCH admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    if (session.user.id === id) {
      return NextResponse.json(
        { error: "Anda tidak bisa menghapus akun sendiri" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            createdTickets: true,
            assignedTickets: true,
            ownedTickets: true,
            comments: true,
            attachments: true,
            kbArticles: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const counts = user._count;
    const totalRefs =
      counts.createdTickets +
      counts.assignedTickets +
      counts.ownedTickets +
      counts.comments +
      counts.attachments +
      counts.kbArticles;

    if (totalRefs > 0) {
      return NextResponse.json(
        {
          error: "User tidak bisa dihapus karena masih memiliki aktivitas",
          details: {
            createdTickets: counts.createdTickets,
            assignedTickets: counts.assignedTickets,
            ownedTickets: counts.ownedTickets,
            comments: counts.comments,
            attachments: counts.attachments,
            kbArticles: counts.kbArticles,
          },
          hint: "Nonaktifkan user ini melalui tombol toggle status",
        },
        { status: 409 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

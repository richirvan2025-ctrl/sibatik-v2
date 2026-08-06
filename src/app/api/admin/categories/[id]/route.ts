import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  department: z.string().optional().nullable(),
  responseTimeHours: z.number().min(1).optional(),
  resolveTimeHours: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().optional().nullable(),
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
    const validated = updateCategorySchema.parse(body);

    if (validated.parentId !== undefined && validated.parentId !== null) {
      // Cannot turn a parent (with children) into a subcategory
      const childCount = await prisma.category.count({ where: { parentId: id } });
      if (childCount > 0) {
        return NextResponse.json(
          { error: "Tidak bisa menjadikan kategori ini sebagai subkategori karena sudah memiliki subkategori" },
          { status: 400 }
        );
      }

      const parent = await prisma.category.findUnique({
        where: { id: validated.parentId },
        select: { parentId: true },
      });
      if (!parent) {
        return NextResponse.json({ error: "Kategori induk tidak ditemukan" }, { status: 400 });
      }
      if (parent.parentId !== null) {
        return NextResponse.json({ error: "Subkategori tidak bisa memiliki subkategori (maks. 1 level)" }, { status: 400 });
      }
    }

    if (validated.isActive === false) {
      await prisma.category.updateMany({
        where: { parentId: id },
        data: { isActive: false },
      });
    }

    const category = await prisma.category.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("PATCH admin/categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    // Check if category has tickets
    const ticketCount = await prisma.ticket.count({
      where: { categoryId: id },
    });
    if (ticketCount > 0) {
      return NextResponse.json(
        { error: `Tidak bisa menghapus kategori karena masih memiliki ${ticketCount} tiket` },
        { status: 400 }
      );
    }

    // Check if category has children
    const childCount = await prisma.category.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      return NextResponse.json(
        { error: `Tidak bisa menghapus kategori karena masih memiliki ${childCount} subkategori. Hapus subkategori terlebih dahulu.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE admin/categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

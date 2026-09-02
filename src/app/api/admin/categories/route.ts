import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { actorFromSession, getClientIp, recordAuditEvent } from "@/lib/audit-log";

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  department: z.string().optional().nullable(),
  responseTimeHours: z.number().min(1),
  resolveTimeHours: z.number().min(1),
  parentId: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET admin/categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validated = categorySchema.parse(body);

    if (validated.parentId) {
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
    } else {
      // Validate unique name for top-level categories (SQLite NULL != NULL in unique index)
      const existing = await prisma.category.findFirst({
        where: { name: validated.name, parentId: null },
      });
      if (existing) {
        return NextResponse.json({ error: "Kategori dengan nama ini sudah ada" }, { status: 400 });
      }
    }

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        description: validated.description,
        department: validated.department,
        responseTimeHours: validated.responseTimeHours,
        resolveTimeHours: validated.resolveTimeHours,
        parentId: validated.parentId ?? null,
      },
    });

    await recordAuditEvent({
      classification: "ADMIN",
      action: "CATEGORY_CREATED",
      summary: `${session.user.name || session.user.email || "Admin"} membuat kategori ${category.name}`,
      actor: actorFromSession(session),
      actorIp: getClientIp(req),
      resourceType: "CATEGORY",
      resourceId: category.id,
      details: {
        name: category.name,
        department: category.department,
        parentId: category.parentId,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST admin/categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actorFromSession, getClientIp, recordAuditEvent } from "@/lib/audit-log";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, icon, isActive } = body;

    const category = await prisma.kBCategory.update({
      where: { id },
      data: { name, description, icon, isActive },
    });

    await recordAuditEvent({
      classification: "KNOWLEDGE_BASE",
      action: "KB_CATEGORY_UPDATED",
      summary: `${session.user.name || session.user.email || "Admin"} memperbarui kategori knowledge base ${category.name}`,
      actor: actorFromSession(session),
      actorIp: getClientIp(req),
      resourceType: "KB_CATEGORY",
      resourceId: category.id,
      details: { name, description, icon, isActive },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("PATCH kb/categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const category = await prisma.kBCategory.delete({ where: { id } });

    await recordAuditEvent({
      classification: "KNOWLEDGE_BASE",
      severity: "WARNING",
      action: "KB_CATEGORY_DELETED",
      summary: `${session.user.name || session.user.email || "Admin"} menghapus kategori knowledge base ${category.name}`,
      actor: actorFromSession(session),
      actorIp: getClientIp(req),
      resourceType: "KB_CATEGORY",
      resourceId: category.id,
      details: { name: category.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE kb/categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

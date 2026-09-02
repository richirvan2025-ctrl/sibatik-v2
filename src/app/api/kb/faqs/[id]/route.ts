import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actorFromSession, getClientIp, recordAuditEvent } from "@/lib/audit-log";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { question, answer, order, isActive } = body;

    const faq = await prisma.fAQ.update({
      where: { id },
      data: {
        ...(question !== undefined && { question: question.trim() }),
        ...(answer !== undefined && { answer: answer.trim() }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await recordAuditEvent({
      classification: "KNOWLEDGE_BASE",
      action: "FAQ_UPDATED",
      summary: `${session.user.name || session.user.email || "Admin"} memperbarui FAQ`,
      actor: actorFromSession(session),
      actorIp: getClientIp(req),
      resourceType: "FAQ",
      resourceId: faq.id,
      details: { changedFields: Object.keys(body) },
    });

    return NextResponse.json(faq);
  } catch (error) {
    console.error("PUT kb/faqs/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const faq = await prisma.fAQ.delete({ where: { id } });

    await recordAuditEvent({
      classification: "KNOWLEDGE_BASE",
      severity: "WARNING",
      action: "FAQ_DELETED",
      summary: `${session.user.name || session.user.email || "Admin"} menghapus FAQ`,
      actor: actorFromSession(session),
      actorIp: getClientIp(req),
      resourceType: "FAQ",
      resourceId: faq.id,
      details: { question: faq.question },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE kb/faqs/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

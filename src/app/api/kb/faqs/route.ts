import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actorFromSession, getClientIp, recordAuditEvent } from "@/lib/audit-log";

export async function GET() {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(faqs);
  } catch (error) {
    console.error("GET kb/faqs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { question, answer, order } = body;

    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
    }

    const faq = await prisma.fAQ.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        order: typeof order === "number" ? order : 0,
      },
    });

    await recordAuditEvent({
      classification: "KNOWLEDGE_BASE",
      action: "FAQ_CREATED",
      summary: `${session.user.name || session.user.email || "Admin"} membuat FAQ`,
      actor: actorFromSession(session),
      actorIp: getClientIp(req),
      resourceType: "FAQ",
      resourceId: faq.id,
      details: { question: faq.question, order: faq.order },
    });

    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    console.error("POST kb/faqs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

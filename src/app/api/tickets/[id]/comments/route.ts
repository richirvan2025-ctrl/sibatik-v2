import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import {
  actorFromSession,
  getClientIp,
  recordAuditEvent,
} from "@/lib/audit-log";
import { z } from "zod";

const attachmentSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024),
  mimeType: z.string().min(1),
});

const commentSchema = z.object({
  message: z.string().min(1),
  isInternal: z.boolean().optional(),
  attachments: z.array(attachmentSchema).max(5).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = commentSchema.parse(body);

    const userId = session.user.id;
    const role = session.user.role;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check permissions
    const hasAccess =
      role === "ADMIN" ||
      role === "AGENT" ||
      role === "SUPERVISOR" ||
      role === "EXECUTIVE" ||
      ticket.assignedToId === userId ||
      ticket.createdById === userId ||
      ticket.onBehalfOfId === userId;

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only admin/technician/department_head/executive can create internal comments
    const isInternal =
      validated.isInternal &&
      (role === "ADMIN" || role === "AGENT" || role === "SUPERVISOR" || role === "EXECUTIVE")
        ? true
        : false;

    // Track first response if agent/admin/supervisor/executive comments
    if (
      (role === "ADMIN" || role === "AGENT" || role === "SUPERVISOR" || role === "EXECUTIVE") &&
      !ticket.firstResponseAt &&
      !isInternal
    ) {
      await prisma.ticket.update({
        where: { id },
        data: { firstResponseAt: new Date() },
      });
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: id,
        userId,
        message: validated.message,
        isInternal,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    if (validated.attachments?.length) {
      await prisma.commentAttachment.createMany({
        data: validated.attachments.map((a) => ({
          commentId: comment.id,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
          uploadedById: userId,
        })),
      });
    }

    const commentWithAttachments = await prisma.ticketComment.findUnique({
      where: { id: comment.id },
      include: {
        user: { select: { id: true, name: true, role: true } },
        CommentAttachment: true,
      },
    });

    // Kirim notifikasi ke pembuat tiket (dan onBehalfOf) jika komentator bukan mereka
    // dan komentar bukan internal
    if (!isInternal) {
      const recipients = new Set<string>();
      if (ticket.createdById !== userId) recipients.add(ticket.createdById);
      if (ticket.onBehalfOfId && ticket.onBehalfOfId !== userId) recipients.add(ticket.onBehalfOfId);

      if (recipients.size > 0) {
        const commenterName = comment.user.name;
        const attachmentSuffix =
          validated.attachments?.length
            ? ` [${validated.attachments.length} lampiran]`
            : "";
        const ticketData = await prisma.ticket.findUnique({
          where: { id },
          select: { ticketNumber: true, title: true },
        });
        const notifMessage = `${commenterName} membalas tiket ${ticketData?.ticketNumber}: "${validated.message.slice(0, 80)}${validated.message.length > 80 ? "..." : ""}"${attachmentSuffix}`;
        await prisma.notification.createMany({
          data: Array.from(recipients).map((recipientId) => ({
            userId: recipientId,
            ticketId: id,
            type: "COMMENT_ADDED",
            message: notifMessage,
          })),
        });

        // Kirim notifikasi via email (best-effort)
        const recipientUsers = await prisma.user.findMany({
          where: { id: { in: Array.from(recipients) } },
          select: { email: true },
        });
        const emailRecipients = recipientUsers
          .map((u) => u.email)
          .filter(Boolean) as string[];
        if (emailRecipients.length > 0) {
          const ticketUrl = `${process.env.NEXTAUTH_URL ?? ""}/tickets/${id}`;
          void sendMail({
            to: emailRecipients,
            subject: `[Komentar Baru] ${ticketData?.ticketNumber} — ${ticketData?.title}`,
            text: `${notifMessage}\n\nLihat tiket: ${ticketUrl}`,
            html: `<p>${notifMessage}</p><p><a href="${ticketUrl}">Lihat tiket ${ticketData?.ticketNumber}</a></p>`,
          });
        }
      }
    }

    await recordAuditEvent({
      action: isInternal ? "INTERNAL_COMMENT_ADDED" : "COMMENT_ADDED",
      actor: actorFromSession(session),
      actorIp: getClientIp(req),
      classification: "COMMENT",
      details: {
        commentId: comment.id,
        isInternal,
        preview: validated.message.slice(0, 160),
        attachmentCount: validated.attachments?.length || 0,
      },
      resourceId: ticket.id,
      resourceType: "TICKET",
      summary: `${session.user.name} menambahkan ${isInternal ? "catatan internal" : "komentar"}${validated.attachments?.length ? ` dengan ${validated.attachments.length} lampiran` : ""} pada ${ticket.ticketNumber}`,
    });

    return NextResponse.json(commentWithAttachments ?? comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

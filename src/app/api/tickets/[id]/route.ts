import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import {
  actorFromSession,
  getClientIp,
  recordAuditEvent,
} from "@/lib/audit-log";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "ESCALATED", "REOPENED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().optional().nullable(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        category: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        onBehalfOf: { select: { id: true, name: true, email: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, role: true } },
            CommentAttachment: true,
          },
          orderBy: { createdAt: "asc" },
        },
        attachments: {
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check permissions
    const userId = session.user.id;
    const role = session.user.role;

    let isSupervisorOrAgentInDept = false;
    if (role === "SUPERVISOR" || role === "AGENT") {
      const deptUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });
      isSupervisorOrAgentInDept =
        !!deptUser?.department &&
        deptUser.department === ticket.category.department;
    }

    const hasAccess =
      role === "ADMIN" ||
      role === "EXECUTIVE" ||
      role === "AGENT" ||
      isSupervisorOrAgentInDept ||
      ticket.assignedToId === userId ||
      ticket.createdById === userId ||
      ticket.onBehalfOfId === userId;

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Filter internal comments for regular users
    let filteredComments = ticket.comments;
    if (role !== "ADMIN" && role !== "AGENT" && role !== "SUPERVISOR" && role !== "EXECUTIVE") {
      filteredComments = ticket.comments.filter((c) => !c.isInternal);
    }

    return NextResponse.json({ ...ticket, comments: filteredComments });
  } catch (error) {
    console.error("GET ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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
    const validated = updateTicketSchema.parse(body);

    const userId = session.user.id;
    const role = session.user.role;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.status === "CLOSED" && validated.assignedToId !== undefined) {
      return NextResponse.json(
        { error: "Tiket yang telah ditutup tidak dapat di-assign" },
        { status: 400 },
      );
    }

    // Check permissions for update
    // SUPERVISOR: bisa assign ke siapapun di divisinya + update status
    // AGENT: hanya bisa self-assign + update status (tidak bisa assign ke orang lain)
    let supervisorCanUpdate = false;
    let agentCanUpdate = false;
    if (role === "SUPERVISOR") {
      const deptUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });
      supervisorCanUpdate =
        !!deptUser?.department &&
        deptUser.department === ticket.category.department;
    } else if (role === "AGENT") {
      const deptUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });
      agentCanUpdate =
        !!deptUser?.department &&
        deptUser.department === ticket.category.department;
    }

    // Agent/Supervisor tidak boleh memberi rating pada tiket yang di-assign ke dirinya
    const isAssignedToCurrentUser = ticket.assignedToId === userId;
    if (
      validated.rating !== undefined &&
      isAssignedToCurrentUser &&
      (role === "AGENT" || role === "SUPERVISOR")
    ) {
      return NextResponse.json(
        { error: "Agent tidak dapat memberi rating pada tiket yang ditangani" },
        { status: 403 }
      );
    }

    const isCreator =
      ticket.createdById === userId || ticket.onBehalfOfId === userId;

    // Pembuat tiket boleh submit rating (menutup tiket)
    const isRatingOnly =
      validated.rating !== undefined &&
      Object.keys(validated).filter((k) => validated[k as keyof typeof validated] !== undefined).length <= 2 &&
      isCreator;

    // Edit konten (judul/deskripsi) — hanya pembuat/admin, dan hanya saat OPEN
    const wantsContentEdit =
      validated.title !== undefined || validated.description !== undefined;
    if (wantsContentEdit) {
      const canEditContent =
        (role === "ADMIN" || isCreator) && ticket.status === "OPEN";
      if (!canEditContent) {
        return NextResponse.json(
          { error: "Tiket hanya dapat diedit oleh pembuat saat berstatus Open" },
          { status: 403 },
        );
      }
    }

    // Update status/prioritas/assign/rating — izin manajemen
    const wantsStatusUpdate =
      validated.status !== undefined ||
      validated.priority !== undefined ||
      validated.assignedToId !== undefined ||
      validated.rating !== undefined ||
      validated.feedback !== undefined;

    const isReopen = validated.status === "REOPENED";
    if (isReopen) {
      if (ticket.status !== "CLOSED") {
        return NextResponse.json({ error: "Hanya tiket CLOSED yang dapat dibuka kembali" }, { status: 400 });
      }
      if ((ticket.reopenCount ?? 0) >= 1) {
        return NextResponse.json({ error: "Tiket hanya dapat dibuka kembali 1 kali" }, { status: 400 });
      }
      if (role !== "ADMIN" && !isCreator) {
        return NextResponse.json({ error: "Hanya pembuat tiket atau admin yang dapat membuka kembali" }, { status: 403 });
      }
    }

    const canUpdate =
      role === "ADMIN" ||
      supervisorCanUpdate ||
      agentCanUpdate ||
      isRatingOnly ||
      isReopen;

    if (wantsStatusUpdate && !canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Agent hanya boleh self-assign (assign ke diri sendiri), tidak ke orang lain
    if (
      role === "AGENT" &&
      validated.assignedToId !== undefined &&
      validated.assignedToId !== null &&
      validated.assignedToId !== userId
    ) {
      return NextResponse.json(
        { error: "Agent hanya bisa assign tiket ke diri sendiri" },
        { status: 403 }
      );
    }

    // Assignee harus merupakan Staff/Supervisor aktif dari divisi tujuan tiket.
    // Validasi backend mencegah assignment lintas divisi melalui request langsung.
    if (validated.assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: validated.assignedToId },
        select: { role: true, department: true, isActive: true },
      });
      const ticketDepartment = ticket.category.department?.trim().toLocaleLowerCase("id-ID");
      const assigneeDepartment = assignee?.department?.trim().toLocaleLowerCase("id-ID");
      const hasEligibleRole =
        assignee?.role === "ADMIN" ||
        assignee?.role === "AGENT" ||
        assignee?.role === "SUPERVISOR";

      if (
        !assignee ||
        !assignee.isActive ||
        !hasEligibleRole ||
        !ticketDepartment ||
        assigneeDepartment !== ticketDepartment
      ) {
        return NextResponse.json(
          { error: "Assignee harus pengguna aktif dari divisi tujuan tiket" },
          { status: 400 },
        );
      }
    }

    const updateData: Prisma.TicketUncheckedUpdateInput = {};
    if (wantsContentEdit) {
      if (validated.title !== undefined) updateData.title = validated.title;
      if (validated.description !== undefined) updateData.description = validated.description;
    }
    if (isReopen) {
      updateData.status = "REOPENED";
      updateData.reopenCount = { increment: 1 } as unknown as number;
      updateData.closedAt = null;
      updateData.resolvedAt = null;
    } else if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.priority !== undefined) updateData.priority = validated.priority;
    if (validated.assignedToId !== undefined) updateData.assignedToId = validated.assignedToId;
    if (validated.rating !== undefined) updateData.rating = validated.rating;
    if (validated.feedback !== undefined) updateData.feedback = validated.feedback;

    // Track first response
    if (
      validated.status === "IN_PROGRESS" &&
      !ticket.firstResponseAt &&
      (role === "AGENT" || role === "SUPERVISOR")
    ) {
      updateData.firstResponseAt = new Date();
      
      // Check response SLA
      const createdAt = new Date(ticket.createdAt);
      const now = new Date();
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursElapsed > ticket.category.responseTimeHours) {
        updateData.responseSlaBreached = true;
      }
    }

    // Track resolved time and check SLA
    if (validated.status === "RESOLVED") {
      updateData.resolvedAt = new Date();
      
      const createdAt = new Date(ticket.createdAt);
      const now = new Date();
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursElapsed > ticket.category.resolveTimeHours) {
        updateData.slaBreached = true;
      }
    }

    // Track closed time
    if (validated.status === "CLOSED") {
      updateData.closedAt = new Date();
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Notifikasi ke assignee baru jika assignedToId berubah
    if (
      validated.assignedToId !== undefined &&
      validated.assignedToId !== ticket.assignedToId &&
      validated.assignedToId
    ) {
      const assignMessage = `Tiket ${ticket.ticketNumber} — "${ticket.title}" telah di-assign ke Anda.`;
      await prisma.notification.create({
        data: {
          userId: validated.assignedToId,
          ticketId: id,
          type: "TICKET_ASSIGNED",
          message: assignMessage,
        },
      });

      // Kirim notifikasi via email (best-effort)
      const assignee = await prisma.user.findUnique({
        where: { id: validated.assignedToId },
        select: { email: true },
      });
      if (assignee?.email) {
        const ticketUrl = `${process.env.NEXTAUTH_URL ?? ""}/tickets/${id}`;
        void sendMail({
          to: assignee.email,
          subject: `[Tiket Ditugaskan] ${ticket.ticketNumber} — ${ticket.title}`,
          text: `${assignMessage}\n\nLihat tiket: ${ticketUrl}`,
          html: `<p>${assignMessage}</p><p><a href="${ticketUrl}">Lihat tiket</a></p>`,
        });
      }
    }

    const changes: Record<
      string,
      { after: string | number | null; before: string | number | null }
    > = {};
    if (ticket.status !== updated.status) {
      changes.status = { before: ticket.status, after: updated.status };
    }
    if (ticket.priority !== updated.priority) {
      changes.priority = { before: ticket.priority, after: updated.priority };
    }
    if (ticket.assignedToId !== updated.assignedToId) {
      changes.assignedToId = {
        before: ticket.assignedToId,
        after: updated.assignedToId,
      };
    }
    if (ticket.title !== updated.title) {
      changes.title = { before: ticket.title, after: updated.title };
    }
    if (ticket.description !== updated.description) {
      changes.descriptionLength = {
        before: ticket.description.length,
        after: updated.description.length,
      };
    }
    if (ticket.rating !== updated.rating) {
      changes.rating = { before: ticket.rating, after: updated.rating };
    }
    if (ticket.feedback !== updated.feedback) {
      changes.feedback = {
        before: ticket.feedback,
        after: updated.feedback,
      };
    }

    await recordAuditEvent({
      action: "TICKET_UPDATED",
      actor: actorFromSession(session),
      actorIp: getClientIp(req),
      classification: "TICKET",
      details: { changes },
      resourceId: ticket.id,
      resourceType: "TICKET",
      summary: `${session.user.name} mengubah ${Object.keys(changes).join(", ") || "data"} pada ${ticket.ticketNumber}`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("PATCH ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const role = session.user.role;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const isCreator =
      ticket.createdById === userId || ticket.onBehalfOfId === userId;

    if (role !== "ADMIN" && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (ticket.status !== "OPEN") {
      return NextResponse.json(
        { error: "Hanya tiket berstatus Open yang dapat dibatalkan" },
        { status: 400 },
      );
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      include: {
        category: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("DELETE ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

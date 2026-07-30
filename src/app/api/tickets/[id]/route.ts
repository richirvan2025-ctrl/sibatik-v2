import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "ESCALATED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().optional().nullable(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
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
    if (role !== "ADMIN" && role !== "AGENT" && role !== "SUPERVISOR") {
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

    // Pembuat tiket boleh submit rating (menutup tiket)
    const isRatingOnly =
      validated.rating !== undefined &&
      Object.keys(validated).filter((k) => validated[k as keyof typeof validated] !== undefined).length <= 2 &&
      (ticket.createdById === userId || ticket.onBehalfOfId === userId);

    const canUpdate =
      role === "ADMIN" ||
      supervisorCanUpdate ||
      agentCanUpdate ||
      isRatingOnly;

    if (!canUpdate) {
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

    const updateData: Prisma.TicketUncheckedUpdateInput = { ...validated };

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

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("PATCH ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

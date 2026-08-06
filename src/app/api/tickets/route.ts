import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { z } from "zod";

const attachmentSchema = z.object({
  fileName: z.string(),
  fileUrl: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
});

const createTicketSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  deadline: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Date.parse(v)), { message: "Format deadline tidak valid" }),
  onBehalfOfId: z.string().optional(),
  assignedToId: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const userId = session.user.id;
    const role = session.user.role;
    const scope = searchParams.get("scope"); // "mine" | "department" | null

    let where: any = {};

    if (role === "ADMIN" || role === "EXECUTIVE") {
      // Management sees all tickets. Executive access remains read-only in the UI.
      if (scope === "mine") {
        // Tiket Saya: tiket yang dibuat sendiri atau atas nama user
        where = {
          OR: [{ createdById: userId }, { onBehalfOfId: userId }],
        };
      }
    } else if (role === "AGENT" || role === "SUPERVISOR") {
      if (scope === "department") {
        // Tiket Divisi: semua tiket yang masuk ke divisi user
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { department: true },
        });
        if (user?.department) {
          where = { category: { department: user.department } };
        } else {
          where = { assignedToId: userId };
        }
      } else {
        // Tiket Saya: tiket yang dibuat atau di-assign ke user
        where = {
          OR: [{ createdById: userId }, { assignedToId: userId }, { onBehalfOfId: userId }],
        };
      }
    } else {
      // USER & MAHASISWA: hanya tiket yang dibuat sendiri
      where = {
        OR: [{ createdById: userId }, { onBehalfOfId: userId }],
      };
    }

    if (status) {
      where.status =
        status === "COMPLETED"
          ? { in: ["RESOLVED", "CLOSED"] }
          : status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        category: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        onBehalfOf: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("GET tickets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createTicketSchema.parse(body);

    const userId = session.user.id;
    const role = session.user.role;

    // Generate ticket number: TKT-YYYY-NNNNN
    const year = new Date().getFullYear();
    const count = await prisma.ticket.count({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });
    const ticketNumber = `TKT-${year}-${String(count + 1).padStart(5, "0")}`;

    // Only admin/agent/supervisor can create on behalf of another user
    const onBehalfOfId =
      validated.onBehalfOfId &&
      (role === "ADMIN" || role === "AGENT" || role === "SUPERVISOR")
        ? validated.onBehalfOfId
        : null;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: validated.title,
        description: validated.description,
        categoryId: validated.categoryId,
        priority: validated.priority,
        deadline: validated.deadline ? new Date(validated.deadline) : undefined,
        createdById: userId,
        onBehalfOfId: onBehalfOfId || undefined,
        status: "OPEN",
      },
      include: {
        category: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (validated.attachments?.length) {
      await prisma.ticketAttachment.createMany({
        data: validated.attachments.map((a) => ({
          ticketId: ticket.id,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
          uploadedById: userId,
        })),
      });
    }

    // Kirim notifikasi ke penerima yang relevan
    const categoryDept = (ticket.category as any).department as string | null;
    const creatorName = ticket.createdBy.name;
    const notifMessage = `Tiket baru dari ${creatorName}: ${ticket.ticketNumber} — ${ticket.title}`;

    // Auto-assign logic dengan prioritas (gabungan HEAD + a2cbde1):
    // 1. Assignee yang dipilih manual saat membuat tiket (harus dari divisi kategori)
    // 2. @mention di description (SEMENTARA DINONAKTIFKAN: extractMentions belum ada)
    // 3. SUPERVISOR dari divisi kategori — kecuali kategori IT Support (ditangani manual tim IT)
    let autoAssignedId: string | null = null;

    // Priority 1: Assignee dipilih manual di form
    if (validated.assignedToId) {
      const chosenAssignee = await prisma.user.findFirst({
        where: {
          id: validated.assignedToId,
          isActive: true,
          ...(categoryDept ? { department: categoryDept } : {}),
        },
        select: { id: true },
      });
      if (chosenAssignee) {
        autoAssignedId = chosenAssignee.id;
      }
    }

    // Priority 2: Check @mention in description
    // NOTE: DINONAKTIFKAN SEMENTARA — fungsi `extractMentions` tidak terdefinisi/terimport
    // di manapun dalam codebase, akan membuat build gagal. Aktifkan kembali setelah
    // fungsi extractMentions dibuat.
    // const mentions = extractMentions(validated.description);
    // if (!autoAssignedId && mentions.length > 0 && categoryDept) {
    //   const mentionedUser = await prisma.user.findFirst({
    //     where: {
    //       username: mentions[0],
    //       isActive: true,
    //       department: categoryDept, // HARUS dari divisi yang sama
    //     },
    //     select: { id: true },
    //   });
    //   if (mentionedUser) {
    //     autoAssignedId = mentionedUser.id;
    //   }
    // }

    // Priority 3: Fallback ke auto-assign SUPERVISOR by department
    // Khusus kategori IT Support: tidak auto-assign (ditangani manual oleh tim IT)
    if (!autoAssignedId && categoryDept && categoryDept !== "Sistem Informasi & IT Support") {
      const supervisor = await prisma.user.findFirst({
        where: {
          role: "SUPERVISOR",
          department: categoryDept,
          isActive: true,
        },
        select: { id: true },
      });
      if (supervisor) {
        autoAssignedId = supervisor.id;
      }
    }

    // Update ticket dengan assignedToId jika ada
    if (autoAssignedId) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { assignedToId: autoAssignedId },
      });
    }

    // Penerima notifikasi: HANYA anggota aktif divisi tujuan (kategori),
    // kecuali MAHASISWA dan pembuat tiket sendiri.
    // Catatan: Admin & Executive lintas divisi TIDAK menerima notifikasi tiket.
    const recipients = categoryDept
      ? await prisma.user.findMany({
          where: {
            isActive: true,
            id: { not: userId },
            department: categoryDept,
            role: { not: "MAHASISWA" },
          },
          select: { id: true, email: true },
        })
      : [];

    const notifRecipients = recipients.map((r) => ({
      userId: r.id,
      ticketId: ticket.id,
      type: "NEW_TICKET",
      message: notifMessage,
    }));

    // Notifikasi TICKET_ASSIGNED ke department head yang di-auto-assign
    if (autoAssignedId && autoAssignedId !== userId) {
      notifRecipients.push({
        userId: autoAssignedId,
        ticketId: ticket.id,
        type: "TICKET_ASSIGNED",
        message: `Tiket ${ticket.ticketNumber} — "${ticket.title}" telah di-assign ke Anda secara otomatis.`,
      });
    }

    if (notifRecipients.length > 0) {
      await prisma.notification.createMany({
        data: notifRecipients,
      });
    }

    // Kirim notifikasi via email (best-effort; tidak menggagalkan request)
    const ticketUrl = `${process.env.NEXTAUTH_URL ?? ""}/tickets/${ticket.id}`;
    const emailRecipients = recipients.map((r) => r.email).filter(Boolean) as string[];
    if (emailRecipients.length > 0) {
      void sendMail({
        to: emailRecipients,
        subject: `[Tiket Baru] ${ticket.ticketNumber} — ${ticket.title}`,
        text: `${notifMessage}\n\nLihat tiket: ${ticketUrl}`,
        html: `<p>${notifMessage}</p><p><a href="${ticketUrl}">Lihat tiket ${ticket.ticketNumber}</a></p>`,
      });
    }

    // Email khusus ke assignee otomatis
    if (autoAssignedId && autoAssignedId !== userId) {
      const assignee = await prisma.user.findUnique({
        where: { id: autoAssignedId },
        select: { email: true },
      });
      if (assignee?.email) {
        void sendMail({
          to: assignee.email,
          subject: `[Tiket Ditugaskan] ${ticket.ticketNumber} — ${ticket.title}`,
          text: `Tiket ${ticket.ticketNumber} — "${ticket.title}" telah di-assign ke Anda secara otomatis.\n\nLihat tiket: ${ticketUrl}`,
          html: `<p>Tiket <strong>${ticket.ticketNumber}</strong> — "${ticket.title}" telah di-assign ke Anda secara otomatis.</p><p><a href="${ticketUrl}">Lihat tiket</a></p>`,
        });
      }
    }

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

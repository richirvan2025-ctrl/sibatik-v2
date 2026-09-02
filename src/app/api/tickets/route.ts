import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { nextTicketSequence } from "@/lib/ticket-number";
import {
  actorFromSession,
  getClientIp,
  recordAuditEvent,
} from "@/lib/audit-log";
import { Priority, Prisma, TicketStatus } from "@prisma/client";
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
  categoryId: z.string().min(1).optional(),
  categoryIds: z.array(z.string().min(1)).min(1).max(50).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  deadline: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Date.parse(v)), { message: "Format deadline tidak valid" }),
  onBehalfOfId: z.string().optional(),
  assignedToId: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
}).refine((value) => value.categoryId || value.categoryIds?.length, {
  message: "Pilih minimal satu divisi tujuan",
  path: ["categoryIds"],
});

const TICKET_NUMBER_RETRY_LIMIT = 5;

function normalizedDepartment(value: string | null) {
  return value?.trim().toLocaleLowerCase("id-ID") || null;
}

function isRetryableTicketCreationError(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : null;
  const message = error instanceof Error ? error.message : "";

  return (
    code === "P1008" ||
    code === "P2002" ||
    code === "P2028" ||
    code === "P2034" ||
    message.toLowerCase().includes("database is locked")
  );
}

async function waitBeforeRetry(attempt: number) {
  await new Promise((resolve) => setTimeout(resolve, 40 * 2 ** attempt));
}

function isTicketStatus(value: string | null): value is TicketStatus {
  return value !== null && Object.values(TicketStatus).includes(value as TicketStatus);
}

function isPriority(value: string | null): value is Priority {
  return value !== null && Object.values(Priority).includes(value as Priority);
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam === "COMPLETED" || isTicketStatus(statusParam)
        ? statusParam
        : null;
    const priorityParam = searchParams.get("priority");
    const priority = isPriority(priorityParam) ? priorityParam : null;
    const department = searchParams.get("department")?.trim();
    const search = searchParams.get("search");
    const attention = searchParams.get("attention");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const userId = session.user.id;
    const role = session.user.role;
    const scope = searchParams.get("scope"); // "mine" | "department" | null

    // Preserve the production behavior: cancelled tickets are hidden from the
    // unrestricted management list.
    let where: Prisma.TicketWhereInput = {
      AND: [{ status: { not: TicketStatus.CANCELLED } }],
    };

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
          ? { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] }
          : status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (department) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { category: { department } },
      ];
    }
    if (search) {
      where.title = { contains: search };
    }
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
        ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}),
      };
    }

    if (attention) {
      const now = new Date();
      const activeStatuses: TicketStatus[] = [
        TicketStatus.OPEN,
        TicketStatus.IN_PROGRESS,
        TicketStatus.ESCALATED,
        TicketStatus.REOPENED,
      ];

      switch (attention) {
        case "active":
          where.status = { in: activeStatuses };
          break;
        case "overdue":
          where.status = { in: activeStatuses };
          where.deadline = { lt: now };
          break;
        case "due24":
          where.status = { in: activeStatuses };
          where.deadline = {
            gte: now,
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          };
          break;
        case "unassigned":
          where.status = { in: activeStatuses };
          where.assignedToId = null;
          break;
        case "sla":
          where.status = { in: activeStatuses };
          where.slaBreached = true;
          break;
        case "escalated":
          where.status = TicketStatus.ESCALATED;
          break;
        case "high":
          where.status = { in: activeStatuses };
          where.priority = { in: [Priority.URGENT, Priority.HIGH] };
          break;
      }
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

    // Only admin/agent/supervisor can create on behalf of another user
    const onBehalfOfId =
      validated.onBehalfOfId &&
      (role === "ADMIN" || role === "AGENT" || role === "SUPERVISOR")
        ? validated.onBehalfOfId
        : null;

    const requestedCategoryIds = Array.from(
      new Set(
        validated.categoryIds?.length
          ? validated.categoryIds
          : [validated.categoryId as string]
      )
    );
    const categories = await prisma.category.findMany({
      where: { id: { in: requestedCategoryIds }, isActive: true },
      select: { id: true, name: true, department: true },
    });
    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const missingCategoryIds = requestedCategoryIds.filter(
      (categoryId) => !categoryById.has(categoryId)
    );

    if (missingCategoryIds.length > 0) {
      return NextResponse.json(
        { error: "Satu atau beberapa divisi tujuan tidak tersedia" },
        { status: 400 }
      );
    }

    // Satu tiket per divisi. Jika payload berisi dua kategori dari divisi yang
    // sama, kategori pertama dipakai agar tidak membuat tiket duplikat.
    const seenTargets = new Set<string>();
    const targetCategories = requestedCategoryIds.flatMap((categoryId) => {
      const category = categoryById.get(categoryId);
      if (!category) return [];
      const key = normalizedDepartment(category.department) || `category:${category.id}`;
      if (seenTargets.has(key)) return [];
      seenTargets.add(key);
      return [category];
    });
    const targetDepartments = Array.from(
      new Set(
        targetCategories
          .map((category) => category.department)
          .filter((department): department is string => Boolean(department))
      )
    );

    const [chosenAssignee, supervisors, recipientUsers] = await Promise.all([
      validated.assignedToId
        ? prisma.user.findFirst({
            where: {
              id: validated.assignedToId,
              isActive: true,
              role: { in: ["ADMIN", "AGENT", "SUPERVISOR"] },
            },
            select: { id: true, email: true, department: true },
          })
        : Promise.resolve(null),
      targetDepartments.length
        ? prisma.user.findMany({
            where: {
              department: { in: targetDepartments },
              isActive: true,
              role: "SUPERVISOR",
            },
            orderBy: { name: "asc" },
            select: { id: true, email: true, department: true },
          })
        : Promise.resolve([]),
      targetDepartments.length
        ? prisma.user.findMany({
            where: {
              department: { in: targetDepartments },
              id: { not: userId },
              isActive: true,
              role: { not: "MAHASISWA" },
            },
            select: { id: true, email: true, department: true },
          })
        : Promise.resolve([]),
    ]);

    const supervisorByDepartment = new Map<
      string,
      (typeof supervisors)[number]
    >();
    supervisors.forEach((supervisor) => {
      const key = normalizedDepartment(supervisor.department);
      if (key && !supervisorByDepartment.has(key)) {
        supervisorByDepartment.set(key, supervisor);
      }
    });

    const recipientsByDepartment = new Map<
      string,
      typeof recipientUsers
    >();
    recipientUsers.forEach((recipient) => {
      const key = normalizedDepartment(recipient.department);
      if (!key) return;
      recipientsByDepartment.set(key, [
        ...(recipientsByDepartment.get(key) || []),
        recipient,
      ]);
    });

    const itSupportDepartment = normalizedDepartment(
      "Sistem Informasi & IT Support"
    );
    const targets = targetCategories.map((category) => {
      const departmentKey = normalizedDepartment(category.department);
      const manualAssigneeMatches =
        chosenAssignee &&
        departmentKey &&
        normalizedDepartment(chosenAssignee.department) === departmentKey;
      const fallbackSupervisor =
        departmentKey && departmentKey !== itSupportDepartment
          ? supervisorByDepartment.get(departmentKey)
          : null;
      const assignee = manualAssigneeMatches
        ? chosenAssignee
        : fallbackSupervisor || null;

      return {
        assignee,
        category,
        recipients: departmentKey
          ? recipientsByDepartment.get(departmentKey) || []
          : [],
      };
    });

    const year = new Date().getFullYear();
    const ticketNumberPrefix = `TKT-${year}-`;
    const createBatch = () =>
      prisma.$transaction(
        async (tx) => {
          const existingNumbers = await tx.ticket.findMany({
            where: { ticketNumber: { startsWith: ticketNumberPrefix } },
            select: { ticketNumber: true },
          });
          let nextSequence = nextTicketSequence(
            existingNumbers.map((ticket) => ticket.ticketNumber),
            ticketNumberPrefix
          );
          const created = [];

          for (const target of targets) {
            const ticketNumber = `${ticketNumberPrefix}${String(
              nextSequence++
            ).padStart(5, "0")}`;
            const ticket = await tx.ticket.create({
              data: {
                assignedToId: target.assignee?.id || undefined,
                categoryId: target.category.id,
                createdById: userId,
                deadline: validated.deadline
                  ? new Date(validated.deadline)
                  : undefined,
                description: validated.description,
                onBehalfOfId: onBehalfOfId || undefined,
                priority: validated.priority,
                status: TicketStatus.OPEN,
                ticketNumber,
                title: validated.title,
              },
              include: {
                category: true,
                createdBy: { select: { id: true, name: true, email: true } },
              },
            });

            if (validated.attachments?.length) {
              await tx.ticketAttachment.createMany({
                data: validated.attachments.map((attachment) => ({
                  fileName: attachment.fileName,
                  fileSize: attachment.fileSize,
                  fileUrl: attachment.fileUrl,
                  mimeType: attachment.mimeType,
                  ticketId: ticket.id,
                  uploadedById: userId,
                })),
              });
            }

            const notificationMessage = `Tiket baru dari ${ticket.createdBy.name}: ${ticket.ticketNumber} — ${ticket.title}`;
            const notifications = target.recipients.map((recipient) => ({
              message: notificationMessage,
              ticketId: ticket.id,
              type: "NEW_TICKET",
              userId: recipient.id,
            }));

            if (target.assignee && target.assignee.id !== userId) {
              notifications.push({
                message: `Tiket ${ticket.ticketNumber} — "${ticket.title}" telah di-assign ke Anda secara otomatis.`,
                ticketId: ticket.id,
                type: "TICKET_ASSIGNED",
                userId: target.assignee.id,
              });
            }

            if (notifications.length > 0) {
              await tx.notification.createMany({ data: notifications });
            }

            created.push({
              assigneeEmail: target.assignee?.email || null,
              assigneeId: target.assignee?.id || null,
              recipients: target.recipients,
              ticket,
            });
          }

          return created;
        },
        { maxWait: 10_000, timeout: 20_000 }
      );

    let createdTickets: Awaited<ReturnType<typeof createBatch>> | null = null;
    let creationError: unknown;

    for (let attempt = 0; attempt < TICKET_NUMBER_RETRY_LIMIT; attempt += 1) {
      try {
        createdTickets = await createBatch();
        break;
      } catch (error) {
        creationError = error;
        if (
          !isRetryableTicketCreationError(error) ||
          attempt === TICKET_NUMBER_RETRY_LIMIT - 1
        ) {
          throw error;
        }
        await waitBeforeRetry(attempt);
      }
    }

    if (!createdTickets) throw creationError;

    const actorIp = getClientIp(req);
    await Promise.all(
      createdTickets.map(({ assigneeId, ticket }, index) =>
        recordAuditEvent({
          action: "TICKET_CREATED",
          actor: actorFromSession(session),
          actorIp,
          classification: "TICKET",
          details: {
            assignedToId: assigneeId,
            attachmentCount: validated.attachments?.length || 0,
            batchIndex: index + 1,
            batchSize: createdTickets.length,
            category: ticket.category.name,
            department: ticket.category.department,
            onBehalfOfId: onBehalfOfId || null,
            priority: ticket.priority,
          },
          resourceId: ticket.id,
          resourceType: "TICKET",
          summary: `${session.user.name} membuat ${ticket.ticketNumber}: ${ticket.title}`,
        })
      )
    );

    // Email tetap best-effort dan dijalankan setelah transaksi berhasil, sehingga
    // kegagalan SMTP tidak dapat membuat sebagian tiket tersimpan.
    const emailJobs = createdTickets.flatMap(
      ({ assigneeEmail, assigneeId, recipients, ticket }) => {
        const ticketUrl = `${process.env.NEXTAUTH_URL ?? ""}/tickets/${ticket.id}`;
        const notificationMessage = `Tiket baru dari ${ticket.createdBy.name}: ${ticket.ticketNumber} — ${ticket.title}`;
        const recipientEmails = recipients
          .map((recipient) => recipient.email)
          .filter((email): email is string => Boolean(email));
        const jobs: Array<Promise<boolean>> = [];

        if (recipientEmails.length > 0) {
          jobs.push(
            sendMail({
              html: `<p>${notificationMessage}</p><p><a href="${ticketUrl}">Lihat tiket ${ticket.ticketNumber}</a></p>`,
              subject: `[Tiket Baru] ${ticket.ticketNumber} — ${ticket.title}`,
              text: `${notificationMessage}\n\nLihat tiket: ${ticketUrl}`,
              to: recipientEmails,
            })
          );
        }

        if (assigneeId && assigneeId !== userId && assigneeEmail) {
          jobs.push(
            sendMail({
              html: `<p>Tiket <strong>${ticket.ticketNumber}</strong> — "${ticket.title}" telah di-assign ke Anda secara otomatis.</p><p><a href="${ticketUrl}">Lihat tiket</a></p>`,
              subject: `[Tiket Ditugaskan] ${ticket.ticketNumber} — ${ticket.title}`,
              text: `Tiket ${ticket.ticketNumber} — "${ticket.title}" telah di-assign ke Anda secara otomatis.\n\nLihat tiket: ${ticketUrl}`,
              to: assigneeEmail,
            })
          );
        }

        return jobs;
      }
    );
    void Promise.allSettled(emailJobs);

    if (validated.categoryIds) {
      return NextResponse.json(
        {
          count: createdTickets.length,
          tickets: createdTickets.map(({ ticket }) => ticket),
        },
        { status: 201 }
      );
    }

    return NextResponse.json(createdTickets[0].ticket, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

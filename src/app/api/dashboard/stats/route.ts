import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;
    const now = new Date();
    const dueSoonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    let baseWhere: Prisma.TicketWhereInput = {};
    if (role === "ADMIN" || role === "EXECUTIVE") {
      // Management sees all tickets.
    } else if (role === "AGENT") {
      baseWhere = { assignedToId: userId };
    } else if (role === "SUPERVISOR") {
      const deptUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });
      if (deptUser?.department) {
        baseWhere = { category: { department: deptUser.department } };
      } else {
        baseWhere = { assignedToId: userId };
      }
    } else {
      baseWhere = { OR: [{ createdById: userId }, { onBehalfOfId: userId }] };
    }

    const [
      total,
      open,
      inProgress,
      resolved,
      closed,
      slaBreached,
      dueSoon,
      oldestUnhandled,
      avgResolutionTime,
    ] = await Promise.all([
      prisma.ticket.count({ where: baseWhere }),
      prisma.ticket.count({ where: { ...baseWhere, status: "OPEN" } }),
      prisma.ticket.count({ where: { ...baseWhere, status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { ...baseWhere, status: "RESOLVED" } }),
      prisma.ticket.count({ where: { ...baseWhere, status: "CLOSED" } }),
      prisma.ticket.count({ where: { ...baseWhere, slaBreached: true } }),
      prisma.ticket.count({
        where: {
          ...baseWhere,
          status: { in: ["OPEN", "IN_PROGRESS", "REOPENED", "ESCALATED"] },
          deadline: { gte: now, lte: dueSoonThreshold },
        },
      }),
      prisma.ticket.findFirst({
        where: { ...baseWhere, status: "OPEN", assignedToId: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          createdAt: true,
        },
      }),
      prisma.ticket.findMany({
        where: { ...baseWhere, resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }),
    ]);

    // Calculate average resolution time in hours
    let avgResolutionHours = 0;
    if (avgResolutionTime.length > 0) {
      const totalHours = avgResolutionTime.reduce((sum, ticket) => {
        const created = new Date(ticket.createdAt);
        const resolved = new Date(ticket.resolvedAt!);
        return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Math.round(totalHours / avgResolutionTime.length);
    }

    return NextResponse.json({
      total,
      open,
      inProgress,
      resolved,
      closed,
      slaBreached,
      dueSoon,
      oldestUnhandled: oldestUnhandled
        ? {
            id: oldestUnhandled.id,
            ticketNumber: oldestUnhandled.ticketNumber,
            title: oldestUnhandled.title,
            ageDays: Math.max(
              0,
              Math.floor(
                (now.getTime() - oldestUnhandled.createdAt.getTime()) /
                  (24 * 60 * 60 * 1000),
              ),
            ),
          }
        : null,
      avgResolutionHours,
    });
  } catch (error) {
    console.error("GET dashboard/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

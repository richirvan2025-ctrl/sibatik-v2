import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    let baseWhere: any = {};
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
      avgResolutionTime,
    ] = await Promise.all([
      prisma.ticket.count({ where: baseWhere }),
      prisma.ticket.count({ where: { ...baseWhere, status: "OPEN" } }),
      prisma.ticket.count({ where: { ...baseWhere, status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { ...baseWhere, status: "RESOLVED" } }),
      prisma.ticket.count({ where: { ...baseWhere, status: "CLOSED" } }),
      prisma.ticket.count({ where: { ...baseWhere, slaBreached: true } }),
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
      avgResolutionHours,
    });
  } catch (error) {
    console.error("GET dashboard/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

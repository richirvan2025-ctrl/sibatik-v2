import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "EXECUTIVE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      allParentCategories,
      urgentTickets,
      recentTickets,
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: "RESOLVED" } }),
      prisma.ticket.count({ where: { status: "CLOSED" } }),
      prisma.category.findMany({
        where: { parentId: null, isActive: true },
        select: { id: true, name: true, department: true },
        orderBy: { name: "asc" },
      }),
      prisma.ticket.findMany({
        where: {
          status: { in: ["OPEN", "IN_PROGRESS"] },
          priority: { in: ["URGENT", "HIGH"] },
        },
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          category: { select: { name: true, department: true } },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        take: 10,
      }),
      prisma.ticket.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, resolvedAt: true, status: true },
      }),
    ]);

    // Tiket per divisi (by parent category department)
    const deptStats = await Promise.all(
      allParentCategories.map(async (cat) => {
        const catIds = await prisma.category.findMany({
          where: {
            OR: [{ id: cat.id }, { parentId: cat.id }],
          },
          select: { id: true },
        });
        const ids = catIds.map((c) => c.id);

        const [total, open, inProgress, resolved] = await Promise.all([
          prisma.ticket.count({ where: { categoryId: { in: ids } } }),
          prisma.ticket.count({ where: { categoryId: { in: ids }, status: "OPEN" } }),
          prisma.ticket.count({ where: { categoryId: { in: ids }, status: "IN_PROGRESS" } }),
          prisma.ticket.count({ where: { categoryId: { in: ids }, status: { in: ["RESOLVED", "CLOSED"] } } }),
        ]);

        return {
          department: cat.name,
          total,
          open,
          inProgress,
          resolved,
        };
      })
    );

    // Daily trend 7 hari
    const dailyMap: Record<string, { created: number; resolved: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyMap[key] = { created: 0, resolved: 0 };
    }
    for (const t of recentTickets) {
      const cKey = new Date(t.createdAt).toISOString().split("T")[0];
      if (dailyMap[cKey]) dailyMap[cKey].created++;
      if (t.resolvedAt) {
        const rKey = new Date(t.resolvedAt).toISOString().split("T")[0];
        if (dailyMap[rKey]) dailyMap[rKey].resolved++;
      }
    }
    const dailyTrends = Object.entries(dailyMap).map(([date, v]) => ({
      date,
      ...v,
    }));

    return NextResponse.json({
      summary: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
      },
      deptStats: deptStats.filter((d) => d.total > 0),
      urgentTickets: urgentTickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        title: t.title,
        status: t.status,
        priority: t.priority,
        department: t.category.department || t.category.name,
        createdAt: t.createdAt,
      })),
      dailyTrends,
    });
  } catch (error) {
    console.error("GET executive/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

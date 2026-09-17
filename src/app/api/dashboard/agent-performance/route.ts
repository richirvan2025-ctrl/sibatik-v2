import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "KABAG") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supervisor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { department: true },
    });

    if (!supervisor?.department) {
      return NextResponse.json([]);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const agents = await prisma.user.findMany({
      where: {
        role: "KOORDINATOR",
        department: supervisor.department,
        isActive: true,
      },
      select: { id: true, name: true },
    });

    const performance = await Promise.all(
      agents.map(async (agent) => {
        const [ticketCount, resolvedCount, ratedTickets] = await Promise.all([
          prisma.ticket.count({
            where: {
              assignedToId: agent.id,
              createdAt: { gte: startOfMonth, lt: endOfMonth },
            },
          }),
          prisma.ticket.count({
            where: {
              assignedToId: agent.id,
              createdAt: { gte: startOfMonth, lt: endOfMonth },
              status: { in: ["RESOLVED", "CLOSED"] },
            },
          }),
          prisma.ticket.findMany({
            where: {
              assignedToId: agent.id,
              createdAt: { gte: startOfMonth, lt: endOfMonth },
              rating: { not: null },
              status: { in: ["RESOLVED", "CLOSED"] },
            },
            select: { rating: true },
          }),
        ]);

        // Distribusi rating 1-5
        const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
          star,
          count: ratedTickets.filter((t) => t.rating === star).length,
        }));

        return {
          agentId: agent.id,
          agentName: agent.name,
          ticketCount,
          resolvedCount,
          ratingDistribution,
        };
      })
    );

    return NextResponse.json(performance);
  } catch (error) {
    console.error("GET agent-performance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

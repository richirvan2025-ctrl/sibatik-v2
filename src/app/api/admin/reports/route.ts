import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES = ["OPEN", "IN_PROGRESS", "ESCALATED", "REOPENED"] as const;
const COMPLETED_STATUSES = ["RESOLVED", "CLOSED"] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function parseDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getPeriod(req: NextRequest) {
  const now = new Date();
  const preset = req.nextUrl.searchParams.get("period") || "30";
  const requestedFrom = parseDate(req.nextUrl.searchParams.get("from"));
  const requestedTo = parseDate(req.nextUrl.searchParams.get("to"));

  let from: Date;
  let to: Date;
  let label: string;

  if (preset === "custom" && requestedFrom && requestedTo) {
    from = startOfDay(requestedFrom);
    to = endOfDay(requestedTo);
    if (from > to) [from, to] = [startOfDay(requestedTo), endOfDay(requestedFrom)];
    const maxTo = new Date(from.getTime() + 365 * DAY_MS);
    if (to > maxTo) to = endOfDay(maxTo);
    label = "Rentang khusus";
  } else {
    const days = [7, 30, 90].includes(Number(preset)) ? Number(preset) : 30;
    to = endOfDay(now);
    from = startOfDay(new Date(now.getTime() - (days - 1) * DAY_MS));
    label = `${days} hari terakhir`;
  }

  const duration = to.getTime() - from.getTime() + 1;
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - duration + 1);
  const days = Math.max(1, Math.ceil(duration / DAY_MS));

  return { from, to, previousFrom, previousTo, days, label };
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const value =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  return Math.round(value * 10) / 10;
}

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : null;
}

function delta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "EXECUTIVE")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const dueSoonLimit = new Date(now.getTime() + DAY_MS);
    const { from, to, previousFrom, previousTo, days, label } = getPeriod(req);
    const periodWhere = { createdAt: { gte: from, lte: to } };
    const previousWhere = { createdAt: { gte: previousFrom, lte: previousTo } };

    const [
      statusCounts,
      priorityCounts,
      categoryCounts,
      categories,
      periodTickets,
      previousTickets,
      createdTrendTickets,
      resolvedTrendTickets,
      activeSnapshot,
    ] = await Promise.all([
      prisma.ticket.groupBy({
        by: ["status"],
        where: periodWhere,
        _count: { id: true },
      }),
      prisma.ticket.groupBy({
        by: ["priority"],
        where: periodWhere,
        _count: { id: true },
      }),
      prisma.ticket.groupBy({
        by: ["categoryId"],
        where: periodWhere,
        _count: { id: true },
      }),
      prisma.category.findMany({ select: { id: true, name: true } }),
      prisma.ticket.findMany({
        where: periodWhere,
        select: {
          status: true,
          priority: true,
          createdAt: true,
          resolvedAt: true,
          firstResponseAt: true,
          slaBreached: true,
          rating: true,
          assignedToId: true,
          assignedTo: { select: { name: true } },
        },
      }),
      prisma.ticket.findMany({
        where: previousWhere,
        select: { status: true },
      }),
      prisma.ticket.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { createdAt: true },
      }),
      prisma.ticket.findMany({
        where: { resolvedAt: { gte: from, lte: to } },
        select: { resolvedAt: true },
      }),
      prisma.ticket.findMany({
        where: { status: { in: [...ACTIVE_STATUSES] } },
        select: {
          status: true,
          priority: true,
          createdAt: true,
          deadline: true,
          assignedToId: true,
          slaBreached: true,
        },
      }),
    ]);

    const totalTickets = periodTickets.length;
    const activeTickets = periodTickets.filter((ticket) =>
      ACTIVE_STATUSES.includes(ticket.status as (typeof ACTIVE_STATUSES)[number]),
    ).length;
    const completedTickets = periodTickets.filter((ticket) =>
      COMPLETED_STATUSES.includes(
        ticket.status as (typeof COMPLETED_STATUSES)[number],
      ),
    );
    const previousActive = previousTickets.filter((ticket) =>
      ACTIVE_STATUSES.includes(ticket.status as (typeof ACTIVE_STATUSES)[number]),
    ).length;
    const previousCompleted = previousTickets.filter((ticket) =>
      COMPLETED_STATUSES.includes(
        ticket.status as (typeof COMPLETED_STATUSES)[number],
      ),
    ).length;

    const responseHours = periodTickets
      .filter((ticket) => ticket.firstResponseAt)
      .map(
        (ticket) =>
          (ticket.firstResponseAt!.getTime() - ticket.createdAt.getTime()) /
          (60 * 60 * 1000),
      );
    const resolutionHours = completedTickets
      .filter((ticket) => ticket.resolvedAt)
      .map(
        (ticket) =>
          (ticket.resolvedAt!.getTime() - ticket.createdAt.getTime()) /
          (60 * 60 * 1000),
      );
    const slaCompliant = completedTickets.filter(
      (ticket) => !ticket.slaBreached,
    ).length;

    const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

    const staffMap = new Map<
      string,
      {
        name: string;
        resolvedCount: number;
        totalAssigned: number;
        responseHours: number[];
        resolutionHours: number[];
        ratings: number[];
        escalationCount: number;
      }
    >();

    periodTickets.forEach((ticket) => {
      if (!ticket.assignedToId) return;
      const existing = staffMap.get(ticket.assignedToId) || {
        name: ticket.assignedTo?.name || "Staff",
        resolvedCount: 0,
        totalAssigned: 0,
        responseHours: [],
        resolutionHours: [],
        ratings: [],
        escalationCount: 0,
      };
      existing.totalAssigned += 1;
      if (
        COMPLETED_STATUSES.includes(
          ticket.status as (typeof COMPLETED_STATUSES)[number],
        )
      ) {
        existing.resolvedCount += 1;
      }
      if (ticket.status === "ESCALATED") existing.escalationCount += 1;
      if (ticket.firstResponseAt) {
        existing.responseHours.push(
          (ticket.firstResponseAt.getTime() - ticket.createdAt.getTime()) /
            (60 * 60 * 1000),
        );
      }
      if (ticket.resolvedAt) {
        existing.resolutionHours.push(
          (ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) /
            (60 * 60 * 1000),
        );
      }
      if (ticket.rating) existing.ratings.push(ticket.rating);
      staffMap.set(ticket.assignedToId, existing);
    });

    const useWeeklyBuckets = days > 45;
    const bucketSize = useWeeklyBuckets ? 7 : 1;
    const bucketCount = Math.ceil(days / bucketSize);
    const trends = Array.from({ length: bucketCount }, (_, index) => {
      const bucketFrom = new Date(from.getTime() + index * bucketSize * DAY_MS);
      const bucketTo = new Date(
        Math.min(
          to.getTime(),
          bucketFrom.getTime() + bucketSize * DAY_MS - 1,
        ),
      );
      return {
        date: bucketFrom.toISOString(),
        endDate: bucketTo.toISOString(),
        created: 0,
        resolved: 0,
      };
    });
    const bucketIndex = (date: Date) =>
      Math.min(
        bucketCount - 1,
        Math.max(0, Math.floor((date.getTime() - from.getTime()) / (bucketSize * DAY_MS))),
      );
    createdTrendTickets.forEach((ticket) => {
      trends[bucketIndex(ticket.createdAt)].created += 1;
    });
    resolvedTrendTickets.forEach((ticket) => {
      if (ticket.resolvedAt) trends[bucketIndex(ticket.resolvedAt)].resolved += 1;
    });

    const backlogAge = [
      { key: "0_1", label: "0–1 hari", count: 0 },
      { key: "2_3", label: "2–3 hari", count: 0 },
      { key: "4_7", label: "4–7 hari", count: 0 },
      { key: "over_7", label: ">7 hari", count: 0 },
    ];
    activeSnapshot.forEach((ticket) => {
      const age = Math.floor((now.getTime() - ticket.createdAt.getTime()) / DAY_MS);
      if (age <= 1) backlogAge[0].count += 1;
      else if (age <= 3) backlogAge[1].count += 1;
      else if (age <= 7) backlogAge[2].count += 1;
      else backlogAge[3].count += 1;
    });

    return NextResponse.json({
      meta: {
        from: from.toISOString(),
        to: to.toISOString(),
        updatedAt: now.toISOString(),
        days,
        label,
        bucket: useWeeklyBuckets ? "week" : "day",
      },
      summary: {
        totalTickets,
        activeTickets,
        completedTickets: completedTickets.length,
        completionRate: percentage(completedTickets.length, totalTickets),
        medianResponseHours: median(responseHours),
        medianResolutionHours: median(resolutionHours),
        slaComplianceRate: percentage(slaCompliant, completedTickets.length),
        slaCompliant,
        previous: {
          totalTickets: previousTickets.length,
          activeTickets: previousActive,
          completedTickets: previousCompleted,
        },
        delta: {
          totalTickets: delta(totalTickets, previousTickets.length),
          activeTickets: delta(activeTickets, previousActive),
          completedTickets: delta(completedTickets.length, previousCompleted),
        },
      },
      attention: {
        overdue: activeSnapshot.filter(
          (ticket) => ticket.deadline && ticket.deadline < now,
        ).length,
        dueSoon: activeSnapshot.filter(
          (ticket) =>
            ticket.deadline &&
            ticket.deadline >= now &&
            ticket.deadline <= dueSoonLimit,
        ).length,
        unassigned: activeSnapshot.filter((ticket) => !ticket.assignedToId).length,
        slaBreached: activeSnapshot.filter((ticket) => ticket.slaBreached).length,
        escalated: activeSnapshot.filter((ticket) => ticket.status === "ESCALATED").length,
        highPriority: activeSnapshot.filter((ticket) =>
          ["URGENT", "HIGH"].includes(ticket.priority),
        ).length,
      },
      backlogAge,
      statusCounts: statusCounts.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      priorityCounts: priorityCounts.map((item) => ({
        priority: item.priority,
        count: item._count.id,
      })),
      categoryCounts: categoryCounts.map((item) => ({
        category: categoryMap.get(item.categoryId) || "Kategori tidak diketahui",
        count: item._count.id,
      })),
      staffPerformance: [...staffMap.values()]
        .map((staff) => ({
          name: staff.name,
          resolvedCount: staff.resolvedCount,
          totalAssigned: staff.totalAssigned,
          medianResponseHours: median(staff.responseHours),
          medianResolutionHours: median(staff.resolutionHours),
          avgRating:
            staff.ratings.length > 0
              ? Math.round(
                  (staff.ratings.reduce((total, rating) => total + rating, 0) /
                    staff.ratings.length) *
                    10,
                ) / 10
              : null,
          escalationCount: staff.escalationCount,
        }))
        .sort(
          (a, b) =>
            b.resolvedCount - a.resolvedCount ||
            b.totalAssigned - a.totalAssigned,
        ),
      dailyTrends: trends,
    });
  } catch (error) {
    console.error("GET admin/reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

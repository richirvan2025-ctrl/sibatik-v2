import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        department: { not: null },
      },
      select: { department: true },
      distinct: ["department"],
      orderBy: { department: "asc" },
    });

    const departments = categories
      .map((category) => category.department?.trim())
      .filter((department): department is string => Boolean(department));

    return NextResponse.json(departments);
  } catch (error) {
    console.error("GET departments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

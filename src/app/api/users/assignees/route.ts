import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/assignees?departments=Div A,Div B
// Mengembalikan daftar user aktif (staf) berdasarkan divisi/departemen
// Digunakan untuk memilih assignee saat membuat tiket baru
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentsParam = searchParams.get("departments");

    if (!departmentsParam) {
      return NextResponse.json([]);
    }

    const departments = departmentsParam
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    if (departments.length === 0) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        department: { in: departments },
        role: { in: ["AGENT", "SUPERVISOR"] },
      },
      select: {
        id: true,
        name: true,
        role: true,
        department: true,
      },
      orderBy: [{ department: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET assignees error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";
import { actorFromSession, getClientIp, recordAuditEvent } from "@/lib/audit-log";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const doc = await prisma.internalDoc.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
    }

    // Hapus file dari disk
    try {
      const filePath = join(process.cwd(), "public", doc.fileUrl);
      await unlink(filePath);
    } catch {
      // File mungkin sudah tidak ada, lanjutkan hapus record
    }

    await prisma.internalDoc.delete({ where: { id } });

    await recordAuditEvent({
      classification: "ADMIN",
      severity: "WARNING",
      action: "INTERNAL_DOCUMENT_DELETED",
      summary: `${session.user.name || session.user.email || "Admin"} menghapus dokumen internal ${doc.title}`,
      actor: actorFromSession(session),
      actorIp: getClientIp(req),
      resourceType: "INTERNAL_DOCUMENT",
      resourceId: doc.id,
      details: { category: doc.category, fileName: doc.fileName },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE admin/documents/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

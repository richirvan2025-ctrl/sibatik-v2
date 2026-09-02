import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { indexDocument } from "@/lib/rag";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { actorFromSession, getClientIp, recordAuditEvent } from "@/lib/audit-log";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const result = await pdfParse(buffer);
    return result.text;
  } else {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const docs = await prisma.internalDoc.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(docs);
  } catch (error) {
    console.error("GET admin/documents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const file = formData.get("file") as File;

    if (!title?.trim() || !category?.trim() || !file) {
      return NextResponse.json({ error: "Title, category, and file are required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Hanya PDF dan DOCX yang diizinkan" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File maksimal 10MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const content = await extractText(buffer, file.type);

    const uploadDir = join(process.cwd(), "public", "uploads", "docs");
    await mkdir(uploadDir, { recursive: true });
    const ext = file.name.split(".").pop() || "bin";
    const uniqueName = `${randomUUID()}.${ext}`;
    await writeFile(join(uploadDir, uniqueName), buffer);

    const doc = await prisma.internalDoc.create({
      data: {
        title: title.trim(),
        category: category.trim(),
        fileName: file.name,
        fileUrl: `/uploads/docs/${uniqueName}`,
        content: content.trim(),
      },
    });

    // Index dokumen untuk RAG (background, tidak block response)
    indexDocument(doc.id, content.trim()).catch((err) =>
      console.error("RAG indexing error:", err)
    );

    await recordAuditEvent({
      classification: "ADMIN",
      action: "INTERNAL_DOCUMENT_UPLOADED",
      summary: `${session.user.name || session.user.email || "Admin"} mengunggah dokumen internal ${doc.title}`,
      actor: actorFromSession(session),
      actorIp: getClientIp(req),
      resourceType: "INTERNAL_DOCUMENT",
      resourceId: doc.id,
      details: { category: doc.category, fileName: doc.fileName, size: file.size },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("POST admin/documents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

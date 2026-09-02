import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import {
  actorFromSession,
  getClientIp,
  recordAuditEvent,
} from "@/lib/audit-log";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "Tidak ada file" }, { status: 400 });
    }
    if (files.length > 5) {
      return NextResponse.json({ error: "Maksimal 5 file" }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const results = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Tipe file tidak didukung: ${file.name}` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File terlalu besar (maks. 10MB): ${file.name}` },
          { status: 400 }
        );
      }

      const ext = file.name.split(".").pop() || "bin";
      const uniqueName = `${randomUUID()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(join(uploadDir, uniqueName), buffer);

      results.push({
        fileName: file.name,
        fileUrl: `/uploads/${uniqueName}`,
        fileSize: file.size,
        mimeType: file.type,
      });
    }

    await recordAuditEvent({
      action: "FILES_UPLOADED",
      actor: actorFromSession(session),
      actorIp: getClientIp(req),
      classification: "ATTACHMENT",
      details: {
        files: results.map((file) => ({
          fileName: file.fileName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
        })),
      },
      resourceType: "UPLOAD_BATCH",
      summary: `${session.user.name} mengunggah ${results.length} file lampiran`,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload gagal" }, { status: 500 });
  }
}

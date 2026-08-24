import { readFile, stat } from "fs/promises";
import { extname, resolve, sep } from "path";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const SAFE_PATH_SEGMENT = /^[a-zA-Z0-9._-]+$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  if (
    !path?.length ||
    path.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        !SAFE_PATH_SEGMENT.test(segment)
    )
  ) {
    return NextResponse.json({ error: "Path file tidak valid" }, { status: 400 });
  }

  const uploadRoot = resolve(process.cwd(), "public", "uploads");
  const filePath = resolve(uploadRoot, ...path);

  if (!filePath.startsWith(`${uploadRoot}${sep}`)) {
    return NextResponse.json({ error: "Path file tidak valid" }, { status: 400 });
  }

  try {
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
    }

    const file = await readFile(filePath);
    const contentType =
      MIME_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream";

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Cache-Control": "private, max-age=300, must-revalidate",
        "Content-Length": String(fileInfo.size),
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
    }

    console.error("GET upload file error:", error);
    return NextResponse.json({ error: "Gagal membuka file" }, { status: 500 });
  }
}

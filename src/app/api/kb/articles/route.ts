import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actorFromSession, getClientIp, recordAuditEvent } from "@/lib/audit-log";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 100);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category");
    const search = searchParams.get("search");
    const admin = searchParams.get("admin");

    const where: any = {};

    if (!admin) {
      where.isPublished = true;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const articles = await prisma.kBArticle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
        _count: { select: { tags: true } },
      },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("GET kb/articles error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "AGENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, excerpt, categoryId, isPublished, tags } = body;

    let slug = slugify(title);
    const existing = await prisma.kBArticle.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const article = await prisma.kBArticle.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200).replace(/[#*_]/g, ""),
        categoryId,
        isPublished: isPublished ?? false,
        createdById: session.user.id,
      },
    });

    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        const tagSlug = slugify(tagName);
        const tag = await prisma.kBTag.upsert({
          where: { slug: tagSlug },
          update: {},
          create: { name: tagName, slug: tagSlug },
        });
        await prisma.kBArticleTag.create({
          data: { articleId: article.id, tagId: tag.id },
        });
      }
    }

    await recordAuditEvent({
      classification: "KNOWLEDGE_BASE",
      action: "KB_ARTICLE_CREATED",
      summary: `${session.user.name || session.user.email || "Staff"} membuat artikel ${article.title}`,
      actor: actorFromSession(session),
      actorIp: getClientIp(req),
      resourceType: "KB_ARTICLE",
      resourceId: article.id,
      details: {
        categoryId: article.categoryId,
        isPublished: article.isPublished,
        tags: Array.isArray(tags) ? tags : [],
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("POST kb/articles error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

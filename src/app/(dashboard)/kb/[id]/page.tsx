"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Eye,
  Clock,
  FolderOpen,
  Tag,
  User,
  BookOpen,
} from "lucide-react";

interface KBArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
  createdBy: { name: string };
  tags: { tag: { name: string; slug: string } }[];
}

export default function KBArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<KBArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [params.id]);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/kb/articles/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setArticle(data);
        // Increment view count
        fetch(`/api/kb/articles/${data.id}/view`, { method: "POST" });
      }
    } catch (error) {
      console.error("Failed to fetch article:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-100 border-t-[#7C3AED]" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex h-96 items-center justify-center text-[#94A3B8]">
        Artikel tidak ditemukan
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <Button
        variant="ghost"
        className="mb-4 -ml-2 text-[#64748B] hover:text-[#1E293B] h-9 text-sm"
        onClick={() => router.push("/kb")}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Kembali ke Knowledge Base
      </Button>

      {/* Article */}
      <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="h-1 bg-[#7C3AED]" />
        <CardContent className="p-6 md:p-8">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              <FolderOpen className="mr-1 h-3 w-3" />
              {article.category.name}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
              <Eye className="h-3 w-3" />
              {article.viewCount} views
            </span>
            <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
              <Clock className="h-3 w-3" />
              {new Date(article.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
              <User className="h-3 w-3" />
              {article.createdBy.name}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold tracking-tight text-[#1E293B] mb-4">
            {article.title}
          </h1>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {article.tags.map((t) => (
                <span
                  key={t.tag.slug}
                  className="inline-flex items-center gap-1 rounded-md bg-[#F1F5F9] px-2.5 py-1 text-xs font-medium text-[#64748B]"
                >
                  <Tag className="h-3 w-3" />
                  {t.tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-sm max-w-none prose-headings:text-[#1E293B] prose-p:text-[#374151] prose-strong:text-[#1E293B] prose-li:text-[#374151]">
            {article.content.split("\n").map((paragraph, idx) => {
              if (paragraph.startsWith("# ")) {
                return (
                  <h2 key={idx} className="text-xl font-bold text-[#1E293B] mt-6 mb-3">
                    {paragraph.replace("# ", "")}
                  </h2>
                );
              }
              if (paragraph.startsWith("## ")) {
                return (
                  <h3 key={idx} className="text-lg font-semibold text-[#1E293B] mt-5 mb-2">
                    {paragraph.replace("## ", "")}
                  </h3>
                );
              }
              if (paragraph.startsWith("- ")) {
                return (
                  <li key={idx} className="ml-4 text-sm text-[#374151]">
                    {paragraph.replace("- ", "")}
                  </li>
                );
              }
              if (paragraph.trim() === "") {
                return null;
              }
              return (
                <p key={idx} className="text-sm text-[#374151] leading-relaxed mb-3">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

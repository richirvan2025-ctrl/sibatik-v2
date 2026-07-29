"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  BookOpen,
  Eye,
  Clock,
  FolderOpen,
  ArrowRight,
  Tag,
  ChevronDown,
  HelpCircle,
} from "lucide-react";

interface KBArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  viewCount: number;
  createdAt: string;
  category: { id: string; name: string };
  tags: { tag: { name: string; slug: string } }[];
}

interface KBCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  _count: { articles: number };
}

interface FAQItem { id: string; question: string; answer: string; }

export default function KBPage() {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetchCategories();
    fetchArticles();
    fetch("/api/kb/faqs").then((r) => r.json()).then(setFaqs).catch(() => {});
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/kb/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchArticles = async (categoryId?: string, query?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryId) params.append("category", categoryId);
      if (query) params.append("search", query);

      const res = await fetch(`/api/kb/articles?${params}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchArticles(selectedCategory || undefined, search || undefined);
  };

  const handleCategoryClick = (categoryId: string) => {
    const newCategory = selectedCategory === categoryId ? "" : categoryId;
    setSelectedCategory(newCategory);
    fetchArticles(newCategory || undefined, search || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">
          Knowledge Base
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Cari solusi dan panduan untuk masalah umum
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            placeholder="Cari artikel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 h-10 border-[#E2E8F0] bg-white rounded-xl text-sm focus:border-[#7C3AED]"
          />
        </div>
        <Button
          onClick={handleSearch}
          className="h-10 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-sm font-semibold"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === "" ? "default" : "outline"}
          onClick={() => handleCategoryClick("")}
          className={`h-9 rounded-xl text-sm ${
            selectedCategory === ""
              ? "bg-[#7C3AED] text-white"
              : "border-[#E2E8F0] text-[#64748B]"
          }`}
        >
          Semua
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            onClick={() => handleCategoryClick(cat.id)}
            className={`h-9 rounded-xl text-sm ${
              selectedCategory === cat.id
                ? "bg-[#7C3AED] text-white"
                : "border-[#E2E8F0] text-[#64748B]"
            }`}
          >
            {cat.name}
            <Badge
              variant="outline"
              className={`ml-1.5 text-[10px] ${
                selectedCategory === cat.id
                  ? "bg-white/20 text-white border-white/30"
                  : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]"
              }`}
            >
              {cat._count.articles}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Articles */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-100 border-t-[#7C3AED]" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <Link key={article.id} href={`/kb/${article.slug}`}>
              <Card className="group border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#7C3AED]">
                      <FolderOpen className="h-3 w-3" />
                      {article.category.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
                      <Eye className="h-3 w-3" />
                      {article.viewCount}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-[#1E293B] group-hover:text-[#7C3AED] transition-colors mb-2">
                    {article.title}
                  </h3>

                  <p className="text-sm text-[#64748B] line-clamp-2 mb-4 flex-1">
                    {article.excerpt || "Tidak ada deskripsi"}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-wrap gap-1.5">
                      {article.tags.slice(0, 3).map((t) => (
                        <span
                          key={t.tag.slug}
                          className="inline-flex items-center gap-1 rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-medium text-[#64748B]"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {t.tag.name}
                        </span>
                      ))}
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#CBD5E1] group-hover:text-[#7C3AED] group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!loading && articles.length === 0 && (
        <Card className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-[#E2E8F0] mb-3" />
            <p className="text-[#64748B] font-medium text-sm">
              Tidak ada artikel ditemukan
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">
              Coba ubah pencarian atau kategori
            </p>
          </CardContent>
        </Card>
      )}

      {/* FAQ */}
      {faqs.length > 0 && <div className="pt-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <HelpCircle className="h-5 w-5 text-[#7C3AED]" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#1E293B]">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-xs text-[#64748B]">
              Jawaban cepat untuk pertanyaan umum
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <Card
                key={idx}
                className="border border-[#E2E8F0] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#F8FAFC] transition-colors"
                >
                  <span className="text-sm font-semibold text-[#1E293B]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-0 border-t border-[#F1F5F9]">
                    <p className="text-sm text-[#64748B] leading-relaxed pt-3">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>}
    </div>
  );
}

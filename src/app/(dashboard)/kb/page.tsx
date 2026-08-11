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
    <div className="space-y-5 md:space-y-6">
      <section className="rounded-[16px] bg-[var(--brand-header)] px-5 py-6 text-white shadow-[0_12px_32px_rgba(4,76,113,0.18)] md:px-7 md:py-7">
        <div className="flex items-start gap-4">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-[#CFC3FF] sm:flex">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-[28px] font-bold tracking-[-0.03em]">Knowledge Base</h1>
            <p className="mt-1 text-sm text-[#BDCCE0]">Temukan panduan, jawaban, dan solusi mandiri untuk masalah umum.</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2.5">
          <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C8AA2]" />
          <Input
            aria-label="Cari artikel"
            placeholder="Cari artikel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-11 border-white bg-white pl-10 text-sm text-[#17223D] shadow-none"
          />
        </div>
        <Button
          onClick={handleSearch}
          className="h-11 bg-[#7047EB] px-4 text-white shadow-none hover:bg-[#805DF0]"
          aria-label="Cari artikel"
        >
          <Search className="h-4 w-4" />
        </Button>
        </div>
      </section>

      {/* Categories */}
      <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-[#DCE4EF] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <Button
          variant={selectedCategory === "" ? "default" : "outline"}
          onClick={() => handleCategoryClick("")}
          className={`h-9 rounded-xl text-sm ${
            selectedCategory === ""
              ? "bg-[#7047EB] text-white"
              : "border-[#DCE4EF] text-[#59667E]"
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
                ? "bg-[#7047EB] text-white"
                : "border-[#DCE4EF] text-[#59667E]"
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
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#E6E0FA] border-t-[#7047EB]" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <Link key={article.id} href={`/kb/${article.slug}`}>
              <Card className="group h-full cursor-pointer py-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#CFC4F6] hover:shadow-[0_10px_26px_rgba(29,43,76,0.09)]">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[#F0EDFF] px-2 py-1 text-xs font-semibold text-[#6742DE]">
                      <FolderOpen className="h-3 w-3" />
                      {article.category.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
                      <Eye className="h-3 w-3" />
                      {article.viewCount}
                    </span>
                  </div>

                  <h3 className="mb-2 text-base font-bold text-[#17223D] transition-colors group-hover:text-[#7047EB]">
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
                    <ArrowRight className="h-4 w-4 text-[#BBC4D2] transition-all group-hover:translate-x-1 group-hover:text-[#7047EB]" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!loading && articles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#F0EDFF] text-[#7047EB]"><BookOpen className="h-8 w-8" /></div>
            <p className="text-base font-bold text-[#26334D]">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EDFF]">
            <HelpCircle className="h-5 w-5 text-[#7047EB]" />
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
                className="overflow-hidden py-0"
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

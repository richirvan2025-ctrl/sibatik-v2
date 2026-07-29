"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Loader,
  CheckCircle2,
  BookOpen,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  action?: ChatAction;
}

interface ChatAction {
  type: "create_ticket" | "suggest_article" | "resolved";
  data: Record<string, any>;
}

interface PendingTicket {
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  priority: string;
}

export function ChatWidget() {
  const STORAGE_KEY = "vira_chat_messages";
  const defaultMessages: Message[] = [
    {
      role: "assistant",
      content: "Halo! 👋 Saya Vira, Asisten SIBATIK IDB Bali. Ada yang bisa saya bantu? Ceritakan masalahmu dan saya akan coba membantu menyelesaikannya atau membuatkan kamu tiket support.",
    },
  ];

  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTicket, setPendingTicket] = useState<PendingTicket | null>(null);
  const [ticketCreating, setTicketCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const handleClearChat = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages(defaultMessages);
    setPendingTicket(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages
            .filter((m) => !m.action || m.action.type !== "resolved")
            .map((m) => ({ role: m.role, content: m.content }))
            .concat([{ role: "user", content: inputValue }]),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Terjadi kesalahan: ${error.error || "Kesalahan server"}`,
          },
        ]);
        setIsLoading(false);
        return;
      }

      const data = (await res.json()) as { message: string; action?: ChatAction };

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          action: data.action,
        },
      ]);

      if (data.action?.type === "create_ticket") {
        setPendingTicket(data.action.data as PendingTicket);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Gagal menghubungi server. Coba lagi nanti.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTicket = async () => {
    if (!pendingTicket) return;

    setTicketCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pendingTicket.title,
          description: pendingTicket.description,
          categoryId: pendingTicket.categoryId,
          priority: pendingTicket.priority,
        }),
      });

      if (res.ok) {
        const ticket = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `✅ Tiket berhasil dibuat! Nomor tiket: **${ticket.ticketNumber}**\n\nTim support akan segera menghubungi Anda. Anda bisa melihat progress di halaman "Tiket Saya".`,
            action: { type: "resolved", data: {} },
          },
        ]);
        setPendingTicket(null);
      } else {
        const err = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Gagal membuat tiket: ${err.error || "Terjadi kesalahan"}. Silakan coba lagi atau hubungi IT Support secara langsung.`,
          },
        ]);
        setPendingTicket(null);
      }
    } catch (error) {
      console.error("Failed to create ticket:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Gagal membuat tiket. Coba lagi atau hubungi IT Support secara langsung.",
        },
      ]);
    } finally {
      setTicketCreating(false);
    }
  };

  const handleCancelTicket = () => {
    setPendingTicket(null);
  };

  const priorityColor: Record<string, { bg: string; text: string }> = {
    LOW: { bg: "bg-blue-50", text: "text-blue-700" },
    MEDIUM: { bg: "bg-yellow-50", text: "text-yellow-700" },
    HIGH: { bg: "bg-orange-50", text: "text-orange-700" },
    URGENT: { bg: "bg-red-50", text: "text-red-700" },
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-[#F8FAFC]">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED] overflow-hidden">
            <Image
              src="/images/vira.png"
              alt="Vira"
              width={40}
              height={40}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                (e.currentTarget.parentElement as HTMLElement).innerHTML =
                  '<span class="text-lg font-bold text-white">🤖</span>';
              }}
            />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#1E293B]">
              Vira — Asisten SIBATIK IDB Bali
            </h1>
            <p className="text-sm text-[#64748B]">
              Siap membantu menyelesaikan masalahmu
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            className="h-8 gap-1.5 border-[#E2E8F0] text-[#64748B] text-xs hover:bg-[#F8FAFC]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Mulai Baru
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-6 py-6">
        {messages.map((msg, idx) => (
          <div key={idx}>
            <div
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-[#7C3AED] text-white"
                    : "bg-white border border-[#E2E8F0] text-[#1E293B] shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>

            {msg.action?.type === "suggest_article" && (
              <div className="mt-3 flex justify-start">
                <a
                  href={`/kb/${msg.action.data.slug}`}
                  className="block w-full max-w-xs"
                >
                  <Card className="border border-[#E2E8F0] bg-white p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <BookOpen className="h-5 w-5 text-[#7C3AED]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1E293B] text-sm line-clamp-2">
                          {msg.action.data.title}
                        </p>
                        <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                          {msg.action.data.excerpt || "Lihat artikel lengkap"}
                        </p>
                      </div>
                    </div>
                  </Card>
                </a>
              </div>
            )}

            {msg.action?.type === "create_ticket" && !pendingTicket && (
              <div className="mt-3 flex justify-start">
                <Card className="border border-[#E2E8F0] bg-white p-4 w-full max-w-xs shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-[#0EA5E9]" />
                      <p className="font-semibold text-[#1E293B] text-sm">
                        Buat Tiket Support
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-xs text-[#64748B]">Kategori</p>
                        <p className="font-medium text-[#1E293B]">
                          {msg.action.data.categoryName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B]">Prioritas</p>
                        <Badge
                          className={`mt-1 text-xs ${
                            priorityColor[msg.action.data.priority]?.bg
                          } ${priorityColor[msg.action.data.priority]?.text}`}
                        >
                          {msg.action.data.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() =>
                          setPendingTicket(msg.action?.data as PendingTicket)
                        }
                        className="flex-1 h-9 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-lg"
                      >
                        Buat Tiket
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setMessages((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="flex-1 h-9 border-[#E2E8F0] text-[#64748B] text-xs font-semibold rounded-lg hover:bg-[#F8FAFC]"
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {msg.action?.type === "resolved" && (
              <div className="mt-3 flex justify-start">
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p>Masalah selesai tanpa perlu tiket</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-2xl px-4 py-3 shadow-sm">
              <Loader className="h-4 w-4 animate-spin text-[#7C3AED]" />
              <p className="text-sm text-[#64748B]">Sedang berpikir...</p>
            </div>
          </div>
        )}

        {pendingTicket && (
          <div className="mt-4 flex justify-start">
            <Card className="border border-[#E2E8F0] bg-white p-4 w-full max-w-xs shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[#7C3AED]" />
                  <p className="font-semibold text-[#1E293B] text-sm">
                    Konfirmasi Tiket
                  </p>
                </div>
                <div className="space-y-2 bg-[#F8FAFC] rounded-lg p-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Judul
                    </p>
                    <p className="text-[#1E293B] font-medium">
                      {pendingTicket.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Kategori
                    </p>
                    <p className="text-[#1E293B] font-medium">
                      {pendingTicket.categoryName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Prioritas
                    </p>
                    <Badge
                      className={`mt-1 text-xs ${
                        priorityColor[pendingTicket.priority]?.bg
                      } ${priorityColor[pendingTicket.priority]?.text}`}
                    >
                      {pendingTicket.priority}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleConfirmTicket}
                    disabled={ticketCreating}
                    className="flex-1 h-9 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                  >
                    {ticketCreating ? (
                      <>
                        <Loader className="mr-1 h-3 w-3 animate-spin" />
                        Membuat...
                      </>
                    ) : (
                      "Konfirmasi"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelTicket}
                    disabled={ticketCreating}
                    className="flex-1 h-9 border-[#E2E8F0] text-[#64748B] text-xs font-semibold rounded-lg hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    Ubah
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#E2E8F0] bg-white px-6 py-4 shadow-lg">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ketik pesan..."
            disabled={isLoading}
            className="h-10 flex-1 border-[#E2E8F0] bg-[#F8FAFC] rounded-xl text-sm focus:bg-white focus:border-[#7C3AED] disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="h-10 w-10 p-0 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl disabled:opacity-50 transition-all"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

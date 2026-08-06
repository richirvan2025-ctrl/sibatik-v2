import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchRelevantChunks } from "@/lib/rag";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!NVIDIA_API_KEY) {
      return NextResponse.json(
        { error: "Chatbot belum dikonfigurasi (API key missing)" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array required" },
        { status: 400 }
      );
    }

    // Ambil pesan terakhir user untuk RAG search
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";

    // Fetch semua konteks untuk AI
    const [categories, kbArticles, faqs, relevantChunks] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, department: true },
        orderBy: { name: "asc" },
      }),
      prisma.kBArticle.findMany({
        where: { isPublished: true },
        select: { id: true, title: true, slug: true, content: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.fAQ.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
      lastUserMessage
        ? searchRelevantChunks(lastUserMessage, 5).catch(() => [])
        : Promise.resolve([]),
    ]);

    // Build categories context
    const categoriesText = categories
      .map((c) => `- ID: ${c.id} | ${c.name}${c.department ? ` (${c.department})` : ""}`)
      .join("\n");

    // Build KB articles context (konten lengkap, truncate 1500 char)
    const kbText = kbArticles.length > 0
      ? kbArticles.map((a) =>
          `### ${a.title}\n${a.content.substring(0, 1500)}${a.content.length > 1500 ? "..." : ""}`
        ).join("\n---\n")
      : "(belum ada artikel)";

    // Build FAQ context
    const faqText = faqs.length > 0
      ? faqs.map((f) => `T: ${f.question}\nJ: ${f.answer}`).join("\n---\n")
      : "(belum ada FAQ)";

    // Build RAG context dari chunks relevan
    const docsText = relevantChunks.length > 0
      ? relevantChunks.map((c) =>
          `### ${c.docTitle} (${c.docCategory})\n${c.content}`
        ).join("\n---\n")
      : "(tidak ada referensi dokumen relevan)";

    // System prompt
    const systemPrompt = `# IDENTITAS
Nama: Vira
Peran: Asisten Virtual SIBATIK – IDB Bali (Institut Desain dan Bisnis Bali)
Dibuat oleh: Tim IT IDB Bali

# KEPRIBADIAN & KARAKTER
Kamu adalah Vira, asisten virtual SIBATIK IDB Bali. Kamu ramah, sabar, dan selalu siap membantu civitas akademika — mahasiswa, dosen, dan staf administrasi.
- Ramah dan hangat, seperti rekan kerja yang menyenangkan
- Sabar menjelaskan, terutama kepada pengguna awam teknologi
- Analitis dan sistematis dalam mendiagnosis masalah
- Tidak menghakimi — tidak ada pertanyaan yang terlalu bodoh
- Jujur jika masalah di luar kemampuanmu, segera arahkan ke tim IT

# ALUR PERCAKAPAN

## LANGKAH 1 — ARAHKAN KE KNOWLEDGE BASE (hanya pesan pertama)
Jika sistem memberi tanda bahwa ini pesan pertama user, sambut hangat dan arahkan ke Knowledge Base & FAQ di sidebar sebelum melanjutkan diagnosa.

## LANGKAH 2 — GALI INFORMASI
Ajukan MAKSIMAL 2 pertanyaan per giliran. Sesuaikan dengan jenis masalah:
- Akun/Login: Sudah pernah bisa login? Sudah coba reset password? Perangkat apa?
- Jaringan/WiFi: Lokasi di kampus? Perangkat & OS? Perangkat lain juga bermasalah?
- Software: Nama & versi aplikasi? OS? Kapan terakhir normal? Sudah coba restart?
- Hardware: Perangkat apa? Milik pribadi atau kampus? Gejala spesifik?

## LANGKAH 3 — ANALISIS & SOLUSI BERTAHAP
Berikan solusi dari yang termudah ke kompleks:
🔍 Analisis singkat penyebab
✅ Langkah penyelesaian bernomor
💡 Tips tambahan jika ada
Akhiri dengan menanyakan apakah masalah teratasi.

## LANGKAH 4 — VERIFIKASI
Tanyakan hasil setelah solusi. Jika berhasil → tutup ramah. Jika belum → coba solusi lain atau lanjut ke Langkah 5.

## LANGKAH 5 — BUAT TIKET
Jika masalah tetap tidak terselesaikan, tawarkan pembuatan tiket dengan hangat. Gunakan action create_ticket (lihat FORMAT RESPONS) — rangkum masalah dari percakapan secara otomatis sebagai description.

# RUANG LINGKUP BANTUAN
- Akun & Akses: Login SIAKAD, email kampus, portal, reset password, hak akses
- Jaringan: WiFi kampus, VPN, koneksi internet di area kampus
- Hardware: Komputer lab, printer, proyektor, scanner, laptop/PC kampus
- Software: Instalasi & aktivasi software berlisensi, Zoom, MS Office, Google Workspace, LMS
- Layanan IT Umum: Pembuatan akun baru, laporan kerusakan fasilitas IT

# BATASAN
- TIDAK menangani masalah akademik (nilai, jadwal, KRS) → arahkan ke Bagian Akademik
- TIDAK menangani masalah keuangan → arahkan ke Bagian Keuangan
- TIDAK memberikan password milik orang lain
- Hardware perlu penanganan fisik → buat tiket, arahkan ke teknisi lapangan

# ESKALASI DARURAT
Jika masalah sangat mendesak: "Kamu bisa langsung menghubungi Tim IT IDB Bali di Ruang IT Support kampus. Jam layanan: Senin–Jumat, 08.00–16.00 WITA."

# DATA SISTEM

KATEGORI TIKET YANG TERSEDIA (gunakan categoryId ini saat create_ticket):
${categoriesText}

=== KNOWLEDGE BASE ===
${kbText}

=== FAQ ===
${faqText}

=== DOKUMEN INTERNAL (SOP, Peraturan, Panduan) ===
${docsText}

# BATASAN TOPIK
Jawab HANYA pertanyaan yang berkaitan dengan layanan SIBATIK, IT support, dan operasional kampus IDB Bali. Jika pengguna bertanya di luar konteks ini (politik, hiburan, umum, dll), tolak dengan sopan: "Maaf, saya hanya bisa membantu dalam konteks layanan SIBATIK dan IT support kampus IDB Bali. Ada yang bisa saya bantu terkait sistem atau layanan kampus?"

# FORMAT RESPONS — WAJIB
SELALU respond dalam format JSON valid. JANGAN gunakan markdown, backtick, atau teks di luar JSON.

{"message": "Pesan kepada user (bahasa Indonesia, ramah)", "action": null}

Atau dengan action:

Suggest artikel KB:
{"message": "...", "action": {"type": "suggest_article", "data": {"title": "judul artikel", "slug": "slug-artikel", "excerpt": "ringkasan"}}}

Buat tiket:
{"message": "...", "action": {"type": "create_ticket", "data": {"title": "Judul singkat 2-5 kata", "description": "Deskripsi detail dari percakapan", "categoryId": "id-kategori", "categoryName": "Nama Kategori", "priority": "LOW|MEDIUM|HIGH|URGENT"}}}

Selesai tanpa tiket:
{"message": "...", "action": {"type": "resolved", "data": {"solution": "solusi yang diberikan"}}}

PRIORITAS: LOW=info umum, MEDIUM=masalah teknis biasa, HIGH=mengganggu pekerjaan, URGENT=sistem down total.`;

    const isFirstMessage = messages.filter((m) => m.role === "user").length === 1;
    const firstMessageHint = isFirstMessage
      ? "\n\n[SISTEM] Ini adalah pesan pertama user dalam sesi ini. Ikuti LANGKAH 1: sambut hangat dan arahkan ke Knowledge Base & FAQ di sidebar sebelum melanjutkan."
      : "";

    // Call NVIDIA NIM API
    const response = await fetch(NVIDIA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [{ role: "system", content: systemPrompt + firstMessageHint }, ...messages],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("NVIDIA API error:", error);
      return NextResponse.json(
        { error: "Chatbot error: " + error },
        { status: response.status }
      );
    }

    const data = (await response.json()) as any;
    const aiMessage = data.choices?.[0]?.message?.content;

    if (!aiMessage) {
      return NextResponse.json(
        { error: "No response from chatbot" },
        { status: 500 }
      );
    }

    // Parse JSON response dari AI — strip markdown backticks jika ada
    let parsedResponse: any = null;
    try {
      const cleaned = aiMessage
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      parsedResponse = JSON.parse(cleaned);
    } catch (e) {
      // Fallback: coba ekstrak field "message" via regex jika JSON terpotong/rusak
      const match = aiMessage.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (match) {
        return NextResponse.json({
          message: match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'),
          action: null,
        });
      }
      // Jika tidak ada sama sekali, tampilkan raw text
      return NextResponse.json({
        message: aiMessage,
        action: null,
      });
    }

    // Validate action jika ada
    if (parsedResponse.action) {
      const action = parsedResponse.action;

      // Validate create_ticket action
      if (action.type === "create_ticket") {
        const { categoryId, title, description, priority } = action.data;
        if (!categoryId || !title || !description || !priority) {
          return NextResponse.json({
            message: parsedResponse.message || "Informasi tiket tidak lengkap",
            action: null,
          });
        }
        // Verify categoryId exists
        const category = categories.find((c) => c.id === categoryId);
        if (!category) {
          action.data.categoryName = "Umum";
        } else {
          action.data.categoryName = category.name;
        }
      }

      // Validate suggest_article action
      if (action.type === "suggest_article") {
        const { slug } = action.data;
        const article = kbArticles.find((a) => a.slug === slug);
        if (!article) {
          return NextResponse.json({
            message:
              parsedResponse.message ||
              "Saya tidak menemukan artikel yang relevan",
            action: null,
          });
        }
      }
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

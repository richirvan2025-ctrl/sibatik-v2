# SIBATIK IDB Bali

SIBATIK adalah sistem support ticket untuk civitas akademika Institut Desain dan Bisnis Bali. Sistem ini memungkinkan mahasiswa, dosen, dan staf mengajukan tiket dukungan IT dan layanan kampus, serta dilengkapi AI Asisten (Vira) berbasis RAG.

## Fitur

### Tiket Support
- Buat, lacak, dan kelola tiket dengan kategori hierarki 2 level
- Auto-assign tiket ke supervisor berdasarkan departemen kategori
- Status tiket: Open → In Progress → Resolved → Closed
- Prioritas: Low, Medium, High, Urgent
- Lampiran file (gambar, PDF, dokumen)
- Komentar internal dan eksternal
- Rating kepuasan setelah tiket selesai
- SLA tracking (response time & resolve time)

### Role & Akses
| Role | Akses |
|------|-------|
| ADMIN | Semua fitur, manajemen user, laporan, KB Admin |
| AGENT | Tiket divisi & tiket sendiri, dashboard performance |
| SUPERVISOR | Tiket divisi, tiket sendiri, dashboard agent performance |
| USER | Tiket sendiri, knowledge base, AI asisten |
| EXECUTIVE | Monitor semua tiket, laporan |

### Knowledge Base
- Artikel dengan kategori dan tag
- FAQ yang bisa dikelola admin
- Dokumen internal (SOP, peraturan, panduan) — digunakan sebagai referensi AI

### AI Asisten Vira
- Chatbot SIBATIK berbasis LLM (NVIDIA NIM)
- RAG (Retrieval-Augmented Generation) menggunakan dokumen internal, KB, dan FAQ
- Embedding via NVIDIA `nvidia/nv-embedqa-e5-v5`
- Bisa membuat tiket langsung dari percakapan
- Hanya menjawab dalam konteks layanan SIBATIK kampus

### Dashboard
- Statistik tiket per role (total, open, in progress, resolved)
- Agent Performance chart untuk SUPERVISOR (tiket masuk vs selesai, rating distribusi)
- Card statistik bisa diklik untuk filter tiket

## Stack Teknologi

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS v4, Shadcn/ui
- **Database**: SQLite (via Prisma ORM)
- **Identity**: Adapter identitas Sinergy dengan fallback khusus development
- **AI**: NVIDIA NIM API (LLM + Embedding)
- **File storage**: Local filesystem (`public/uploads/`)
- **PDF parsing**: pdf-parse v1
- **DOCX parsing**: mammoth

## Setup Development

### Prasyarat
- Node.js 20+
- npm

### 1. Clone & Install

```bash
git clone https://github.com/USERNAME/sibatik.git
cd sibatik
npm install
```

### 2. Buat file `.env`

```env
# Database
DATABASE_URL="file:./dev.db"

# Pengguna lokal untuk development (harus sudah ada di database)
SIBATIK_DEV_USER_EMAIL="admin@idbbali.ac.id"

# NVIDIA NIM (LLM + Embedding untuk AI Asisten)
NVIDIA_API_KEY="nvapi-xxxxxxxxxxxx"
NVIDIA_MODEL="meta/llama-3.1-8b-instruct"

```

SIBATIK tidak menyediakan halaman login atau logout mandiri. Pada production,
identitas pengguna harus diberikan oleh Sinergy melalui adapter di
`src/lib/auth.ts`. Fallback `SIBATIK_DEV_USER_EMAIL` hanya untuk development.

### 3. Setup Database

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### 4. Jalankan Dev Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).



## Struktur Direktori

```
src/
  app/
    (auth)/          # Alias lama yang langsung menuju dashboard
    (dashboard)/     # Modul SIBATIK setelah identitas Sinergy tersedia
      dashboard/     # Dashboard utama
      tickets/       # Daftar & detail tiket
      admin/         # Halaman admin (users, categories, KB, reports)
      chat/          # AI Asisten Vira
      kb/            # Knowledge Base
    api/             # API routes
  components/
    ui/              # Shadcn components
    layout/          # Shell, sidebar, header
    chat/            # Chat widget
    dashboard/       # Dashboard components (agent performance chart)
  lib/
    auth.ts          # Adapter identitas Sinergy / development
    auth-types.ts    # Kontrak session dan role SIBATIK
    prisma.ts        # Prisma client
    rag.ts           # RAG utilities (chunking, embedding, search)
prisma/
  schema.prisma      # Database schema
  seed.ts            # Data seed
  migrations/        # Migration files
```

## Panduan Deployment

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk panduan lengkap deploy ke VPS Ubuntu.

# Helpdesk IDB Bali

Sistem helpdesk dan support ticket untuk civitas akademika Institut Desain dan Bisnis Bali. Memungkinkan mahasiswa, dosen, dan staf mengajukan tiket dukungan IT dan layanan kampus, serta dilengkapi AI Asisten (Vira) berbasis RAG.

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
- Chatbot helpdesk berbasis LLM (NVIDIA NIM)
- RAG (Retrieval-Augmented Generation) menggunakan dokumen internal, KB, dan FAQ
- Embedding via NVIDIA `nvidia/nv-embedqa-e5-v5`
- Bisa membuat tiket langsung dari percakapan
- Hanya menjawab dalam konteks helpdesk kampus

### Dashboard
- Statistik tiket per role (total, open, in progress, resolved)
- Agent Performance chart untuk SUPERVISOR (tiket masuk vs selesai, rating distribusi)
- Card statistik bisa diklik untuk filter tiket

## Stack Teknologi

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS v4, Shadcn/ui
- **Database**: SQLite (via Prisma ORM)
- **Auth**: NextAuth v5 (credentials + Microsoft OAuth)
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
git clone https://github.com/USERNAME/helpdesk-idb.git
cd helpdesk-idb
npm install
```

### 2. Buat file `.env`

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="random-string-minimal-32-karakter"
NEXTAUTH_URL="http://localhost:3000"

# NVIDIA NIM (LLM + Embedding untuk AI Asisten)
NVIDIA_API_KEY="nvapi-xxxxxxxxxxxx"
NVIDIA_MODEL="meta/llama-3.1-8b-instruct"

# Microsoft OAuth (opsional)
# AUTH_MICROSOFT_ENTRA_ID_ID="client-id"
# AUTH_MICROSOFT_ENTRA_ID_SECRET="client-secret"
# AUTH_MICROSOFT_ENTRA_ID_TENANT_ID="tenant-id"
```

Generate `NEXTAUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

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
    (auth)/          # Login page
    (dashboard)/     # Semua halaman setelah login
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
    auth.ts          # NextAuth config
    prisma.ts        # Prisma client
    rag.ts           # RAG utilities (chunking, embedding, search)
prisma/
  schema.prisma      # Database schema
  seed.ts            # Data seed
  migrations/        # Migration files
```

## Panduan Deployment

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk panduan lengkap deploy ke VPS Ubuntu.

# Aplikasi Web Support Ticket - Kampus IDB Bali

## Ringkasan
Aplikasi SIBATIK internal untuk Kampus IDB Bali yang memungkinkan staff kampus dan dosen membuat tiket support, Tim IT menangani tiket, dan administrator mengelola sistem.

## Asumsi
- Menggunakan stack **Next.js 15 Fullstack (App Router)** untuk kesederhanaan development dan deployment
- Database **PostgreSQL** dengan Prisma ORM
- Autentikasi menggunakan **NextAuth.js** dengan Credentials Provider (email/password) dan **Microsoft Entra ID / Azure AD OAuth**
- Styling **Tailwind CSS** + **shadcn/ui**
- File upload disimpan ke local storage (dapat dimigrasi ke cloud storage nanti)

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js v5 (Auth.js) + Microsoft Entra ID OAuth |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| State Management | React Query (TanStack Query) |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |

---

## Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  password      String?   // hashed with bcrypt (nullable untuk user OAuth)
  role          Role      @default(USER)
  department    String?
  phone         String?
  isActive      Boolean   @default(true)
  provider      String    @default("credentials") // credentials | microsoft
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  createdTickets Ticket[] @relation("CreatedTickets")
  assignedTickets Ticket[] @relation("AssignedTickets")
  comments       TicketComment[]
  attachments    TicketAttachment[]
  ownedTickets   Ticket[] @relation("TicketOwner")
  accounts       Account[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Ticket {
  id            String        @id @default(cuid())
  ticketNumber  String        @unique // format: TKT-2026-00001
  title         String
  description   String        @db.Text
  status        TicketStatus  @default(OPEN)
  priority      Priority      @default(MEDIUM)
  categoryId    String
  createdById   String
  onBehalfOfId  String?       // ID user yang sebenarnya punya masalah (jika dibuatkan oleh technician/admin)
  assignedToId  String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  resolvedAt    DateTime?
  closedAt      DateTime?
  rating        Int?
  feedback      String?
  firstResponseAt DateTime?   // waktu technician pertama kali merespon (komentar/status update)
  slaBreached   Boolean     @default(false)  // true jika melewati SLA resolve time
  responseSlaBreached Boolean @default(false)  // true jika melewati SLA response time

  category      Category      @relation(fields: [categoryId], references: [id])
  createdBy     User          @relation("CreatedTickets", fields: [createdById], references: [id])
  onBehalfOf    User?         @relation("TicketOwner", fields: [onBehalfOfId], references: [id])
  assignedTo    User?         @relation("AssignedTickets", fields: [assignedToId], references: [id])
  comments      TicketComment[]
  attachments   TicketAttachment[]
}

model TicketComment {
  id          String   @id @default(cuid())
  ticketId    String
  userId      String
  message     String   @db.Text
  isInternal  Boolean  @default(false) // hanya visible untuk technician & admin
  createdAt   DateTime @default(now())

  ticket      Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])
}

model TicketAttachment {
  id          String   @id @default(cuid())
  ticketId    String
  fileName    String
  fileUrl     String
  fileSize    Int
  mimeType    String
  uploadedById String
  createdAt   DateTime @default(now())

  ticket      Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  uploadedBy  User     @relation(fields: [uploadedById], references: [id])
}

model Category {
  id                String   @id @default(cuid())
  name              String   @unique
  description       String?
  responseTimeHours Int      @default(24)  // SLA: waktu response dalam jam
  resolveTimeHours  Int      @default(72)  // SLA: waktu resolve dalam jam
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())

  tickets           Ticket[]
}

enum Role {
  ADMIN
  USER
  TECHNICIAN
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
  ESCALATED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

---

## Struktur Folder

```
support-ticket-idb-bali/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── tickets/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   ├── categories/
│   │   │   │   └── page.tsx
│   │   │   └── reports/
│   │   │       └── page.tsx
│   │   ├── technician/
│   │   │   └── tickets/
│   │   │       └── page.tsx
│   │   ├── layout.tsx          # Sidebar + Header dengan role-based nav
│   │   └── page.tsx            # Redirect ke /dashboard
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── tickets/
│   │   │   ├── route.ts        # GET list, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts    # GET detail, PATCH update, DELETE
│   │   │       ├── comments/
│   │   │       │   └── route.ts
│   │   │       └── assign/
│   │   │           └── route.ts
│   │   ├── users/
│   │   │   └── route.ts
│   │   ├── categories/
│   │   │   └── route.ts
│   │   └── dashboard/
│   │       └── stats/
│   │           └── route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── auth/
│   │   └── login-form.tsx
│   ├── tickets/
│   │   ├── ticket-list.tsx
│   │   ├── ticket-card.tsx
│   │   ├── ticket-detail.tsx
│   │   ├── ticket-form.tsx
│   │   ├── ticket-filters.tsx
│   │   ├── status-badge.tsx
│   │   ├── priority-badge.tsx
│   │   └── comment-section.tsx
│   ├── dashboard/
│   │   ├── stats-cards.tsx
│   │   ├── recent-tickets.tsx
│   │   └── chart-ticket-status.tsx
│   ├── admin/
│   │   ├── user-table.tsx
│   │   ├── user-form.tsx
│   │   ├── category-table.tsx
│   │   └── category-form.tsx
│   ├── layout/
│   │   ├── sidebar.tsx         # Role-based navigation
│   │   ├── header.tsx
│   │   └── mobile-nav.tsx
│   └── shared/
│       ├── data-table.tsx
│       ├── pagination.tsx
│       ├── search-input.tsx
│       └── file-upload.tsx
├── lib/
│   ├── prisma.ts               # Singleton PrismaClient
│   ├── auth.ts                 # NextAuth config
│   ├── utils.ts                # cn() helper
│   └── api.ts                  # API response helpers
├── hooks/
│   ├── use-tickets.ts
│   ├── use-ticket.ts
│   ├── use-users.ts
│   └── use-dashboard-stats.ts
├── types/
│   └── index.ts                # Shared TypeScript types
├── prisma/
│   └── schema.prisma
├── public/
│   └── uploads/                # File upload directory
├── middleware.ts               # Route protection by role
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## Role & Fitur

### 1. Administrator
- **Dashboard**: Statistik total tiket (open, in-progress, resolved, closed), tiket per kategori, tiket per technician, grafik trend, SLA breach summary
- **Manajemen User**: CRUD user (staff, dosen, technician), aktif/nonaktifkan user
- **Manajemen Kategori**: CRUD kategori tiket + konfigurasi SLA (response time & resolve time)
- **Semua Tiket**: Lihat, filter, search seluruh tiket di sistem dengan indikator SLA
- **Assign Technician**: Alihkan tiket ke technician tertentu
- **Laporan**: Export data tiket (CSV/Excel), filter by date range, status, priority, SLA status
- **Performance Report**: Lihat performance per technician (SLA compliance, avg resolution time, ticket count, rating)
- **Internal Notes**: Baca dan tulis komentar internal (tidak terlihat oleh user)
- **Buat Tiket untuk User**: Admin bisa membuat tiket atas nama staff/dosen

### 2. User (Staff / Dosen)
- **Login**: Login dengan Microsoft Account (akun kampus) atau email/password (jika dibuatkan admin)
- **Dashboard**: Ringkasan tiket saya (total, open, resolved)
- **Buat Tiket**: Form dengan judul, kategori, prioritas, deskripsi, attachment
- **Daftar Tiket Saya**: Lihat semua tiket yang pernah dibuat dengan filter dan search
- **Detail Tiket**: Lihat status, riwayat komentar, tambah komentar follow-up
- **Rating**: Beri rating (1-5) dan feedback setelah tiket resolved
- **Notifikasi**: Badge/notifikasi saat ada update pada tiket mereka

### 3. Technician (Tim IT)
- **Dashboard**: Tiket yang perlu ditangani, tiket sedang dikerjakan, tiket selesai hari ini
- **Daftar Tiket**: Lihat tiket yang diassign ke mereka + tiket OPEN yang belum diassign
- **Detail Tiket**: Update status (OPEN -> IN_PROGRESS -> RESOLVED), tambah komentar
- **Internal Notes**: Tulis catatan internal (tidak terlihat oleh user)
- **Escalate**: Alihkan tiket ke technician lain atau admin jika perlu
- **Reassign**: Kembalikan tiket ke pool jika tidak bisa handle
- **Buat Tiket untuk User**: Technician bisa membuat tiket atas nama staff/dosen
- **SLA Visibility**: Lihat countdown SLA di detail tiket untuk prioritaskan pekerjaan

---

## Routing & Middleware

### Route Protection (`middleware.ts`)
| Path | Allowed Roles |
|------|---------------|
| `/dashboard` | All |
| `/tickets/*` | All |
| `/admin/*` | ADMIN only |
| `/technician/*` | ADMIN, TECHNICIAN |

### Navigation Sidebar (Role-based)
```
ADMIN:
  - Dashboard
  - Semua Tiket
  - Buat Tiket untuk User
  - Manajemen User
  - Kategori
  - Laporan

USER:
  - Dashboard
  - Tiket Saya
  - Buat Tiket Baru

TECHNICIAN:
  - Dashboard
  - Tiket Saya
  - Tiket Terbuka
  - Buat Tiket untuk User
```

---

## API Endpoints

### Auth
- `POST /api/auth/[...nextauth]` - Login/Logout (NextAuth)

### Tickets
- `GET /api/tickets` - List tiket (filtered by role: user=own, technician=assigned+open, admin=all)
- `POST /api/tickets` - Buat tiket baru (user sendiri atau atas nama user lain oleh admin/technician)
- `GET /api/tickets/[id]` - Detail tiket
- `PATCH /api/tickets/[id]` - Update status, priority, assignee
- `DELETE /api/tickets/[id]` - Hapus tiket (admin only)
- `POST /api/tickets/[id]/comments` - Tambah komentar
- `POST /api/tickets/[id]/assign` - Assign technician

### Users
- `GET /api/users` - List user (admin & technician untuk dropdown "buat tiket untuk user")
- `POST /api/users` - Create user (admin only)
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Soft delete

### Categories
- `GET /api/categories` - List kategori (dengan SLA config)
- `POST /api/categories` - Create kategori dengan SLA config (admin)
- `PATCH /api/categories/[id]` - Update kategori + SLA config
- `DELETE /api/categories/[id]` - Delete

### Dashboard
- `GET /api/dashboard/stats` - Statistik untuk dashboard (role-based)
- `GET /api/dashboard/performance` - Performance report per technician (admin)
- `GET /api/dashboard/sla` - SLA breach summary per kategori (admin)

---

## Autentikasi & Microsoft OAuth

### Login Methods
User bisa login dengan 2 cara:
1. **Email / Password** (Credentials Provider) - untuk user yang dibuat manual oleh admin
2. **Microsoft Account** (Azure AD / Microsoft Entra ID OAuth) - untuk staff/dosen dengan akun kampus

### Microsoft Entra ID Setup
1. Register aplikasi di **Azure Portal** > Microsoft Entra ID > App Registrations
2. Tambahkan platform **Web** dengan redirect URI: `http://localhost:3000/api/auth/callback/microsoft-entra-id` (dev) dan `https://domain.com/api/auth/callback/microsoft-entra-id` (prod)
3. Catat **Application (client) ID** dan buat **Client Secret**
4. Konfigurasi token: enable `id_token` + `access_token`, scope: `openid profile email`
5. Pastikan domain email kampus (misal: `@idbbali.ac.id`) di-whitelist

### NextAuth Config (`lib/auth.ts`)
```typescript
providers: [
  CredentialsProvider({ ... }), // existing email/password
  MicrosoftEntraIDProvider({
    clientId: process.env.MICROSOFT_ENTRA_ID_CLIENT_ID!,
    clientSecret: process.env.MICROSOFT_ENTRA_ID_CLIENT_SECRET!,
    issuer: process.env.MICROSOFT_ENTRA_ID_ISSUER, // optional: untuk tenant-specific
  }),
]
```

### User Registration Flow
**Tidak ada self-registration publik.** User masuk ke sistem hanya melalui 2 cara:

1. **Microsoft OAuth (Auto-Register)**
   - Staff/dosen login dengan akun Microsoft kampus
   - Jika email belum terdaftar → sistem **auto-create** user dengan role default `USER`
   - Jika email sudah terdaftar (dibuat manual admin) → **link account** ke user existing
   - Admin bisa ubah role user OAuth kapan saja

2. **Admin Create User (Manual)**
   - Admin buat akun via dashboard untuk:
     - Technician yang tidak punya akun Microsoft
     - Staff tamu/outsourcing
     - User dengan role khusus (Admin, Technician)
   - Admin isi: nama, email, role, departemen, password sementara
   - User pertama kali login dengan email/password → wajib ganti password

### User Linking / Auto-Create
- Jika user login dengan Microsoft dan email belum terdaftar: **auto-create user** dengan role default `USER`
- Jika email sudah terdaftar (dibuat manual admin): **link account** ke user existing
- Admin bisa mengubah role user OAuth seperti user biasa

### Environment Variables
```
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/support_ticket"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Microsoft Entra ID OAuth
MICROSOFT_ENTRA_ID_CLIENT_ID="your-client-id"
ICROSOFT_ENTRA_ID_CLIENT_SECRET="your-client-secret"
MICROSOFT_ENTRA_ID_ISSUER="https://login.microsoftonline.com/{tenant-id}/v2.0" # opsional
```

---

## UI/UX Design

### Color Palette (IDB Bali Theme)
- Primary: `#1e40af` (Biru kampus)
- Secondary: `#0f766e` (Teal)
- Success: `#16a34a`
- Warning: `#ca8a04`
- Danger: `#dc2626`
- Background: `#f8fafc`
- Card: `#ffffff`

### Status Badge Colors
- OPEN: `bg-blue-100 text-blue-800`
- IN_PROGRESS: `bg-yellow-100 text-yellow-800`
- RESOLVED: `bg-green-100 text-green-800`
- CLOSED: `bg-gray-100 text-gray-800`
- ESCALATED: `bg-red-100 text-red-800`

### Priority Badge Colors
- LOW: `bg-gray-100 text-gray-800`
- MEDIUM: `bg-blue-100 text-blue-800`
- HIGH: `bg-orange-100 text-orange-800`
- URGENT: `bg-red-100 text-red-800`

---

## Ticket Flow

```
[User / Admin / Technician] --create--> [OPEN]
                      |
                      v
[Admin] --assign--> [IN_PROGRESS]
                      |
          [Technician] --work-->
                      |
                      v
              [RESOLVED]
                      |
                      v
[User] --confirm/rate--> [CLOSED]
                      |
              [ESCALATED] (jika perlu)
```

---

## SLA (Service Level Agreement) & Performance Tracking

### SLA per Kategori
Setiap kategori tiket memiliki konfigurasi SLA yang bisa diatur oleh admin:

| Field | Deskripsi | Default |
|-------|-----------|---------|
| **Response Time** | Maksimal waktu technician merespon (jam) | 24 jam |
| **Resolve Time** | Maksimal waktu penyelesaian tiket (jam) | 72 jam |

**Contoh SLA per Kategori**:
- **IT Support (Hardware)**: Response 4 jam, Resolve 24 jam
- **Jaringan / WiFi**: Response 2 jam, Resolve 8 jam
- **Sistem Akademik**: Response 4 jam, Resolve 48 jam
- **Fasilitas**: Response 24 jam, Resolve 72 jam
- **Keuangan**: Response 24 jam, Resolve 48 jam

### SLA Tracking di Tiket
Field tambahan di tabel Ticket untuk tracking SLA:
- `firstResponseAt`: Waktu technician pertama kali merespon (update status/komentar)
- `slaBreached`: True jika tiket melewati batas resolve time
- `responseSlaBreached`: True jika tiket melewati batas response time

### Indikator SLA di UI
- **Badge hijau**: Dalam batas SLA
- **Badge merah**: SLA breached (melewati batas waktu)
- **Countdown timer**: Sisa waktu SLA di detail tiket (untuk technician)

### Performance Report (Admin)
Dashboard performance per technician:

| Metrik | Deskripsi |
|--------|-----------|
| **Total Tiket** | Jumlah tiket yang dihandle |
| **Avg Response Time** | Rata-rata waktu merespon |
| **Avg Resolution Time** | Rata-rata waktu menyelesaikan |
| **SLA Compliance Rate** | Persentase tiket yang selesai dalam SLA |
| **Response SLA Rate** | Persentase response dalam batas SLA |
| **Customer Rating** | Rata-rata rating dari user |

### Performance Report per Kategori
- SLA breach rate per kategori
- Rata-rata waktu resolve per kategori
- Technician dengan performance terbaik per kategori

---

## Implementasi Step-by-Step

### Phase 1: Setup Project
1. Inisialisasi Next.js project dengan shadcn/ui
2. Install dependencies: Prisma, NextAuth, React Query, Zod, date-fns, bcryptjs
3. Setup Prisma schema dan database PostgreSQL
4. Konfigurasi NextAuth dengan Credentials provider dan Microsoft Entra ID OAuth
5. Setup middleware untuk route protection

### Phase 2: Autentikasi & Layout
1. Halaman Login dengan form validation (Zod) + tombol "Login dengan Microsoft"
2. Dashboard layout dengan sidebar responsif
3. Role-based navigation
4. Logout functionality
5. Seed data: Admin default, beberapa kategori

### Phase 3: Tiket Management (User)
1. Form buat tiket baru (judul, kategori, prioritas, deskripsi, attachment)
2. Daftar tiket user dengan pagination, search, filter
3. Detail tiket dengan timeline komentar
4. Rating dan feedback setelah resolved

### Phase 4: Technician Features
1. Dashboard technician
2. List tiket yang diassign + tiket OPEN
3. Update status tiket
4. Internal notes
5. Escalate/Reassign
6. Buat tiket atas nama user

### Phase 5: Admin Features
1. Dashboard admin dengan statistik
2. Manajemen user (CRUD)
3. Manajemen kategori + konfigurasi SLA per kategori (response time & resolve time)
4. Semua tiket view dengan indikator SLA breach
5. Assign technician
6. Laporan / export
7. Buat tiket atas nama user
8. Performance Report per technician (SLA compliance, avg resolution time, ticket count)

### Phase 6: Polish
1. Loading states
2. Error handling
3. Toast notifications (Sonner)
4. Responsive mobile
5. Dark mode (opsional)

---

## Verification

### Testing Manual
1. **Login Flow**: Login sebagai admin, user, technician - verifikasi redirect dan sidebar sesuai role
2. **Create Ticket**: User membuat tiket -> verifikasi muncul di dashboard technician
3. **Create Ticket on Behalf**: Technician/Admin buat tiket untuk user -> verifikasi muncul di tiket user tersebut
4. **Assign & Resolve**: Admin assign ke technician -> technician update ke RESOLVED -> user beri rating
5. **Permission**: Coba akses /admin sebagai user -> harus redirect ke dashboard
6. **Internal Notes**: Technician tulis internal note -> verifikasi tidak terlihat oleh user
7. **SLA Tracking**: Buat tiket -> tunggu melewati response time -> verifikasi badge SLA breached muncul
8. **SLA Config**: Admin ubah SLA kategori -> buat tiket baru -> verifikasi SLA countdown sesuai konfigurasi
9. **Performance Report**: Resolve beberapa tiket -> cek dashboard performance -> verifikasi metrik akurat

### Data Validation
- Ticket number auto-generate format `TKT-YYYY-NNNNN`
- Email harus unik
- Role hanya boleh ADMIN, USER, TECHNICIAN
- Status transition validasi (tidak bisa langsung OPEN ke CLOSED tanpa RESOLVED)
- `onBehalfOfId` hanya boleh diisi oleh ADMIN atau TECHNICIAN
- `onBehalfOfId` harus merujuk ke user dengan role USER
- SLA hours harus > 0
- `firstResponseAt` hanya di-set sekali (saat technician pertama merespon)
- User OAuth (Microsoft) tidak punya password (nullable)
- Auto-create user dari Microsoft login menggunakan domain email sebagai validasi

# SIBATIK — Modul Support Ticket Sinergy

## Ringkasan

SIBATIK adalah modul support ticket internal IDB Bali yang berjalan sebagai
bagian dari sistem utama **Sinergy**. Modul tidak memiliki proses login,
password, pendaftaran akun, atau logout mandiri.

## Arsitektur Identitas

Sinergy bertanggung jawab atas:

- autentikasi pengguna;
- masa hidup sesi;
- login dan logout;
- identitas utama pengguna.

SIBATIK bertanggung jawab atas:

- memetakan identitas Sinergy ke record `User` lokal;
- role SIBATIK (`ADMIN`, `USER`, `AGENT`, `SUPERVISOR`, `EXECUTIVE`);
- divisi pengguna;
- otorisasi data dan operasi pada setiap Route Handler.

Semua akses identitas dipusatkan di `src/lib/auth.ts`. Implementasi sementara
memakai `SIBATIK_DEV_USER_EMAIL` hanya saat development. Production wajib
mengganti resolver tersebut dengan identitas SSO terverifikasi dari Sinergy.

## Prinsip Keamanan

- Tidak ada anonymous production fallback.
- Data sensitif selalu diperiksa kembali di Route Handler, dekat sumber data.
- Layout role menjaga pengalaman navigasi, sedangkan API menjadi batas
  otorisasi utama.
- Header atau cookie dari browser tidak boleh dipercaya sebelum alur Sinergy,
  reverse proxy, signature, dan aturan stripping header dipastikan.
- SIBATIK hanya menerima atribut minimum: ID/email, nama, role, dan divisi.

## Stack

| Layer | Teknologi |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| Database | SQLite dan Prisma |
| Identity | Adapter Sinergy SSO |
| Validation | Zod |
| AI | NVIDIA NIM + RAG |

## Alur Target

1. Pengguna masuk ke Sinergy.
2. Pengguna memilih modul SIBATIK.
3. Sinergy membuka SIBATIK sambil meneruskan bukti sesi yang dapat diverifikasi.
4. Adapter SIBATIK memvalidasi bukti tersebut dan memetakan pengguna lokal.
5. Session DTO minimum diberikan ke komponen client.
6. Setiap API memeriksa kembali role dan kepemilikan data.
7. Keluar akun dilakukan dari Sinergy, bukan dari SIBATIK.

## Informasi yang Perlu Diambil dari Alur Sinergy

- URL asal dan URL pembukaan modul;
- apakah modul dibuka sebagai redirect, iframe, atau halaman dalam shell;
- nama cookie/header/token yang dipakai;
- format dan metode verifikasi token;
- aturan same-site, domain, HTTPS, dan reverse proxy;
- atribut user dan role yang tersedia;
- mekanisme refresh dan logout sesi;
- URL kembali ke Sinergy.

## Verifikasi

1. Membuka `/login` langsung menuju `/dashboard`.
2. Tidak ada form password, provider OAuth, endpoint NextAuth, atau logout lokal.
3. Development dapat memilih seeded user melalui `SIBATIK_DEV_USER_EMAIL`.
4. Production tanpa identitas Sinergy menolak akses dengan aman.
5. Route admin, agent, supervisor, dan executive mengikuti role pengguna.
6. Semua operasi ticket dan admin tetap memeriksa session di server.

# Panduan Penggunaan SIBATIK IDB Bali

Panduan ini menjelaskan cara menggunakan SIBATIK untuk seluruh civitas akademika Institut Desain dan Bisnis Bali.

> Untuk panduan instalasi dan deployment, lihat [README.md](./README.md) dan [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Akses melalui Sinergy](#2-akses-melalui-sinergy)
3. [Tipe Pengguna & Hak Akses](#3-tipe-pengguna--hak-akses)
4. [Penggunaan untuk USER (Mahasiswa/Dosen)](#4-penggunaan-untuk-user-mahasiswadosen)
5. [Penggunaan untuk AGENT](#5-penggunaan-untuk-agent)
6. [Penggunaan untuk SUPERVISOR](#6-penggunaan-untuk-supervisor)
7. [Penggunaan untuk ADMIN](#7-penggunaan-untuk-admin)
8. [Penggunaan untuk EXECUTIVE](#8-penggunaan-untuk-executive)
9. [AI Asisten Vira](#9-ai-asisten-vira)
10. [Knowledge Base](#10-knowledge-base)
11. [Tips & FAQ](#11-tips--faq)

---

## 1. Pendahuluan

**SIBATIK IDB Bali** adalah sistem tiket dukungan internal yang membantu civitas akademika menyampaikan masalah terkait layanan kampus (IT, akademik, keuangan, fasilitas, dll) dan mendapat tindak lanjut resmi dari divisi terkait.

### Fitur Utama
- 🎫 **Tiket Support** — Ajukan dan lacak tiket dukungan
- 🤖 **AI Asisten Vira** — Tanya jawab otomatis berbasis dokumen internal
- 📚 **Knowledge Base** — Artikel panduan dan FAQ yang bisa dicari
- 📊 **Dashboard** — Statistik tiket dan performa (sesuai role)
- 👥 **Manajemen User** — Pengelolaan akun (admin)

---

## 2. Akses melalui Sinergy

### 2.1 Membuka Modul
1. Masuk ke sistem utama **Sinergy**.
2. Pilih modul **SIBATIK** dari navigasi Sinergy.
3. Identitas, role, dan divisi pengguna diteruskan otomatis ke SIBATIK.

SIBATIK tidak memiliki form login, password, atau tombol logout sendiri. Proses
autentikasi dan keluar dari akun sepenuhnya mengikuti sesi Sinergy.

---

## 3. Tipe Pengguna & Hak Akses

Sistem memiliki 5 tipe pengguna dengan hak akses berbeda:

| Role | Lihat Tiket | Aksi pada Tiket | Menu Tambahan |
|------|-------------|-----------------|---------------|
| **USER** | Tiket sendiri | Buat tiket sendiri | Knowledge Base, AI Asisten |
| **AGENT** | Tiket divisinya + sendiri | Tangani, update status, komentar | Dashboard performance |
| **SUPERVISOR** | Semua tiket divisinya + sendiri | Tangani, assign, monitor | Dashboard agent performance |
| **ADMIN** | Semua tiket | Semua aksi + manajemen | User, Kategori, KB Admin, Laporan |
| **EXECUTIVE** | Semua tiket (read-only) | Monitor, lihat laporan | Laporan eksekutif |

**Penjelasan Tiket "Sendiri":** Tiket yang Anda buat sendiri, atau tiket yang dibuat atas nama Anda.

---

## 4. Penggunaan untuk USER (Mahasiswa/Dosen)

USER adalah pengguna standar — dapat membuat tiket dukungan, melacak statusnya, dan menggunakan AI Asisten.

### 4.1 Melihat Dashboard
1. Klik **Dashboard** di sidebar
2. Anda akan melihat ringkasan tiket Anda: total, open, in-progress, resolved
3. Klik card statistik untuk memfilter daftar tiket

### 4.2 Membuat Tiket Baru
1. Klik **Buat Tiket** di sidebar
2. Isi form:
   - **Judul** — ringkasan singkat masalah (contoh: "Tidak bisa login SIAKAD")
   - **Kategori** — pilih kategori paling sesuai (misal: SIAKAD, Wi-Fi, dll)
   - **Prioritas** — Low, Medium, High, atau Urgent
   - **Deskripsi** — jelaskan masalah secara detail
   - **Lampiran** (opsional) — screenshot/error message
3. Klik **Kirim**

SLA (waktu respons & penyelesaian) otomatis dihitung berdasarkan kategori.

### 4.3 Melihat Daftar Tiket Sendiri
1. Klik **Tiket Saya** di sidebar
2. Anda akan melihat semua tiket yang pernah Anda buat
3. Filter berdasarkan status menggunakan tab/dropdown
4. Klik tiket untuk melihat detail

### 4.4 Melihat Detail Tiket
Halaman detail tiket menampilkan:
- **Nomor tiket** (contoh: `TKT-0001`)
- **Status** saat ini
- **Riwayat komentar** (percakapan dengan agent)
- **Lampiran** yang sudah dikirim
- **Timeline** perubahan status

### 4.5 Menambahkan Komentar
1. Buka detail tiket
2. Scroll ke bagian **Komentar**
3. Ketik pesan di kolom teks
4. Klik **Kirim**

### 4.6 Memberikan Rating
Setelah tiket berstatus **Resolved** (selesai):
1. Buka detail tiket
2. Klik tombol **Beri Rating**
3. Pilih jumlah bintang (1–5)
4. (Opsional) Tambahkan komentar
5. Klik **Kirim Rating**

---

## 5. Penggunaan untuk AGENT

AGENT adalah petugas/operator yang menangani tiket yang masuk ke divisinya. Bisa juga membuat tiket sendiri.

### 5.1 Dashboard
1. Klik **Dashboard** di sidebar
2. Lihat ringkasan tiket: total, open, in-progress, resolved
3. Statistik dihitung dari **tiket yang di-assign ke Anda** (bukan seluruh divisi)
4. Klik card untuk filter tiket

### 5.2 Tiket Divisi
Menu ini menampilkan tiket yang masuk ke divisi Anda (berdasarkan kategori), termasuk yang di-assign ke agent lain di divisi yang sama.

1. Klik **Tiket Divisi** di sidebar
2. Lihat semua tiket masuk
3. Filter berdasarkan status, prioritas, atau kategori
4. Klik tiket untuk mulai menangani

### 5.3 Tiket Saya
Sama dengan USER — tiket yang Anda buat sendiri atau di-assign ke Anda.

### 5.4 Menangani Tiket
1. Buka detail tiket
2. Baca deskripsi masalah
3. **Tambahkan komentar** untuk komunikasi dengan user
   - Centang **Komentar Internal** jika catatan hanya untuk tim (tidak terlihat user)
4. **Ubah status** sesuai progres:
   - `OPEN` → In Progress (sedang ditangani)
   - `In Progress` → Resolved (sudah selesai)
   - `Resolved` → Closed (final, ditutup)
5. Setelah status **Resolved**, tunggu user memberikan rating

### 5.5 Menambahkan Lampiran Solusi
Anda bisa menambahkan lampiran di komentar (misal: file panduan, screenshot solusi).

---

## 6. Penggunaan untuk SUPERVISOR

SUPERVISOR adalah kepala divisi — punya akses lebih luas untuk memonitor dan mengatur kinerja divisinya.

### 6.1 Dashboard
Dashboard SUPERVISOR menampilkan:
- **Statistik tiket divisi** (bukan hanya tiket sendiri)
- **Agent Performance Chart** — bar chart tiket masuk vs selesai per agent
- **Rating Distribution** — distribusi rating bintang per agent (⭐⭐⭐⭐⭐, ⭐⭐⭐⭐, dll)
- Klik card untuk filter tiket divisi

### 6.2 Tiket Divisi
Lihat semua tiket yang masuk ke divisi Anda. Anda bisa:
- Menangani tiket langsung
- Memantau progres agent di tim Anda
- Mengirim komentar internal untuk koordinasi tim

### 6.3 Tiket Saya
Sama seperti AGENT — tiket yang Anda buat atau di-assign ke Anda.

### 6.4 Memantau Kinerja Agent
1. Buka **Dashboard**
2. Lihat **Agent Performance Chart**
3. Setiap agent ditampilkan dengan:
   - Bar **Tiket Masuk** (biru) — total tiket yang ditangani bulan ini
   - Bar **Tiket Selesai** (hijau) — tiket yang sudah resolved
   - Distribusi rating bintang dari user

### 6.5 Assign Tiket ke Agent
Saat ini sistem auto-assign ke supervisor. Anda bisa me-reassign ke agent tertentu melalui halaman detail tiket (jika fitur tersedia).

---

## 7. Penggunaan untuk ADMIN

ADMIN punya akses penuh ke seluruh sistem.

### 7.1 Manajemen User
Menu: **Manajemen User**

#### Menambah User
1. Klik **Tambah User**
2. Isi: Nama, Email, Role, Divisi
3. Klik **Simpan**

#### Mengedit User
1. Cari user di daftar
2. Klik ikon **Pensil** (edit)
3. Ubah data yang diperlukan
4. Klik **Simpan**

#### Menonaktifkan User
1. Cari user di daftar
2. Klik toggle **Aktif/Nonaktif**
3. User yang nonaktif tidak bisa mengakses modul SIBATIK

#### Menghapus User
1. Klik ikon **Tong Sampah**
2. Sistem akan menampilkan data terkait (tiket, komentar) yang menjadi penghalang
3. Pilih untuk **nonaktifkan** saja jika masih ada data terkait

### 7.2 Manajemen Kategori
Menu: **Kategori**

#### Struktur
Kategori memiliki 2 level:
- **Kategori Induk** (divisi/departemen)
- **Sub Kategori** (jenis masalah spesifik)

#### Menambah Kategori
1. Klik **Tambah Kategori**
2. Pilih **Induk** (jika sub-kategori) atau kosongkan untuk kategori induk
3. Isi: Nama, Departemen, SLA Response Time, SLA Resolve Time
4. Klik **Simpan**

### 7.3 Knowledge Base Admin
Menu: **KB Admin**

#### Mengelola FAQ
1. Klik tab **FAQ**
2. Klik **Tambah FAQ**
3. Isi: Pertanyaan, Jawaban, Urutan
4. Klik **Simpan**

FAQ otomatis ditampilkan di halaman Knowledge Base publik dan menjadi referensi AI Vira.

#### Mengelola Artikel
1. Klik tab **Artikel**
2. Klik **Tambah Artikel**
3. Isi: Judul, Konten, Kategori, Tag
4. Klik **Simpan**

#### Upload Dokumen Internal (untuk AI)
1. Klik tab **Dokumen Internal**
2. Klik **Tambah Dokumen**
3. Isi judul, pilih kategori (SOP, Peraturan, Panduan, Lainnya)
4. Pilih file (PDF atau DOCX, maks 20MB)
5. Klik **Upload**

Dokumen akan otomatis:
- Ekstrak teks
- Dipotong jadi chunks
- Di-embed untuk RAG
- Tersedia sebagai referensi AI Vira

> ⚠️ **Catatan:** PDF scan/gambar tidak bisa di-ekstrak teksnya. Gunakan versi teks (bukan hasil scan).

### 7.4 Laporan
Menu: **Laporan** (di sidebar)

Lihat laporan agregat:
- Tiket per kategori
- Tiket per status
- Tiket per prioritas
- Tiket per agent
- Performa SLA

---

## 8. Penggunaan untuk EXECUTIVE

EXECUTIVE adalah manajemen/pimpinan yang butuh gambaran umum lintas divisi.

### 8.1 Dashboard Eksekutif
Menu: **Dashboard** → otomatis ke `/executive/dashboard`

Menampilkan:
- Total tiket seluruh kampus
- Distribusi per divisi
- Tiket urgent/high yang butuh perhatian
- Trend tiket bulanan

### 8.2 Monitor Tiket
Menu: **Monitor Tiket**

Lihat semua tiket dari seluruh divisi dalam satu tampilan (read-only). Filter berdasarkan:
- Divisi
- Status
- Prioritas
- Periode waktu

### 8.3 Laporan
Menu: **Laporan**

Laporan eksekutif untuk monitoring dan pengambilan keputusan.

---

## 9. AI Asisten Vira

Vira adalah AI Assistant berbasis RAG (Retrieval-Augmented Generation) yang menjawab pertanyaan berdasarkan konteks layanan SIBATIK kampus.

### 9.1 Cara Mengakses
1. Klik **Asisten** di sidebar (ada label **Beta**)
2. Ketik pertanyaan di kolom chat
3. Tekan Enter atau klik tombol kirim

### 9.2 Kemampuan Vira
✅ Bisa menjawab:
- Cara membuat tiket
- Prosedur pengajuan (cuti, surat keterangan, dll)
- Informasi layanan kampus
- Troubleshooting masalah IT dasar
- Membuat tiket langsung dari chat

❌ Tidak bisa menjawab:
- Pertanyaan di luar konteks layanan SIBATIK kampus
- Informasi yang tidak ada di Knowledge Base / dokumen internal

### 9.3 Tips Bertanya ke Vira
- Gunakan bahasa yang jelas dan spesifik
- Sebutkan konteks (misal: "Bagaimana cara mengajukan cuti akademik?")
- Vira akan otomatis mencari referensi di KB, FAQ, dan dokumen internal

### 9.4 Membuat Tiket dari Chat
Jika Vira tidak bisa menyelesaikan masalah, ia akan menyarankan membuat tiket:
1. Vira akan menampilkan form ringkasan tiket
2. Review dan edit jika perlu
3. Klik **Buat Tiket**
4. Anda akan mendapat nomor tiket dan bisa melacaknya di **Tiket Saya**

---

## 10. Knowledge Base

Knowledge Base adalah pusat informasi yang berisi:
- **Artikel** — panduan lengkap topik tertentu
- **FAQ** — pertanyaan yang sering diajukan
- **Dokumen Internal** — SOP, peraturan, panduan (referensi AI)

### 10.1 Mencari Informasi
1. Klik **Knowledge Base** di sidebar
2. Gunakan kotak pencarian di atas
3. Atau telusuri per kategori

### 10.2 Membaca Artikel
1. Klik judul artikel
2. Baca konten lengkap
3. (Jika ada) Klik lampiran/file terkait

### 10.3 Kontribusi ke KB
- **USER/AGENT/SUPERVISOR** — hanya bisa membaca
- **ADMIN** — bisa menambah/edit artikel, FAQ, dan dokumen internal di menu **KB Admin**

---

## 11. Tips & FAQ

### T: Saya tidak bisa membuka modul SIBATIK, apa yang harus dilakukan?
**J:** Pastikan sesi Sinergy masih aktif dan akun Anda telah memiliki akses ke
modul SIBATIK. Jika tetap gagal, hubungi administrator Sinergy.

### T: Tiket saya tidak muncul di "Tiket Saya"?
**J:** Pastikan Anda membuka SIBATIK dengan identitas Sinergy yang sama dengan pembuat tiket. Tiket yang dibuat atas nama orang lain akan tetap di akun pembuat, bukan di akun yang "diwakilkan".

### T: Berapa lama tiket akan direspons?
**J:** Tergantung **SLA** kategori tiket:
- Urgent: < 4 jam
- High: < 8 jam
- Medium: < 24 jam
- Low: < 48 jam

Lihat detail tiket untuk SLA spesifik.

### T: Bagaimana cara update tiket yang sudah saya buat?
**J:** Anda bisa menambahkan komentar baru di halaman detail tiket. Status hanya bisa diubah oleh agent/supervisor/admin.

### T: Apakah data saya aman?
**J:** Ya. Sistem menggunakan:
- Identitas pengguna diverifikasi oleh Sinergy
- Role-based access control di server dan API
- Role-based access control
- Validasi input di server-side

### T: Bisa akses dari HP?
**J:** Bisa! SIBATIK IDB Bali responsive dan bisa diakses dari browser smartphone.

---

## Notifikasi & Status

### Status Tiket
| Status | Arti |
|--------|------|
| `OPEN` | Tiket baru, belum ditangani |
| `IN_PROGRESS` | Sedang dalam penanganan |
| `RESOLVED` | Sudah selesai (menunggu konfirmasi user) |
| `CLOSED` | Ditutup final |

### Prioritas
| Prioritas | Arti |
|-----------|------|
| `URGENT` | Mengganggu aktivitas utama, butuh penanganan segera |
| `HIGH` | Penting, perlu ditangani dalam 1 hari |
| `MEDIUM` | Normal, ditangani dalam SLA standar |
| `LOW` | Tidak mendesak, bisa menunggu |

---

## Kontak & Dukungan

Jika mengalami masalah pada SIBATIK:
- **Email**: admin@idbbali.ac.id
- **Buat tiket** langsung dari menu **Buat Tiket** di aplikasi
- **Tanya Vira** — klik menu **Asisten** untuk bantuan cepat

---

**Versi Dokumen:** 1.0
**Terakhir Diperbarui:** Juni 2026

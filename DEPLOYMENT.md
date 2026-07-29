# Panduan Deployment — SIBATIK IDB Bali

## Prasyarat

- Akun GitHub
- VPS Ubuntu Server 24.04
- Akun Cloudflare (jika menggunakan custom domain)
- Domain yang sudah terhubung ke Cloudflare (contoh: `idbbali.ac.id`)

---

## Bagian 1 — Persiapan GitHub

### 1.1 Buat Repository

1. Login ke [github.com](https://github.com)
2. Klik **New repository**
3. Isi nama repository (contoh: `helpdesk-idb`)
4. Set ke **Private**
5. Klik **Create repository**

### 1.2 Buat Personal Access Token (PAT)

1. Buka: **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Klik **Generate new token (classic)**
3. Isi **Note**: `helpdesk-idb deploy`
4. Pilih **Expiration** sesuai kebutuhan
5. Centang scope: **repo** (full control of private repositories)
6. Klik **Generate token**
7. **Salin token — hanya tampil sekali**

### 1.3 Push Project ke GitHub

Jalankan dari direktori project:

```bash
git remote add origin https://github.com/USERNAME/helpdesk-idb.git
git add .
git commit -m "Initial project: SIBATIK IDB Bali"
git push -u origin master
```

Saat diminta password, masukkan **Personal Access Token** (bukan password GitHub).

---

## Bagian 2 — Setup VPS Ubuntu Server 24.04

### 2.1 Install Node.js, Git, dan PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm install -g pm2
```

Verifikasi:
```bash
node -v && npm -v
```

### 2.2 Clone Repository

```bash
cd /var/www
sudo mkdir helpdesk && sudo chown $USER:$USER helpdesk
cd helpdesk
git clone https://github.com/USERNAME/helpdesk-idb.git .
```

### 2.3 Install Dependencies

```bash
npm install
```

### 2.4 Buat File .env

```bash
nano .env
```

Isi dengan nilai yang sesuai:

```env
# Database
DATABASE_URL="file:./prisma/prod.db"

# Development/staging sementara sebelum adapter SSO Sinergy terhubung
SIBATIK_DEV_USER_EMAIL="admin@idbbali.ac.id"

# NVIDIA NIM (Chatbot Vira — LLM + Embedding)
NVIDIA_API_KEY="nvapi-xxxxxxxxxxxx"
NVIDIA_MODEL="meta/llama-3.1-8b-instruct"
# Model embedding diset otomatis ke nvidia/nv-embedqa-e5-v5
# Rate limit tier gratis: 40 req/menit, 1.000 req/hari

```

> Production tidak boleh memakai fallback development. Hubungkan adapter
> `src/lib/auth.ts` ke identitas terverifikasi dari Sinergy terlebih dahulu.

### 2.5 Setup Database

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 2.6 Build Aplikasi

```bash
npm run build
```

### 2.7 Jalankan dengan PM2

```bash
pm2 start npm --name "helpdesk-idb" -- start
pm2 save
pm2 startup
```

Jalankan perintah `sudo ...` yang muncul dari output `pm2 startup`.

Cek status:
```bash
pm2 status
pm2 logs helpdesk-idb
```

### 2.8 Install dan Konfigurasi Nginx

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/helpdesk
```

Isi konfigurasi:

```nginx
server {
    listen 80;
    server_name helpdesk.idbbali.ac.id;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan:

```bash
sudo ln -s /etc/nginx/sites-available/helpdesk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 2.9 Konfigurasi Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

---

## Bagian 3 — Setup Cloudflare Tunnel (Custom Domain)

> Gunakan bagian ini jika VPS berada di belakang NAT/tidak punya IP publik,
> atau ingin HTTPS otomatis tanpa konfigurasi SSL manual.

### 3.1 Install cloudflared

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

### 3.2 Login ke Cloudflare

```bash
cloudflared tunnel login
```

Buka URL yang muncul di browser, pilih domain `idbbali.ac.id`, lalu authorize.

### 3.3 Buat Tunnel

```bash
cloudflared tunnel create helpdesk-idb
```

Catat **Tunnel ID** (format UUID) yang muncul.

### 3.4 Buat Config File

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Isi:

```yaml
tunnel: TUNNEL-ID-ANDA
credentials-file: /home/USER/.cloudflared/TUNNEL-ID-ANDA.json

ingress:
  - hostname: helpdesk.idbbali.ac.id
    service: http://localhost:3000
  - service: http_status:404
```

Ganti `TUNNEL-ID-ANDA` dan `USER` sesuai server.

### 3.5 Arahkan DNS

```bash
cloudflared tunnel route dns helpdesk-idb helpdesk.idbbali.ac.id
```

### 3.6 Jalankan Tunnel sebagai Service

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

Cek status:

```bash
sudo systemctl status cloudflared
```

---

## Bagian 4 — Update Aplikasi (setelah ada perubahan kode)

```bash
cd /var/www/helpdesk
git pull origin master
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart helpdesk-idb
```

> `npx prisma migrate deploy` diperlukan jika ada perubahan schema database (migration baru).

---

## Bagian 5 — Panduan Fitur AI Asisten Vira

### 5.1 Cara Kerja RAG

Vira menggunakan RAG (Retrieval-Augmented Generation) untuk menjawab berdasarkan dokumen internal:

1. Admin upload dokumen (PDF/DOCX) di **KB Admin → Dokumen Internal**
2. Sistem otomatis ekstrak teks dan potong jadi chunks (±150 kata per chunk)
3. Setiap chunk di-embed menggunakan NVIDIA embedding API (background process)
4. Saat user bertanya, pertanyaan di-embed lalu dicocokkan dengan chunks paling relevan
5. Chunks relevan diinjek ke system prompt AI sebagai referensi jawaban

### 5.2 Re-index Dokumen Lama

Jika dokumen sudah ada sebelum fitur RAG ditambahkan, hapus dan upload ulang dokumen tersebut dari **KB Admin → Dokumen Internal** agar ter-index.

### 5.3 Tips Upload Dokumen

- **PDF teks** (bukan scan): teks terekstrak otomatis ✅
- **PDF scan/gambar**: teks tidak terekstrak, gunakan versi teks ❌
- **DOCX**: terekstrak otomatis ✅
- Dokumen panjang akan di-index bertahap (1.5 detik per chunk) untuk menjaga rate limit NVIDIA
- Rate limit tier gratis: 40 req/menit, 1.000 req/hari

### 5.4 Manajemen FAQ

FAQ bisa dikelola di **KB Admin → FAQ** tanpa perlu mengubah kode. FAQ aktif otomatis digunakan sebagai referensi AI Asisten.

---

## Identitas Development Setelah Seed

| Email | Role |
|---|---|
| admin@idbbali.ac.id | ADMIN |
| tech1@idbbali.ac.id | AGENT |
| tech2@idbbali.ac.id | AGENT |
| kabag.keuangan@idbbali.ac.id | SUPERVISOR |
| kabag.hrd@idbbali.ac.id | SUPERVISOR |
| kabag.baa@idbbali.ac.id | SUPERVISOR |
| dosen1@idbbali.ac.id | USER |

Pilih salah satu identitas tersebut melalui `SIBATIK_DEV_USER_EMAIL` saat
menjalankan modul secara lokal. Production harus mengambil identitas dari Sinergy.

---

## Troubleshooting

**App tidak jalan setelah restart server:**
```bash
pm2 resurrect
```

**Cek log error:**
```bash
pm2 logs helpdesk-idb --lines 50
```

**Tunnel Cloudflare tidak konek:**
```bash
sudo systemctl restart cloudflared
sudo journalctl -u cloudflared -n 50
```

**Database error setelah update schema:**
```bash
npx prisma db push
npx prisma generate
pm2 restart helpdesk-idb
```

# GBIFRESH — Toko Buah Online Jogja

Website mobile-first untuk jual buah lokal & impor online area Yogyakarta dengan
checkout langsung ke **WhatsApp admin resmi**. Fullstack: frontend, backend API
(Next.js), database (Drizzle ORM), dan **Admin Panel lengkap dengan CMS**.

## Fitur

**Toko (sisi pembeli)**
- Katalog buah lokal & impor dengan foto, harga, rating, terjual, dan **indikator stok** (Stok X / Sisa X! / Stok Habis)
- Pencarian & filter kategori (Semua / Lokal / Impor / Promo), Flash Sale dengan countdown
- Banner promo **auto-slide** (bisa diatur dari admin)
- FAQ accordion, testimoni, info pengiriman instan
- Keranjang belanja tersimpan otomatis di perangkat
- **Checkout via WhatsApp** — data pelanggan + item + total belanja terkirim rapi ke WA admin; ongkir dikonfirmasi admin (instan Gojek/Shopee atau ambil di tempat)
- **Lacak pesanan** dengan kode GBI-XXXXXX + timeline status
- Stok otomatis berkurang saat ada pesanan (dicek ulang di server)

**Admin Panel (`/admin`)**
- Dashboard statistik pengunjung **realtime** (pengunjung & pageview hari ini/total, grafik 7 hari, omzet, pesanan terbaru — auto-refresh tiap 5 detik)
- Manajemen pesanan + ubah status (baru → diproses → dikirim → selesai/batal)
- **CRUD Produk** — tambah/edit/hapus, upload foto (otomatis resize), **edit stok cepat +/−**
- **CRUD Banner** slide beranda, **CRUD FAQ**
- **Pengaturan website**: ganti logo (upload), nama brand, nomor WhatsApp, alamat toko, jam operasional, dan **SEO** (judul situs, meta description, keywords)

## Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** + Lucide Icons
- **Drizzle ORM** + PostgreSQL
- Deploy: Vercel / VPS / cPanel Node.js

---

## Menjalankan di Komputer Lokal

Prasyarat: **Node.js 20+** dan akses ke database PostgreSQL.

```bash
# 1. Install dependency
npm install

# 2. Salin file env lalu isi DATABASE_URL
cp .env .env.local   # atau buat manual, contoh:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/gbifresh

# 3. Terapkan schema database (sekali saja / setiap ada perubahan schema)
npx drizzle-kit push

# 4. Jalankan mode development
npm run dev
# buka http://localhost:3000  — produk demo terisi otomatis saat pertama jalan

# Build produksi
npm run build && npm run start
```

## Environment Variables

| Variabel | Wajib? | Keterangan |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string PostgreSQL, mis. `postgresql://user:pass@host:5432/dbname` |

Nomor WhatsApp admin **tidak perlu env** — cukup diubah lewat menu
**Admin → Pengaturan → Nomor WhatsApp Admin** (tersimpan di database).

---

# Cara Upload ke Hosting

## Opsi A — Vercel + Neon (TERMUDAH & GRATIS) ✅ recommended

### 1. Push kode ke GitHub
```bash
git init
git add .
git commit -m "GBIFRESH"
git branch -M main
git remote add origin https://github.com/USERNAME/gbifresh.git
git push -u origin main
```

### 2. Buat database gratis di Neon
1. Buka <https://neon.tech> → daftar → **Create Project** (region Singapore bila tersedia)
2. Salin **Connection String** yang muncul, bentuknya:
   `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

> Alternatif gratis lain: **Supabase** (supabase.com) atau **Railway** (railway.app) — sama-sama menyediakan PostgreSQL siap pakai.

### 3. Deploy di Vercel
1. Buka <https://vercel.com> → **Add New → Project** → **Import** repo `gbifresh`
2. Di bagian **Environment Variables** tambahkan:
   - `DATABASE_URL` = connection string Neon tadi
3. Klik **Deploy** — tunggu ± 2 menit sampai muncul confetti 🎉

### 4. Terapkan schema ke database Neon
Dari komputer lokal (folder project):
```bash
# pakai DATABASE_URL milik Neon sementara untuk push schema
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" npx drizzle-kit push
```
Buka URL Vercel kamu — produk demo otomatis terisi saat pertama diakses.

### 5. Checklist setelah online
1. Buka `https://domainkamu.vercel.app/admin`
2. **Pengaturan** → ganti **Nomor WhatsApp Admin** ke nomor asli (format `628xxx`)
3. Upload **logo**, isi **SEO** (judul & deskripsi), atur **banner**, **FAQ**, dan **produk** sesuai stok toko
4. Tes 1x checkout → pastikan pesanan masuk ke WA admin

---

## Opsi B — VPS (Ubuntu 22.04, mis. DigitalOcean/Hostinger/IDCloudHost)

Cocok kalau mau pakai domain sendiri + kontrol penuh.

### 1. Siapkan server
```bash
# update & install Node.js 20 LTS
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx postgresql  # atau pakai Neon (lewati postgresql)
sudo npm install -g pm2
```

### 2. Upload kode
```bash
# cara paling rapi: lewat Git
git clone https://github.com/USERNAME/gbifresh.git
cd gbifresh
# alternatif: upload zip via scp/sftp lalu unzip

npm install
nano .env   # isi DATABASE_URL=postgresql://postgres:pass@localhost:5432/gbifresh
```

### 3. Database
```bash
# jika pakai PostgreSQL lokal:
sudo -u postgres psql -c "CREATE USER gbi WITH PASSWORD 'passwordkuat';"
sudo -u postgres psql -c "CREATE DATABASE gbifresh OWNER gbi;"
npx drizzle-kit push
```

### 4. Build & jalankan dengan PM2
```bash
npm run build
pm2 start "npm run start" --name gbifresh
pm2 save
pm2 startup        # ikuti perintah yang muncul agar auto-start saat reboot
# aplikasi jalan di http://localhost:3000
```

### 5. Nginx + domain + HTTPS
```bash
sudo nano /etc/nginx/sites-available/gbifresh
```
Isi:
```nginx
server {
    listen 80;
    server_name domainkamu.com www.domainkamu.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10m;
    }
}
```
Aktifkan & pasang SSL gratis:
```bash
sudo ln -s /etc/nginx/sites-available/gbifresh /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domainkamu.com -d www.domainkamu.com
```
Selesai — website aktif di `https://domainkamu.com`. Lanjutkan **checklist setelah online** (lihat Opsi A langkah 5).

---

## Opsi C — Shared Hosting / cPanel (yang support Node.js)

Banyak hosting Indonesia (Hostinger, Niagahoster, Rumahweb, dll.) punya menu
**"Setup Node.js App"** di cPanel:

1. Upload project via **File Manager** (zip → extract) ke folder mis. `gbifresh/`
2. cPanel → **Setup Node.js App → Create Application**
   - Node.js version: **20.x**, mode **Production**
   - Application root: `gbifresh`, startup file: `node_modules/next/dist/bin/next` dengan argument `start`
   - Environment variables: `DATABASE_URL=...`
3. Buka **Terminal** di cPanel, masuk folder app, jalankan:
   ```bash
   npm install
   npm run build
   npx drizzle-kit push
   ```
4. Restart aplikasi dari cPanel. Jika limit RAM kecil (build gagal), jalankan
   `npm run build` di komputer lokal lalu upload folder `.next` hasilnya.

> Database PostgreSQL via cPanel: tidak semua shared hosting menyediakan.
> Solusi: tetap pakai database gratis **Neon/Supabase** sebagai `DATABASE_URL`.

---

## Catatan Penting

- **Migrasi di kemudian hari**: setiap mengubah `src/db/schema.ts`, jalankan lagi
  `npx drizzle-kit push` (dengan `DATABASE_URL` tujuan) agar struktur tabel update.
- **Ingin pakai MySQL?** Saat ini DB layer memakai PostgreSQL. Untuk MySQL ubah
  `src/db/schema.ts` ke `drizzle-orm/mysql-core`, driver ke `mysql2`, dan sesuaikan
  tipe kolom — struktur tabel sama.
- **Backup foto yang di-upload lewat admin**: gambar tersimpan sebagai base64 di
  database — ikut ter-backup otomatis jika database di-backup.
- **Keamanan admin panel**: route `/admin` saat ini terbuka untuk kemudahan demo.
  Untuk produksi, disarankan menambah proteksi (mis. password) — minta bantuan
  developer untuk menambahkan autentikasi.

## Struktur Project (ringkas)

```
src/
├── app/
│   ├── page.tsx              # Beranda
│   ├── produk/[slug]/        # Detail produk
│   ├── keranjang/            # Keranjang + checkout WA
│   ├── lacak/                # Lacak pesanan
│   ├── admin/                # Admin panel (dashboard/CRUD/SEO)
│   └── api/
│       ├── products/         # API produk (publik)
│       ├── orders/           # API pesanan & lacak
│       └── cms/[resource]/   # API admin: produk, banner, faq, settings, stats, track
├── components/               # Komponen UI (kartu produk, nav, cart, dll)
├── db/schema.ts              # Definisi tabel (Drizzle)
└── lib/                      # Util: format rupiah, WA link, seed, settings
```

---
© 2026 GBIFRESH — Dibuat dengan segar di Jogja.

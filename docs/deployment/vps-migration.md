# Migrasi Kicaunime ke VPS

Panduan lengkap memindahkan Kicaunime dari environment lokal ke VPS (Ubuntu 22.04/24.04).
Cakupannya: siapkan server, pasang dependency, migrasi database, build, jalankan dengan PM2, dan pasang Nginx + SSL.

## 1. Stack & prasyarat

- **App**: Next.js 16 (Node.js), dijalankan dengan `next start` (bukan `next dev`).
- **Database**: MariaDB (Prisma `provider = "mysql"`, adapter `@prisma/adapter-mariadb`).
- **Auth**: NextAuth v5 (`AUTH_SECRET`).
- **OS**: Ubuntu 22.04/24.04 LTS (langkah di bawah mengasumsikan apt).
- **Akses**: user dengan `sudo`, dan domain sudah menunjuk (A record) ke IP VPS.

## 2. Siapkan VPS

```bash
# Update & pasang dasar
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw

# Node.js 20 LTS (Next 16 butuh Node >= 18.18, disarankan 20+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v

# PM2 untuk proses manager
sudo npm install -g pm2

# Build tools (diperlukan untuk native module Prisma)
sudo apt install -y build-essential
```

Buka firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 3. Pasang & jalankan MariaDB

```bash
sudo apt install -y mariadb-server
sudo systemctl enable --now mariadb
sudo mysql_secure_installation   # set root password, hapus anonymous user
```

Buat database dan user aplikasi (ganti password):

```bash
sudo mysql -u root -p <<'SQL'
CREATE DATABASE kicaunime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kicaunime'@'localhost' IDENTIFIED BY 'GANTI_DENGAN_PASSWORD_KUAT';
GRANT ALL PRIVILEGES ON kicaunime.* TO 'kicaunime'@'localhost';
FLUSH PRIVILEGES;
SQL
```

Connection string nanti: `mysql://kicaunime:GANTI_DENGAN_PASSWORD_KUAT@127.0.0.1:3306/kicaunime`

## 4. Deploy kode

```bash
cd /var/www
sudo git clone <repo-url> kicaunime
sudo chown -R $USER:$USER /var/www/kicaunime
cd /var/www/kicaunime/frontend
npm install
```

## 5. Environment variables

Salin `.env.example` menjadi `.env` dan isi nilai produksi:

```bash
cp .env.example .env
nano .env
```

Isi minimal untuk produksi:

```env
# Database (pakai kredensial MariaDB dari langkah 3)
DATABASE_URL="mysql://kicaunime:GANTI_DENGAN_PASSWORD_KUAT@127.0.0.1:3306/kicaunime"

# NextAuth — WAJIB diisi nilai acak panjang di produksi
AUTH_SECRET="isi-dengan-random-string-min-32-karakter"
NEXTAUTH_URL="https://domain-kamu.com"   # bisa pakai AUTH_URL juga

# Scraper
OTAKUDESU_BASE_URL="https://otakudesu.cloud"
SCRAPER_TIMEOUT_MS=15000
SCRAPER_RETRY_COUNT=3
SCRAPER_CACHE_TTL_MS=30000

# Jikan
JIKAN_BASE_URL="https://api.jikan.moe/v4"
```

Generate secret acak:

```bash
openssl rand -base64 32
```

> `AUTH_URL`/`NEXTAUTH_URL` penting kalau app di belakang reverse proxy (Nginx/Cloudflare), supaya callback NextAuth benar.

## 6. Migrasi database

Ada dua skenario: **database baru (kosong)** atau **pindah dari DB lokal yang sudah ada data**.

### 6a. Database baru (jalankan migrasi dari nol)

```bash
npx prisma migrate deploy
```

Perintah ini menjalankan semua file di `prisma/migrations/` ke DB tujuan. Tabel `user`, `comment`, `bookmark`, `watchhistory`, `animeslugmapping`, `cachedanime` akan terbuat.

Generate Prisma client (kalau belum ke-generate saat `npm install`):

```bash
npx prisma generate
```

### 6b. Pindah dari database lokal (dump & restore)

Di **mesin lokal**, export DB lama:

```bash
# Ganti kredensial/port sesuai DATABASE_URL lokal kamu
mysqldump -u root -p aniwatch > kicaunime_dump.sql
```

Upload ke VPS (misal via `scp`), lalu import ke DB VPS:

```bash
# di VPS
mysql -u kicaunime -p kicaunime < kicaunime_dump.sql
```

Setelah restore, **pastikan schema sudah sama** dengan migrasi terbaru. Jika ada migrasi baru yang belum ada di dump, jalankan sisanya:

```bash
npx prisma migrate deploy
```

> Hati-hati: `prisma migrate deploy` hanya aman kalau DB belum punya tabel yang bentrok. Kalau kamu restore dump LALU jalankan migrate, Prisma bisa protes karena tabel sudah ada. Solusi paling bersih: jalankan `migrate deploy` dulu (bikin skema kosong), lalu `mysqldump --no-create-info` (data saja, tanpa CREATE TABLE) untuk memasukkan datanya.

### 6c. Seed cache anime (opsional)

Seed mengambil data dari Jikan dan menyimpan poster ke `public/cache/posters/`. Ini butuh waktu lama (bisa berjam-jam untuk seluruh katalog):

```bash
npm run seed
```

Untuk produksi, lebih baik jalankan di background:

```bash
pm2 start npm --name kicaunime-seed -- run seed
```

Atau lewati seed dan biarkan cache terisi otomatis saat anime diakses (app memanggil Jikan on-demand).

## 7. Build & jalankan

```bash
npm run build
```

Jalankan dengan PM2 (restart otomatis kalau crash / reboot):

```bash
pm2 start npm --name kicaunime -- start
pm2 save
pm2 startup   # ikuti instruksi yang ditampilkan untuk enable auto-start
```

Cek status: `pm2 logs kicaunime`, `pm2 status`.

## 8. Nginx reverse proxy + SSL

Pasang Nginx:

```bash
sudo apt install -y nginx
sudo ufw allow 'Nginx Full'
```

Config `/etc/nginx/sites-available/kicaunime`:

```nginx
server {
    listen 80;
    server_name domain-kamu.com www.domain-kamu.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

Aktifkan & pasang SSL (Certbot):

```bash
sudo ln -s /etc/nginx/sites-available/kicaunime /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-kamu.com -d www.domain-kamu.com
```

Certbot otomatis redirect HTTP → HTTPS dan perpanjang sertifikat.

## 9. Cara scraping data dari Jikan

Kicaunime tidak menyimpan database anime sendiri. Semua data anime (judul, sinopsis, genre, episode, karakter, poster) diambil dari **Jikan API** (`JIKAN_BASE_URL`, default `https://api.jikan.moe/v4`) lalu di-cache ke MariaDB + file lokal. Berikut arsitekturnya.

### 9.1 Alur data (read path)

Setiap request ke `/api/anime/[malId]` jalan begini (`src/app/api/anime/[malId]/route.ts`):

1. Cek DB cache `cachedanime` dulu. Kalau ada → langsung balas (`cached: true`), skip Jikan.
2. Kalau kosong → fetch dari Jikan `/anime/{id}/full`.
3. Simpan hasil ke DB via `cacheAnimeData()` → response `cached: false`.
4. Kalau Jikan balas **429** (rate limit), app lempar error dan frontend fallback ke cache yang ada. Kalau cache juga kosong, tampil pesan "sumber sibuk".

Route lain (`/api/anime/home`, `/api/anime/schedule`, search) pola sama: ambil dari Jikan, lalu `cacheAnimeData()` di background (`.catch(() => {})` supaya gagal cache tidak mematikan response).

### 9.2 Rate limiting (penting)

Jikan membatasi ~3 request/detik dan akan 429 kalau kelebihan. App sudah guard di `src/lib/jikan.ts`:

- **Minimum interval 350ms** antar request (`MIN_INTERVAL_MS`) — pelan tapi aman.
- Kalau kena 429, otomatis **retry 3x** dengan delay `1000ms × (attempt+1)`.
- `getAnimeFull()` (detail lengkap) adalah endpoint paling berat — ini yang di-panggil seed.

> Di produksi: jangan jalankan banyak seed/refill bersamaan. Satu proses saja, supaya tidak saling 429.

### 9.3 Apa yang di-cache

`cacheAnimeData(malId, data)` (`src/lib/anime-cache.ts`) menyimpan:

- **DB `cachedanime`**: seluruh objek JSON anime (`data Json`), permanent (tidak expire, cuma di-update kalau ada data baru).
- **Poster lokal**: download `images.webp.large_image_url` → `public/cache/posters/anime-{malId}.webp`. Saat di-read, URL poster diganti ke path lokal (`/cache/posters/...`) supaya tidak dependent ke CDN MyAnimeList dan lebih cepat.

### 9.4 Skrip yang tersedia

| Skrip | Cara jalan | Fungsi |
|---|---|---|
| `scripts/seed.ts` | `npm run seed` | Loop `mal_id` 1 → latest, fetch detail + cache. Pola sama dengan seed_full tapi tanpa skip-cache dan tanpa backoff otomatis. |
| `scripts/seed_full.ts` | `npx tsx scripts/seed_full.ts` | **Scrape penuh yang disarankan.** Loop 1 → latest MAL id, **lewati ID sudah di-cache** (resumable), auto **backoff 30s** kalau kena 429. Bisa diatur via env: `CONCURRENCY` (default 3), `START_ID`, `END_ID`, `BATCH_DELAY` (default 1000ms). |
| `scripts/refill_cache.ts` | `npx tsx scripts/refill_cache.ts` | Kumpulkan ID populer/aktif (top airing, popular, upcoming, season now) lalu cache detailnya. Cepat, untuk refresh konten depan. |
| `/api/anime/cache` | via API | Panggil `getAnimeFull` + `cacheAnimeData` untuk satu anime on-demand. |

Jalankan full scrape (bisa berjam-jam untuk katalog lengkap):

```bash
# foreground
npx tsx scripts/seed_full.ts

# background via PM2 (disarankan di produksi) — bisa di-resume kalau keputus
pm2 start npx --name kicaunime-seed -- tsx scripts/seed_full.ts
pm2 logs kicaunime-seed
```

Karena `seed_full.ts` **melewati ID yang sudah di-cache**, kamu bisa mematikan (Ctrl+C / `pm2 stop`) dan menjalankan lagi nanti — ia lanjut dari yang belum selesai. Progress tercetak tiap 3 detik: `% cached | skip | 404 | errors | speed | ETA`.

> Catatan: `npm run seed` menjalankan `scripts/seed.ts`, bukan `seed_full.ts`. Untuk scrape penuh yang benar pakai `seed_full.ts`.

### 9.5 Tanpa seed (on-demand)

App **tidak wajib** di-seed dulu. Cache terisi otomatis saat anime dibuka oleh user (read path §9.1 langkah 2–3). Strategi ini aman untuk VPS kecil:

- User pertama yang buka anime X → fetch Jikan, cache ke DB + poster lokal.
- User berikutnya → langsung dari cache (cepat, tidak hit Jikan).

### 9.6 Restart / perbarui cache

Kalau Jikan update data (score, episode baru) dan kamu mau refresh:

```bash
# refill ringkas (top/seasonal/populer) — cepat
pm2 start npx --name refill -- tsx scripts/refill_cache.ts

# paksa ulang seluruh katalog (lama, tapi resumable)
pm2 start npx --name reseed -- tsx scripts/seed_full.ts
```

Atau lewat API on-demand: buka `/api/anime/{malId}` untuk satu anime, atau gunakan route `/api/anime/cache` yang memanggil `getAnimeFull` + `cacheAnimeData` langsung.

### 9.7 Folder & izin

Poster disimpan relatif ke `process.cwd()` (`public/cache/posters`). Pastikan writable oleh user PM2:

```bash
mkdir -p public/cache/posters
chmod -R 755 public/cache
```

> Poster lokal tidak ikut `git` (masuk `.gitignore` biasanya). Di VPS baru, folder ini kosong sampai anime di-cache — itu normal, poster akan terdownload saat anime diakses.

## 10. Checklist produksi

- [ ] `DATABASE_URL` menunjuk ke MariaDB VPS, user bukan root.
- [ ] `AUTH_SECRET` diisi nilai acak (bukan `change-me`).
- [ ] `NEXTAUTH_URL`/`AUTH_URL` = `https://domain-kamu.com`.
- [ ] `prisma migrate deploy` sukses (atau dump restore + verifikasi skema).
- [ ] `npm run build` sukses tanpa error.
- [ ] App jalan di PM2 (`pm2 status` = online), auto-start enabled.
- [ ] Nginx proxy ke port 3000, SSL aktif (HTTPS).
- [ ] Folder `uploads/avatars` bisa ditulis oleh user yang menjalankan PM2 (avatar upload).
- [ ] Login & streaming (route `/api/mirror`) bisa diakses dari domain.

## 10. Catatan & gotchas

- **Upload avatar**: route `/api/user/avatar` dan `/api/user/profile` menulis ke `uploads/avatars/` relatif terhadap `process.cwd()`. Pastikan folder ada dan writable: `mkdir -p uploads/avatars && chmod 755 uploads`.
- **Jikan rate limit**: seed dan fetch on-demand dibatasi Jikan (429). App sudah fallback ke DB cache, jadi aman kalau API limit.
- **`next.config.ts`**: `allowedDevOrigins` hanya untuk dev. Di produksi tidak masalah, tapi bisa dihapus kalau mau.
- **Jangan jalankan `next dev` di produksi** — selalu `next start` (atau PM2 menjalankan `npm start`).
- **Update deploy**: `git pull && npm install && npm run build && pm2 restart kicaunime`.

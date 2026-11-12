# Plant Garden Tracker

Aplikasi web untuk mengelola tanaman/kebun rumahan: catat kebun & tanaman, atur jadwal penyiraman/pemupukan dengan pengingat otomatis, catat riwayat perawatan, dan pantau status semua tanaman lewat dashboard.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + TypeScript + Express |
| Database | MySQL |
| ORM | Prisma |
| Security | Helmet (security headers), CORS dibatasi origin |
| Testing | Vitest |
| Arsitektur | Monorepo (npm workspaces): apps/web, apps/api, packages/shared |
| Containerization | Docker Compose (MySQL) |

---

## A. Instalasi dari Fresh Clone (Komputer Baru/Bersih)

Panduan ini mengasumsikan kamu baru saja git clone repo ini ke komputer yang belum pernah menjalankan proyek ini sebelumnya.

### Prasyarat
- Node.js versi 18 atau lebih baru (https://nodejs.org)
- Docker Desktop terpasang dan menyala (https://www.docker.com/products/docker-desktop/)
- Git

### Langkah-langkah

```bash
# 1. Clone repo (ganti URL dengan URL repo GitHub-mu sendiri)
git clone https://github.com/<username>/<nama-repo>.git
cd <nama-repo>

# 2. Install semua dependency (frontend, backend, shared sekaligus)
npm install

# 3. Nyalakan database MySQL lewat Docker
docker compose up -d

# 4. Siapkan file environment
cp .env.example apps/api/.env
# (Windows CMD: copy .env.example apps\api\.env)

# 5. Build package shared lebih dulu (frontend & backend bergantung pada ini)
npm run build:shared

# 6. Migrasi schema database & isi data contoh (seed)
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ../..

# 7. Jalankan unit test -- WAJIB semua PASSED sebelum lanjut
npm run test:api
```

Kalau langkah 7 menunjukkan "Tests: X passed (X)" tanpa ada yang gagal, instalasi sudah benar dan siap dijalankan.

---

## B. Menjalankan Aplikasi (Mode Development)

Buka 2 terminal terpisah dari folder root proyek:

```bash
# Terminal 1 -- backend
npm run dev:api
```
Backend berjalan di http://localhost:4000

```bash
# Terminal 2 -- frontend
npm run dev:web
```
Frontend berjalan di http://localhost:5173

### Mengakses Aplikasi
Buka browser ke http://localhost:5173 -- kamu akan melihat Dashboard Plant Garden Tracker. Kalau seed data berhasil dijalankan di langkah A.6, akan ada 1 kebun contoh ("Kebun Belakang Rumah") dengan 1 tanaman ("Tomat Cherry").

---

## C. Build untuk Produksi

```bash
npm run build:shared
npm run build:api
npm run build:web
```

Hasil build:
- Backend: apps/api/dist/ (JavaScript hasil kompilasi TypeScript)
- Frontend: apps/web/dist/ (file statis siap deploy: HTML, CSS, JS)

### Menjalankan Hasil Build (Produksi)

```bash
npm run start:api
npx serve apps/web/dist
```

---

## D. Deploy (Opsi Sederhana)

1. Backend: deploy folder apps/api (sudah di-build) ke Railway/Render/VPS. Set env DATABASE_URL, PORT, ALLOWED_ORIGIN sesuai domain produksi.
2. Database: gunakan MySQL managed (Railway MySQL, PlanetScale, dll).
3. Frontend: deploy folder apps/web/dist ke Vercel/Netlify, atau serve statis dari server backend.
4. Perbarui BaseUrl di apps/web/src/api/client.ts agar menunjuk ke URL backend produksi (bukan localhost:4000).

### Paket Demo (Alternatif Tanpa Deploy)
Untuk demo lokal ke dosen/penguji tanpa deploy online, cukup ikuti bagian A dan B di atas di laptop demo.

---

## E. Menjalankan Unit Test

```bash
npm run test:api
```

| File | Yang Diuji |
|---|---|
| validation.test.ts | Validasi nama kebun/tanaman tidak boleh kosong/terlalu panjang |
| careLogic.test.ts | Kalkulasi jadwal berikutnya & klasifikasi status perawatan |
| scheduleValidation.test.ts | Validasi tipe & frekuensi jadwal perawatan |
| dashboardLogic.test.ts | Agregasi data dashboard (ringkasan & status per tanaman) |
| scheduleDeletion.test.ts | Cascade delete jadwal beserta riwayatnya |
| errorMapping.test.ts | [Security] Memastikan error internal tidak bocor ke client |

---

## F. Troubleshooting Umum

| Gejala | Kemungkinan Penyebab | Solusi |
|---|---|---|
| docker compose up -d gagal, "Virtualization support not detected" | Virtualisasi belum aktif di BIOS, atau WSL2 belum terpasang | Aktifkan virtualisasi di BIOS, aktifkan "Virtual Machine Platform" & "WSL", restart |
| npx prisma migrate dev gagal connect ke database | MySQL belum jalan, atau DATABASE_URL salah | Pastikan docker compose up -d sudah jalan, cocokkan kredensial di .env |
| Dashboard macet di "Memuat data..." selamanya | Backend crash | Lihat docs/PERTEMUAN-8-SECURITY.md |
| npm install gagal, error jaringan | Tidak ada koneksi internet | Pastikan komputer terhubung internet |
| Port 5173/4000 sudah dipakai | Aplikasi lain pakai port sama | Ubah port di vite.config.ts / .env |

Untuk daftar error lebih lengkap beserta contoh log dan cara perbaikannya, lihat docs/PERTEMUAN-8-SECURITY.md.

---

## G. Struktur Proyek

```
plant-garden-tracker/
  apps/
    web/      -> Frontend React
    api/      -> Backend Express + Prisma
  packages/
    shared/   -> Tipe data TypeScript yang dipakai bersama frontend & backend
  docs/
    evidence/ -> Log hasil verifikasi unit test & security check
  docker-compose.yml
  .env.example
```

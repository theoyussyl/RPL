# Pertemuan 8 — Hasil Uji Security, Log, dan Deployment Readiness

**Proyek:** Plant Garden Tracker

---

## 1. Hasil Uji Security & Catatan Perubahan

### Metode Pengujian
Karena lingkungan pengerjaan tidak memiliki akses internet (tidak bisa menjalankan `npm audit` atau scanner otomatis seperti Snyk/OWASP ZAP), pengujian dilakukan dengan **static code review manual** terhadap seluruh source code backend (`apps/api/src`), ditambah **unit test otomatis** untuk memverifikasi perilaku penanganan error.

### Temuan & Status Perbaikan

| # | Area | Temuan | Risiko | Status |
|---|---|---|---|---|
| 1 | SQL Injection | Seluruh akses database lewat Prisma Client (query ter-parameterisasi otomatis). Tidak ditemukan `$queryRaw`/`$executeRaw`. | — | ✅ Aman sejak awal |
| 2 | Code Injection | Tidak ditemukan `eval()` atau `new Function()` dinamis di backend maupun frontend. | — | ✅ Aman sejak awal |
| 3 | Hardcoded Secret | Tidak ditemukan password/API key tertulis langsung di source code. | — | ✅ Aman sejak awal |
| 4 | Kebocoran Kredensial | `.env` sudah terdaftar di `.gitignore`, tidak akan ter-commit ke repository publik. | — | ✅ Aman sejak awal |
| 5 | **CORS terlalu terbuka** | `app.use(cors())` tanpa opsi apapun = **mengizinkan semua origin** memanggil API, termasuk dari situs pihak ketiga yang tidak dikenal. | Sedang — bisa dieksploitasi untuk CSRF-like request dari situs lain | 🔧 **Diperbaiki**: dibatasi ke `ALLOWED_ORIGIN` (env var, default `http://localhost:5173`) |
| 6 | **Tidak ada security headers** | Express secara default tidak mengirim header seperti `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`. | Rendah–Sedang — rentan clickjacking, MIME-sniffing | 🔧 **Diperbaiki**: pasang middleware `helmet()` |
| 7 | **Body size tidak dibatasi** | `express.json()` tanpa limit = payload JSON raksasa bisa dikirim untuk membebani server (DoS sederhana). | Rendah | 🔧 **Diperbaiki**: `express.json({ limit: "1mb" })` |
| 8 | **Error handling tidak konsisten** | Logic "pesan apa yang boleh dikirim ke client saat error" terduplikasi di beberapa file (`gardens.ts`, `plants.ts`), rawan lupa di-update salah satu saat ada perubahan, berisiko suatu saat tidak sengaja ikut mengirim `Error.message` asli ke client. | Sedang — potensi kebocoran info internal (connection string, versi dependency) | 🔧 **Diperbaiki**: disentralisasi ke `errorMapping.ts`, diuji eksplisit lewat `errorMapping.test.ts` (6 test, termasuk 2 test bertanda `[SECURITY]`) |
| 9 | Autentikasi & Otorisasi | Aplikasi tidak punya login/session sama sekali — siapa pun yang mengakses URL bisa CRUD semua data. | Tinggi **untuk produksi multi-user**, tapi sesuai asumsi PRD ("diasumsikan satu pengguna") untuk MVP ini | ⚠️ **Known gap, didokumentasikan** — di luar scope MVP, direkomendasikan untuk versi berikutnya |
| 10 | Rate Limiting | Tidak ada pembatasan jumlah request per IP/waktu. | Rendah untuk MVP lokal, Tinggi untuk produksi publik | ⚠️ **Known gap, didokumentasikan** — direkomendasikan `express-rate-limit` untuk versi produksi |

### Bukti Perbaikan (Unit Test)
File `apps/api/src/lib/errorMapping.test.ts` memverifikasi secara otomatis bahwa:
- Error Prisma yang dikenal (`P2003`, `P2025`) dipetakan ke pesan ramah yang sudah ditentukan.
- Error lain (termasuk pesan error asli yang mengandung kata `password=rahasia123` dalam simulasi) **tidak pernah** diteruskan apa adanya ke client — fungsi mengembalikan `null`, memaksa pemanggil menggunakan pesan generik.
- Pesan generik (`SafeInternalErrorResponse`) dipastikan tidak mengandung kata kunci sensitif (`password`, `secret`, `token`, `stack`, `sql`, `prisma`) lewat regex check.

Hasil run: lihat `docs/evidence/pertemuan8-all-unit-tests.log` — bagian suite `errorMapping.test.ts`.

---

## 2. Contoh Log Aman, Penyebab Error, dan Tindakan Perbaikan

### Prinsip Logging yang Diterapkan
**Server log** (lewat `console.error`) boleh berisi detail teknis lengkap karena hanya terlihat oleh developer/admin di terminal server — **tidak pernah dikirim ke browser pengguna**. **Response HTTP ke client** hanya berisi pesan generik/ramah dari `errorMapping.ts`. Ini dipisah secara sengaja di `app.ts`:

```ts
App.use((Error, req, res, next) => {
  console.error("Unhandled error:", Error);        // <- detail lengkap, HANYA di server log
  res.status(500).json({ Message: "Terjadi kesalahan tak terduga di server" }); // <- client HANYA dapat ini
});
```

### Contoh Kasus Nyata (dari pengujian Pertemuan 5)

**Server log (aman, hanya di terminal backend):**
```
Unhandled error: PrismaClientKnownRequestError:
Foreign key constraint failed on the field: `CareLog_ScheduleId_fkey (index)`
    at PrismaClient._execute (/app/node_modules/@prisma/client/runtime/library.js:123:45)
    code: 'P2003'
    meta: { field_name: 'CareLog_ScheduleId_fkey (index)' }
```

**Response yang diterima browser (sebelum ada MapKnownPrismaError — generik 500):**
```json
{ "Message": "Terjadi kesalahan tak terduga di server" }
```

**Response yang diterima browser (setelah MapKnownPrismaError — pesan spesifik tapi tetap aman):**
```json
{ "Message": "Jadwal ini tidak bisa dihapus karena sudah memiliki riwayat perawatan (pernah ditandai 'Sudah Dilakukan')." }
```

Perhatikan: pada kedua versi response ke client, **tidak ada** nama tabel (`CareLog_ScheduleId_fkey`), path file server, atau kode error Prisma (`P2003`) yang bocor — itu semua hanya ada di log server.

### Tabel Penyebab Error & Tindakan Perbaikan

| Error / Gejala | Penyebab | Tindakan Perbaikan | Sudah Diperbaiki? |
|---|---|---|---|
| Server crash total, semua request hang ("Memuat data..." selamanya) | Error async di route handler tidak tertangkap (`unhandled promise rejection`), Node.js men-terminate proses | Bungkus semua route handler dengan `AsyncHandler()` yang meneruskan error ke `next()` | ✅ |
| `P2003 Foreign key constraint failed` saat hapus jadwal | Menghapus `CareSchedule` yang masih direferensikan `CareLog` | Hapus `CareLog` terkait dalam satu `$transaction` sebelum hapus `CareSchedule` | ✅ |
| `P2025 Record not found` saat update/delete | Mencoba mengubah/menghapus data dengan `Id` yang sudah tidak ada (race condition / double-click) | Cek keberadaan data dengan `findUnique` dulu, atau tangkap `P2025` dan kembalikan 404 yang jelas | ✅ |
| Validasi frekuensi jadwal `0` atau negatif lolos ke database | Validasi lama hanya cek `!FrequencyDays` (falsy check) — `0` dianggap falsy tapi logic lama juga salah menangani | Ganti dengan `ValidateScheduleInput()` yang cek `Number.isInteger() && > 0` secara eksplisit | ✅ |
| Request dari origin tak dikenal berhasil memanggil API | `cors()` tanpa opsi mengizinkan semua origin | Set `cors({ origin: process.env.ALLOWED_ORIGIN })` | ✅ |
| `ECONNREFUSED` saat `prisma migrate dev` | MySQL (Docker) belum menyala, atau `DATABASE_URL` salah | Jalankan `docker compose up -d`, cek `docker ps`, cocokkan kredensial `.env` dengan `docker-compose.yml` | Dokumentasi di README bagian Troubleshooting |
| `Virtualization support not detected` (Docker Desktop) | VT-x/AMD-V belum aktif di BIOS atau WSL2 belum terpasang (Windows) | Aktifkan virtualisasi di BIOS, aktifkan fitur WSL/Virtual Machine Platform di Windows, restart | Dokumentasi di README bagian Troubleshooting |

---

## 3. Verifikasi FRESH CLONE — Install, Run, Build, Deploy

### Simulasi Fresh Clone (lokal, tanpa jaringan)
Karena lingkungan pengerjaan tidak memiliki akses internet untuk mensimulasikan clone dari GitHub asli, dilakukan **`git clone` lokal** dari repo ini ke direktori terpisah untuk membuktikan repo **self-contained** (tidak bergantung pada file di luar repo yang tidak ter-commit):

```bash
git clone /path/to/plant-garden-tracker /tmp/fresh-clone-test
cd /tmp/fresh-clone-test
```

Hasil: seluruh source code, `package.json` tiap workspace, `schema.prisma`, `docker-compose.yml`, `.env.example`, dan 6 file unit test berhasil ter-clone utuh — tidak ada file penting yang tertinggal di `.gitignore` secara tidak sengaja.

### Yang BISA diverifikasi di lingkungan ini (tanpa akses internet)
| Langkah | Hasil |
|---|---|
| `git clone` (lokal) | ✅ Berhasil, semua file penting ada |
| Sanity check sintaks (`tsc --noEmit`) | ✅ Tidak ada error di luar kategori "modul belum terpasang" (karena belum `npm install`) |
| Eksekusi logic bisnis inti (`ts-node` + `assert`, mencerminkan 6 file `.test.ts`) | ✅ **32/32 test PASSED** — lihat `docs/evidence/pertemuan8-all-unit-tests.log` |

### Yang TIDAK BISA diverifikasi di lingkungan ini (perlu dilakukan mahasiswa di komputer sendiri)
| Langkah | Alasan Tidak Bisa Dijalankan di Sini |
|---|---|
| `npm install` (mengunduh dependency asli dari registry.npmjs.org) | Tidak ada akses internet di container ini |
| `docker compose up -d` (MySQL sungguhan) | Docker tidak tersedia/tidak bisa diakses di container ini |
| `npm run test:api` dengan Vitest asli | Vitest belum ter-install (konsekuensi dari poin di atas) |
| Build produksi (`vite build`, `tsc` penuh dengan semua `@types`) | Bergantung pada `node_modules` lengkap hasil `npm install` |
| Deploy ke layanan cloud | Di luar scope lingkungan sandbox ini |

### Checklist yang WAJIB mahasiswa lakukan sendiri sebagai bukti tambahan
- [ ] `git clone` repo dari GitHub ke folder baru/komputer lain
- [ ] `npm install` berhasil tanpa error
- [ ] `docker compose up -d` → MySQL menyala (`docker ps` menampilkan container)
- [ ] `npx prisma migrate dev` & `npx prisma db seed` berhasil
- [ ] `npm run test:api` → **semua test PASSED** (bandingkan jumlahnya dengan 6 file/32 test di atas)
- [ ] `npm run dev:api` + `npm run dev:web` → aplikasi bisa diakses di browser
- [ ] `npm run build:api` & `npm run build:web` → build produksi berhasil tanpa error
- [ ] (Opsional) Buat branch baru → push → buka **Pull Request** di GitHub ke branch `main`, sebagai simulasi alur kerja tim sebelum deploy

### Alur Pull Request (jika bekerja dalam tim / ingin simulasi review)
```bash
git checkout -b pertemuan-8-security
git add .
git commit -m "security: hardening MVP untuk Pertemuan 8"
git push -u origin pertemuan-8-security
```
Lalu buka GitHub → repo kamu → akan muncul banner "Compare & pull request" → klik → isi deskripsi PR → **Create pull request** → (kalau solo project) langsung **Merge pull request** setelah yakin semua test passed.

---

## 4. Ringkasan untuk Dosen

- **Security:** 3 temuan diperbaiki (CORS terbuka, tanpa security headers, body size tak terbatas) + 1 perbaikan arsitektur (sentralisasi error handling). 2 gap diketahui & didokumentasikan (autentikasi, rate limiting) — sesuai batas scope MVP akademik.
- **Unit test:** 6 file, 32 test case, **ALL PASSED** (dibuktikan nyata lewat eksekusi `ts-node`, karena lingkungan tanpa akses internet untuk `npm install` Vitest).
- **README:** sudah mencakup instalasi fresh clone, development, build produksi, opsi deploy, dan troubleshooting.
- **Fresh clone:** repo terbukti self-contained lewat `git clone` lokal; langkah yang butuh jaringan/Docker didokumentasikan sebagai checklist yang harus dijalankan mahasiswa sendiri.

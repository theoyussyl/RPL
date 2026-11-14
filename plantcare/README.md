# 🪴 PlantCare

Aplikasi web perawatan tanaman (tugas Rekayasa Perangkat Lunak).

## Fitur
- Lihat, tambah, ubah, dan hapus tanaman (CRUD)
- Interval siram dan pupuk dalam hari, bulan, atau tahun
- Tanggal perawatan berikutnya dihitung otomatis
- Pengingat: banner di halaman + notifikasi browser
- Tombol "Sudah disiram" dan "Sudah dipupuk"
- 3 tema kebun (Hutan Hijau, Taman Bunga, Gurun Kaktus)

## Teknologi
React 18, Vite, Tailwind CSS, date-fns, localStorage, Web Notifications API

## Menjalankan
```bash
npm install
npm run dev
```

## Deploy ke Vercel
1. Upload proyek ke GitHub (tanpa `node_modules`).
2. Di vercel.com pilih **Add New → Project**, impor repo.
3. Build Command `npm run build`, Output Directory `dist`, lalu **Deploy**.

## Struktur
```
src/
  App.jsx               komponen utama & state
  components/           PlantCard, PlantForm, ReminderList, ConfirmDialog
  lib/storage.js        lapisan penyimpanan (ganti ke Supabase/Firebase di sini)
  lib/dateUtils.js      perhitungan jadwal (date-fns)
  lib/notify.js         notifikasi browser
  data/seed.js          data contoh bawaan
```

## Batasan & pengembangan
Data tersimpan di browser (localStorage), jadi tidak dibagikan antar perangkat.
Pengembangan: login pengguna dan database cloud (Supabase/Firebase).

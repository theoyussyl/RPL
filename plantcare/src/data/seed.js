import { daysAgo } from '../lib/dateUtils';

// Data contoh agar halaman tidak kosong saat pertama kali dibuka (mis. oleh dosen)
export const seedPlants = () => [
  { id: 1, name: 'Monstera', emoji: '🌿', waterEvery: 3, waterUnit: 'hari', fertEvery: 1, fertUnit: 'bulan', lastWater: daysAgo(4), lastFert: daysAgo(10) },
  { id: 2, name: 'Kaktus Mini', emoji: '🌵', waterEvery: 2, waterUnit: 'bulan', fertEvery: 6, fertUnit: 'bulan', lastWater: daysAgo(20), lastFert: daysAgo(60) },
  { id: 3, name: 'Mawar Merah', emoji: '🌹', waterEvery: 2, waterUnit: 'hari', fertEvery: 2, fertUnit: 'bulan', lastWater: daysAgo(1), lastFert: daysAgo(70) },
  { id: 4, name: 'Bunga Matahari', emoji: '🌻', waterEvery: 1, waterUnit: 'hari', fertEvery: 1, fertUnit: 'bulan', lastWater: daysAgo(0), lastFert: daysAgo(5) },
  { id: 5, name: 'Bonsai Beringin', emoji: '🌳', waterEvery: 5, waterUnit: 'hari', fertEvery: 1, fertUnit: 'tahun', lastWater: daysAgo(2), lastFert: daysAgo(100) },
];

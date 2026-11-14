// Lapisan penyimpanan. Saat ini memakai localStorage.
// Untuk pindah ke Supabase/Firebase, cukup ganti isi fungsi di file ini;
// komponen React tidak perlu diubah.
import { seedPlants } from '../data/seed';

const KEY = 'plantcare-plants';
const THEME_KEY = 'plantcare-theme';

const read = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* abaikan */ } };

export const getPlants = () => read(KEY, null) ?? seedPlants();
export const savePlants = (list) => write(KEY, list);

export const addPlant = (plant) => { const list = [...getPlants(), { ...plant, id: Date.now() }]; savePlants(list); return list; };
export const updatePlant = (id, data) => { const list = getPlants().map((p) => (p.id === id ? { ...p, ...data } : p)); savePlants(list); return list; };
export const deletePlant = (id) => { const list = getPlants().filter((p) => p.id !== id); savePlants(list); return list; };
export const resetPlants = () => { const list = seedPlants(); savePlants(list); return list; };

export const getTheme = () => read(THEME_KEY, 'hutan');
export const saveTheme = (t) => write(THEME_KEY, t);
export const getNotified = () => read('plantcare-notified', {});
export const saveNotified = (v) => write('plantcare-notified', v);

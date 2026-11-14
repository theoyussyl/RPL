import { addDays, addMonths, addYears, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

const ISO = 'yyyy-MM-dd';
const adders = { hari: addDays, bulan: addMonths, tahun: addYears };

export const today = () => format(new Date(), ISO);
export const daysAgo = (n) => format(addDays(new Date(), -n), ISO);
export const formatID = (s) => format(parseISO(s), 'd MMMM yyyy', { locale: id });

// Tanggal perawatan berikutnya = tanggal terakhir + interval (hari/bulan/tahun)
export const nextDate = (last, every, unit) => format(adders[unit](parseISO(last), Number(every)), ISO);

// type: 'water' atau 'fert'. Mengembalikan tanggal berikutnya, selisih hari, label, dan warna status
export function getStatus(plant, type) {
  const next = type === 'water'
    ? nextDate(plant.lastWater, plant.waterEvery, plant.waterUnit)
    : nextDate(plant.lastFert, plant.fertEvery, plant.fertUnit);
  const diff = differenceInCalendarDays(parseISO(next), new Date());
  if (diff < 0) return { next, diff, label: `Terlambat ${-diff} hari`, cls: 'bg-red-100 text-red-800' };
  if (diff === 0) return { next, diff, label: 'Hari ini!', cls: 'bg-orange-100 text-orange-800' };
  if (diff === 1) return { next, diff, label: 'Besok', cls: 'bg-yellow-100 text-yellow-800' };
  return { next, diff, label: `${diff} hari lagi`, cls: 'bg-green-100 text-green-800' };
}

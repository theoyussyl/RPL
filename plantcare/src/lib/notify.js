import { today } from './dateUtils';
import { getNotified, saveNotified } from './storage';

export const notifSupported = () => typeof Notification !== 'undefined';

// Kirim notifikasi browser, maksimal sekali per hari untuk tiap pengingat
export function sendNotifications(alerts) {
  if (!notifSupported() || Notification.permission !== 'granted') return;
  const seen = getNotified();
  alerts.forEach((a) => {
    if (seen[a.key] !== today()) {
      try { new Notification('PlantCare 🌱', { body: a.text }); } catch { /* abaikan */ }
      seen[a.key] = today();
    }
  });
  saveNotified(seen);
}

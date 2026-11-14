import { useEffect, useMemo, useState } from 'react';
import PlantCard from './components/PlantCard';
import PlantForm from './components/PlantForm';
import ReminderList from './components/ReminderList';
import ConfirmDialog from './components/ConfirmDialog';
import * as store from './lib/storage';
import { getStatus, formatID, today } from './lib/dateUtils';
import { notifSupported, sendNotifications } from './lib/notify';

const THEMES = { hutan: '🌲 Hutan Hijau', bunga: '🌸 Taman Bunga', gurun: '🌵 Gurun Kaktus' };

export default function App() {
  const [plants, setPlants] = useState(store.getPlants);
  const [theme, setTheme] = useState(store.getTheme);
  const [editing, setEditing] = useState(null); // null = tertutup, {} = tambah, objek tanaman = ubah
  const [deleteId, setDeleteId] = useState(null);
  const [tick, setTick] = useState(0);
  const [permission, setPermission] = useState(notifSupported() ? Notification.permission : 'unsupported');

  useEffect(() => { document.documentElement.dataset.theme = theme; store.saveTheme(theme); }, [theme]);
  useEffect(() => { store.savePlants(plants); }, [plants]);
  // Cek ulang jadwal tiap menit selama tab terbuka
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 60000); return () => clearInterval(t); }, []);

  const alerts = useMemo(() => {
    const list = [];
    plants.forEach((p) => {
      const w = getStatus(p, 'water');
      const f = getStatus(p, 'fert');
      if (w.diff <= 0) list.push({ key: `${p.id}-w`, text: `${p.emoji} ${p.name} perlu disiram ${w.diff < 0 ? `(terlambat ${-w.diff} hari)` : 'hari ini'}` });
      if (f.diff <= 0) list.push({ key: `${p.id}-f`, text: `${p.emoji} ${p.name} perlu dipupuk ${f.diff < 0 ? `(terlambat ${-f.diff} hari)` : 'hari ini'}` });
    });
    return list;
  }, [plants, tick]);

  useEffect(() => { if (permission === 'granted') sendNotifications(alerts); }, [alerts, permission]);

  const enableNotif = () => notifSupported() && Notification.requestPermission().then(setPermission);

  const handleSave = (data) => {
    setPlants(editing.id ? store.updatePlant(editing.id, data) : store.addPlant(data));
    setEditing(null);
  };
  const markDone = (id, field) => setPlants(store.updatePlant(id, { [field]: today() }));

  return (
    <div>
      <header className="px-4 pt-6 pb-8 text-white" style={{ background: 'var(--head)' }}>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-extrabold">🪴 PlantCare</h1>
          <p className="opacity-90">Kebun kecilmu, jadwal rawat yang rapi. Hari ini: {formatID(today())}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(THEMES).map(([k, v]) => (
              <button key={k} onClick={() => setTheme(k)} className="px-3 py-1 rounded-full text-sm font-bold"
                style={{ background: theme === k ? '#fff' : 'rgba(255,255,255,.25)', color: theme === k ? 'var(--accent)' : '#fff' }}>{v}</button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 -mt-4 pb-10 space-y-4">
        <ReminderList alerts={alerts} permission={permission} onEnable={enableNotif} />

        <div className="flex flex-wrap justify-between items-center gap-2">
          <h2 className="text-xl font-extrabold">Tanaman Saya ({plants.length})</h2>
          <div className="flex gap-2">
            <button className="btn-outline text-sm" onClick={() => setPlants(store.resetPlants())}>Reset data contoh</button>
            <button className="btn" onClick={() => setEditing({})}>+ Tambah Tanaman</button>
          </div>
        </div>

        {plants.length === 0 && <div className="card p-8 text-center">🌱 Belum ada tanaman. Klik “Tambah Tanaman” untuk mulai.</div>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plants.map((p, i) => (
            <PlantCard key={p.id} plant={p} index={i}
              onWatered={() => markDone(p.id, 'lastWater')}
              onFertilized={() => markDone(p.id, 'lastFert')}
              onEdit={() => setEditing(p)}
              onDelete={() => setDeleteId(p.id)} />
          ))}
        </div>
      </main>

      {editing && <PlantForm plant={editing.id ? editing : null} onSave={handleSave} onClose={() => setEditing(null)} />}
      {deleteId && (
        <ConfirmDialog onCancel={() => setDeleteId(null)}
          onConfirm={() => { setPlants(store.deletePlant(deleteId)); setDeleteId(null); }} />
      )}
    </div>
  );
}

import { useState } from 'react';
import { today } from '../lib/dateUtils';

const EMOJIS = ['🌿', '🌵', '🌹', '🌻', '🌳', '🌷', '🪴', '🍀', '🌺', '🎋'];
const UNITS = ['hari', 'bulan', 'tahun'];

function UnitSelect({ value, onChange }) {
  return (
    <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
      {UNITS.map((u) => <option key={u}>{u}</option>)}
    </select>
  );
}

// Dipakai untuk tambah (plant = null) maupun ubah (plant berisi data lama)
export default function PlantForm({ plant, onSave, onClose }) {
  const [f, setF] = useState(plant ?? {
    name: '', emoji: '🌿', waterEvery: 3, waterUnit: 'hari',
    fertEvery: 1, fertUnit: 'bulan', lastWater: today(), lastFert: today(),
  });
  const set = (k, v) => setF({ ...f, [k]: v });
  const valid = f.name.trim() && f.waterEvery > 0 && f.fertEvery > 0;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="card p-5 w-full max-w-md max-h-full overflow-auto space-y-3">
        <h2 className="text-xl font-extrabold">{plant ? '✏️ Ubah Tanaman' : '🌱 Tambah Tanaman'}</h2>
        <label className="block text-sm">Nama tanaman
          <input className="field" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="cth: Lidah Buaya" />
        </label>
        <div className="flex flex-wrap gap-1">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => set('emoji', e)} className="text-2xl rounded-lg px-1"
              style={{ outline: f.emoji === e ? '3px solid var(--accent)' : 'none' }}>{e}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">💧 Siram setiap
            <input className="field" type="number" min="1" value={f.waterEvery} onChange={(e) => set('waterEvery', e.target.value)} />
          </label>
          <label className="text-sm">Satuan <UnitSelect value={f.waterUnit} onChange={(v) => set('waterUnit', v)} /></label>
          <label className="text-sm">🧪 Pupuk setiap
            <input className="field" type="number" min="1" value={f.fertEvery} onChange={(e) => set('fertEvery', e.target.value)} />
          </label>
          <label className="text-sm">Satuan <UnitSelect value={f.fertUnit} onChange={(v) => set('fertUnit', v)} /></label>
          <label className="text-sm">Terakhir disiram
            <input className="field" type="date" value={f.lastWater} onChange={(e) => set('lastWater', e.target.value)} />
          </label>
          <label className="text-sm">Terakhir dipupuk
            <input className="field" type="date" value={f.lastFert} onChange={(e) => set('lastFert', e.target.value)} />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-outline" onClick={onClose}>Batal</button>
          <button className="btn disabled:opacity-50" disabled={!valid}
            onClick={() => onSave({ ...f, name: f.name.trim(), waterEvery: Number(f.waterEvery), fertEvery: Number(f.fertEvery) })}>
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

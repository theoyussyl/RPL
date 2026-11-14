import { getStatus, formatID } from '../lib/dateUtils';

const TINTS = ['#e3f4dc', '#fde7ef', '#fff3cf', '#e4f0fb', '#efe6f8'];

function CareRow({ icon, title, status, every, unit, doneText, onDone }) {
  return (
    <div className="rounded-xl p-2 mt-2" style={{ background: 'rgba(127,127,127,.1)' }}>
      <div className="flex justify-between items-center gap-2 text-sm">
        <b>{icon} {title}</b>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${status.cls}`}>{status.label}</span>
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
        Setiap {every} {unit} · berikutnya: {formatID(status.next)}
      </div>
      <button className="btn-outline mt-2 text-sm w-full" onClick={onDone}>{doneText}</button>
    </div>
  );
}

export default function PlantCard({ plant, index, onWatered, onFertilized, onEdit, onDelete }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-3 flex items-center gap-3" style={{ background: TINTS[index % TINTS.length], color: '#1f2d22' }}>
        <span className="text-4xl">{plant.emoji}</span>
        <b className="text-lg flex-1">{plant.name}</b>
      </div>
      <div className="p-3">
        <CareRow icon="💧" title="Air" status={getStatus(plant, 'water')} every={plant.waterEvery} unit={plant.waterUnit} doneText="Sudah disiram" onDone={onWatered} />
        <CareRow icon="🧪" title="Pupuk" status={getStatus(plant, 'fert')} every={plant.fertEvery} unit={plant.fertUnit} doneText="Sudah dipupuk" onDone={onFertilized} />
        <div className="flex gap-2 mt-3">
          <button className="btn-outline text-sm flex-1" onClick={onEdit}>✏️ Ubah</button>
          <button className="btn-outline text-sm flex-1" style={{ borderColor: '#c0392b', color: '#c0392b' }} onClick={onDelete}>🗑️ Hapus</button>
        </div>
      </div>
    </div>
  );
}

export default function ReminderList({ alerts, permission, onEnable }) {
  return (
    <div className="card p-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h2 className="font-extrabold">🔔 Pengingat ({alerts.length})</h2>
        {permission === 'default' && (
          <button className="btn-outline text-sm" onClick={onEnable}>Aktifkan notifikasi browser</button>
        )}
        {permission === 'denied' && (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>Notifikasi browser diblokir, banner ini tetap aktif.</span>
        )}
        {permission === 'granted' && (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>Notifikasi browser aktif ✓</span>
        )}
      </div>
      {alerts.length === 0 ? (
        <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Semua tanaman aman. Tidak ada yang perlu dirawat hari ini 🎉</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {alerts.map((a) => (
            <li key={a.key} className="text-sm rounded-lg px-3 py-1.5 bg-orange-100 text-orange-900">{a.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ConfirmDialog({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div className="card p-5 max-w-sm w-full">
        <p className="font-bold">Hapus tanaman ini?</p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Data tidak bisa dikembalikan.</p>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn-outline" onClick={onCancel}>Batal</button>
          <button className="btn" style={{ background: '#c0392b' }} onClick={onConfirm}>Hapus</button>
        </div>
      </div>
    </div>
  );
}

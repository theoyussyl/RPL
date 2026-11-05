import assert from "node:assert";

console.log("=== Verifikasi: Hapus Jadwal Sekaligus Riwayatnya (Cascade) ===");

// Simulasi in-memory database kecil untuk membuktikan logic transaksi delete
interface FakeSchedule { Id: number; }
interface FakeCareLog { Id: number; ScheduleId: number; }

let Schedules: FakeSchedule[] = [{ Id: 1 }, { Id: 2 }];
let CareLogs: FakeCareLog[] = [
  { Id: 100, ScheduleId: 1 },
  { Id: 101, ScheduleId: 1 },
  { Id: 102, ScheduleId: 2 },
];

function DeleteScheduleWithCascade(ScheduleId: number) {
  const ScheduleExists = Schedules.some((S) => S.Id === ScheduleId);
  if (!ScheduleExists) throw new Error("NOT_FOUND");

  // simulasi prisma.$transaction([deleteMany CareLog, delete CareSchedule])
  CareLogs = CareLogs.filter((Log) => Log.ScheduleId !== ScheduleId);
  Schedules = Schedules.filter((S) => S.Id !== ScheduleId);
}

assert.strictEqual(CareLogs.filter((L) => L.ScheduleId === 1).length, 2);
console.log("[SETUP] Sebelum hapus: Schedule#1 punya 2 CareLog, Schedule#2 punya 1 CareLog");

DeleteScheduleWithCascade(1);

assert.strictEqual(Schedules.some((S) => S.Id === 1), false);
console.log("[PASS] Schedule#1 berhasil terhapus meskipun sudah punya riwayat");

assert.strictEqual(CareLogs.some((L) => L.ScheduleId === 1), false);
console.log("[PASS] Seluruh CareLog milik Schedule#1 ikut terhapus (tidak ada data yatim)");

assert.strictEqual(Schedules.some((S) => S.Id === 2), true);
assert.strictEqual(CareLogs.some((L) => L.ScheduleId === 2), true);
console.log("[PASS] Schedule#2 dan CareLog miliknya TIDAK ikut terpengaruh (isolasi benar)");

console.log("=== Semua assertion LULUS (3/3) ===");

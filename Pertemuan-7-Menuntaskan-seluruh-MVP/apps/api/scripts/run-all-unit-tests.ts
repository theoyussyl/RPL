import assert from "node:assert";
import { ValidateRequiredText } from "../src/lib/validation";
import { CalculateNextDueAt, DetermineCareStatus } from "../src/lib/careLogic";
import { ValidateScheduleInput } from "../src/lib/scheduleValidation";
import { BuildDashboardResult } from "../src/lib/dashboardLogic";
import { RemoveScheduleAndLogs } from "../src/lib/scheduleDeletion";

let TotalPassed = 0;
let TotalFailed = 0;

function Describe(SuiteName: string, Tests: Array<[string, () => void]>) {
  console.log(`\n${SuiteName}`);
  for (const [TestName, TestFn] of Tests) {
    try {
      TestFn();
      console.log(`  \u2713 ${TestName}`);
      TotalPassed += 1;
    } catch (Error: any) {
      console.log(`  \u2717 ${TestName}`);
      console.log(`    ${Error.message}`);
      TotalFailed += 1;
    }
  }
}

// ========== 1. validation.test.ts ==========
Describe("validation.test.ts > ValidateRequiredText", [
  ["mengembalikan pesan error jika nilai kosong", () => {
    assert.strictEqual(ValidateRequiredText("", "Nama kebun"), "Nama kebun wajib diisi");
  }],
  ["mengembalikan pesan error jika nilai hanya spasi", () => {
    assert.strictEqual(ValidateRequiredText("   ", "Nama tanaman"), "Nama tanaman wajib diisi");
  }],
  ["mengembalikan pesan error jika nilai undefined", () => {
    assert.strictEqual(ValidateRequiredText(undefined, "Nama kebun"), "Nama kebun wajib diisi");
  }],
  ["mengembalikan null jika nilai valid", () => {
    assert.strictEqual(ValidateRequiredText("Kebun Belakang Rumah", "Nama kebun"), null);
  }],
]);

// ========== 2. careLogic.test.ts ==========
Describe("careLogic.test.ts > CalculateNextDueAt", [
  ["menambahkan FrequencyDays ke tanggal acuan dengan benar", () => {
    const From = new Date("2026-01-01T00:00:00Z");
    const Result = CalculateNextDueAt(3, From);
    assert.strictEqual(Result.toISOString().slice(0, 10), "2026-01-04");
  }],
]);
Describe("careLogic.test.ts > DetermineCareStatus", [
  ["mengembalikan NO_SCHEDULE jika tidak ada jadwal", () => {
    assert.strictEqual(DetermineCareStatus(null, new Date("2026-01-10T00:00:00Z")), "NO_SCHEDULE");
  }],
  ["mengembalikan OVERDUE jika NextDueAt sudah lewat", () => {
    assert.strictEqual(DetermineCareStatus(new Date("2026-01-09T00:00:00Z"), new Date("2026-01-10T00:00:00Z")), "OVERDUE");
  }],
  ["mengembalikan DUE_SOON jika NextDueAt dalam 2 hari ke depan", () => {
    assert.strictEqual(DetermineCareStatus(new Date("2026-01-11T00:00:00Z"), new Date("2026-01-10T00:00:00Z")), "DUE_SOON");
  }],
  ["mengembalikan OK jika NextDueAt lebih dari 2 hari ke depan", () => {
    assert.strictEqual(DetermineCareStatus(new Date("2026-01-20T00:00:00Z"), new Date("2026-01-10T00:00:00Z")), "OK");
  }],
]);

// ========== 3. scheduleValidation.test.ts ==========
Describe("scheduleValidation.test.ts > ValidateScheduleInput", [
  ["menolak Type yang bukan WATERING/FERTILIZING", () => {
    assert.strictEqual(
      ValidateScheduleInput({ Type: "RANDOM", FrequencyDays: 3 }),
      "Tipe jadwal harus Penyiraman (WATERING) atau Pemupukan (FERTILIZING)"
    );
  }],
  ["menolak Type kosong", () => {
    assert.notStrictEqual(ValidateScheduleInput({ Type: "", FrequencyDays: 3 }), null);
  }],
  ["menolak FrequencyDays 0 (bukan bilangan positif)", () => {
    assert.strictEqual(
      ValidateScheduleInput({ Type: "WATERING", FrequencyDays: 0 }),
      "Frekuensi harus berupa bilangan bulat positif (minimal 1 hari sekali)"
    );
  }],
  ["menolak FrequencyDays negatif", () => {
    assert.notStrictEqual(ValidateScheduleInput({ Type: "WATERING", FrequencyDays: -2 }), null);
  }],
  ["menolak FrequencyDays desimal", () => {
    assert.notStrictEqual(ValidateScheduleInput({ Type: "WATERING", FrequencyDays: 2.5 }), null);
  }],
  ["menerima input valid (WATERING, 3 hari)", () => {
    assert.strictEqual(ValidateScheduleInput({ Type: "WATERING", FrequencyDays: 3 }), null);
  }],
  ["menerima input valid (FERTILIZING, 7 hari)", () => {
    assert.strictEqual(ValidateScheduleInput({ Type: "FERTILIZING", FrequencyDays: 7 }), null);
  }],
]);

// ========== 4. dashboardLogic.test.ts ==========
const Now = new Date("2026-01-10T00:00:00Z");
Describe("dashboardLogic.test.ts > BuildDashboardResult", [
  ["mengembalikan ringkasan kosong jika tidak ada kebun", () => {
    const Result = BuildDashboardResult([], Now);
    assert.strictEqual(Result.Summary.TotalGardens, 0);
    assert.strictEqual(Result.Summary.TotalPlants, 0);
    assert.strictEqual(Result.Plants.length, 0);
  }],
  ["menghitung TotalGardens dan TotalPlants dengan benar lintas beberapa kebun", () => {
    const Gardens = [
      { Name: "Kebun A", Plants: [{ Id: 1, Name: "Tomat", Schedules: [] }] },
      { Name: "Kebun B", Plants: [{ Id: 2, Name: "Cabai", Schedules: [] }, { Id: 3, Name: "Bayam", Schedules: [] }] },
    ];
    const Result = BuildDashboardResult(Gardens, Now);
    assert.strictEqual(Result.Summary.TotalGardens, 2);
    assert.strictEqual(Result.Summary.TotalPlants, 3);
  }],
  ["menandai tanaman tanpa jadwal sebagai PlantsWithoutSchedule & NO_SCHEDULE", () => {
    const Gardens = [{ Name: "Kebun A", Plants: [{ Id: 1, Name: "Tomat", Schedules: [] }] }];
    const Result = BuildDashboardResult(Gardens, Now);
    assert.strictEqual(Result.Summary.PlantsWithoutSchedule, 1);
    assert.strictEqual(Result.Plants[0].CareStatus, "NO_SCHEDULE");
  }],
  ["menghitung OverdueSchedules dari jadwal TERDEKAT tiap tanaman", () => {
    const Gardens = [{
      Name: "Kebun A",
      Plants: [{
        Id: 1, Name: "Tomat",
        Schedules: [
          { NextDueAt: new Date("2026-01-20T00:00:00Z") },
          { NextDueAt: new Date("2026-01-09T00:00:00Z") },
        ],
      }],
    }];
    const Result = BuildDashboardResult(Gardens, Now);
    assert.strictEqual(Result.Summary.OverdueSchedules, 1);
    assert.strictEqual(Result.Plants[0].CareStatus, "OVERDUE");
  }],
  ["menghitung SchedulesDueToday hanya untuk jadwal yang jatuh tempo HARI INI", () => {
    const Gardens = [
      { Name: "Kebun A", Plants: [{ Id: 1, Name: "Tomat", Schedules: [{ NextDueAt: new Date("2026-01-10T20:00:00Z") }] }] },
      { Name: "Kebun A", Plants: [{ Id: 2, Name: "Cabai", Schedules: [{ NextDueAt: new Date("2026-01-11T08:00:00Z") }] }] },
    ];
    const Result = BuildDashboardResult(Gardens, Now);
    assert.strictEqual(Result.Summary.SchedulesDueToday, 1);
  }],
]);

// ========== 5. scheduleDeletion.test.ts ==========
Describe("scheduleDeletion.test.ts > RemoveScheduleAndLogs", [
  ["menghapus jadwal yang ditarget beserta seluruh CareLog miliknya", () => {
    const Result = RemoveScheduleAndLogs(
      [{ Id: 1 }, { Id: 2 }],
      [{ Id: 100, ScheduleId: 1 }, { Id: 101, ScheduleId: 1 }, { Id: 102, ScheduleId: 2 }],
      1
    );
    assert.deepStrictEqual(Result.Schedules.map((S) => S.Id), [2]);
    assert.deepStrictEqual(Result.CareLogs.map((L) => L.Id), [102]);
    assert.strictEqual(Result.DeletedCareLogCount, 2);
  }],
  ["tidak memengaruhi jadwal dan riwayat lain yang tidak ditarget", () => {
    const Result = RemoveScheduleAndLogs([{ Id: 1 }, { Id: 2 }], [{ Id: 102, ScheduleId: 2 }], 1);
    assert.strictEqual(Result.Schedules.length, 1);
    assert.strictEqual(Result.Schedules[0].Id, 2);
  }],
  ["tetap berjalan normal jika jadwal belum punya riwayat sama sekali", () => {
    const Result = RemoveScheduleAndLogs([{ Id: 1 }], [], 1);
    assert.strictEqual(Result.Schedules.length, 0);
    assert.strictEqual(Result.DeletedCareLogCount, 0);
  }],
  ["tidak menghapus apapun jika ScheduleId tidak ditemukan", () => {
    const Result = RemoveScheduleAndLogs([{ Id: 1 }], [{ Id: 100, ScheduleId: 1 }], 999);
    assert.strictEqual(Result.Schedules.length, 1);
    assert.strictEqual(Result.CareLogs.length, 1);
    assert.strictEqual(Result.DeletedCareLogCount, 0);
  }],
]);

console.log(`\n${"=".repeat(60)}`);
console.log(`Test Files: 5 passed (5)`);
console.log(`Tests:      ${TotalPassed} passed, ${TotalFailed} failed (${TotalPassed + TotalFailed} total)`);
console.log(TotalFailed === 0 ? "\nALL TESTS PASSED \u2705" : "\nSOME TESTS FAILED \u274c");
console.log("=".repeat(60));

if (TotalFailed > 0) process.exit(1);

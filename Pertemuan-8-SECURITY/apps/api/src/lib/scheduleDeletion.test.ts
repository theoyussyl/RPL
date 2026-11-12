import { describe, it, expect } from "vitest";
import { RemoveScheduleAndLogs } from "./scheduleDeletion";

describe("RemoveScheduleAndLogs", () => {
  it("menghapus jadwal yang ditarget beserta seluruh CareLog miliknya", () => {
    const Result = RemoveScheduleAndLogs(
      [{ Id: 1 }, { Id: 2 }],
      [{ Id: 100, ScheduleId: 1 }, { Id: 101, ScheduleId: 1 }, { Id: 102, ScheduleId: 2 }],
      1
    );
    expect(Result.Schedules.map((S) => S.Id)).toEqual([2]);
    expect(Result.CareLogs.map((L) => L.Id)).toEqual([102]);
    expect(Result.DeletedCareLogCount).toBe(2);
  });
  it("tidak memengaruhi jadwal dan riwayat lain yang tidak ditarget", () => {
    const Result = RemoveScheduleAndLogs([{ Id: 1 }, { Id: 2 }], [{ Id: 102, ScheduleId: 2 }], 1);
    expect(Result.Schedules).toHaveLength(1);
    expect(Result.Schedules[0].Id).toBe(2);
  });
  it("tetap berjalan normal jika jadwal belum punya riwayat", () => {
    const Result = RemoveScheduleAndLogs([{ Id: 1 }], [], 1);
    expect(Result.Schedules).toHaveLength(0);
    expect(Result.DeletedCareLogCount).toBe(0);
  });
  it("tidak menghapus apapun jika ScheduleId tidak ditemukan", () => {
    const Result = RemoveScheduleAndLogs([{ Id: 1 }], [{ Id: 100, ScheduleId: 1 }], 999);
    expect(Result.Schedules).toHaveLength(1);
    expect(Result.DeletedCareLogCount).toBe(0);
  });
});

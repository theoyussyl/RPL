export interface ScheduleRecord { Id: number; }
export interface CareLogRecord { Id: number; ScheduleId: number; }

export interface CascadeDeleteResult {
  Schedules: ScheduleRecord[];
  CareLogs: CareLogRecord[];
  DeletedCareLogCount: number;
}

export function RemoveScheduleAndLogs(
  Schedules: ScheduleRecord[],
  CareLogs: CareLogRecord[],
  ScheduleId: number
): CascadeDeleteResult {
  const RemainingCareLogs = CareLogs.filter((Log) => Log.ScheduleId !== ScheduleId);
  const DeletedCareLogCount = CareLogs.length - RemainingCareLogs.length;
  return {
    Schedules: Schedules.filter((Schedule) => Schedule.Id !== ScheduleId),
    CareLogs: RemainingCareLogs,
    DeletedCareLogCount,
  };
}

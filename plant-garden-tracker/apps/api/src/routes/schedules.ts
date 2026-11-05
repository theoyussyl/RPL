import { Router } from "express";
import { prisma } from "../lib/prisma";
import { CalculateNextDueAt } from "../lib/careLogic";
import { AsyncHandler } from "../lib/asyncHandler";

export const ScheduleRouter = Router();

ScheduleRouter.delete("/:Id", AsyncHandler(async (req, res) => {
  const ScheduleId = Number(req.params.Id);

  const Schedule = await prisma.careSchedule.findUnique({ where: { Id: ScheduleId } });
  if (!Schedule) return res.status(404).json({ Message: "Jadwal tidak ditemukan" });

  // Jadwal boleh dihapus kapan saja, termasuk saat sudah punya riwayat (CareLog) --
  // misalnya karena pengguna salah input. Riwayat terkait ikut dihapus sekalian
  // dalam satu transaksi, supaya tidak ada CareLog "yatim" yang menunjuk ke
  // jadwal yang sudah tidak ada.
  await prisma.$transaction([
    prisma.careLog.deleteMany({ where: { ScheduleId } }),
    prisma.careSchedule.delete({ where: { Id: ScheduleId } }),
  ]);

  res.status(204).send();
}));

ScheduleRouter.post("/:Id/done", AsyncHandler(async (req, res) => {
  const Schedule = await prisma.careSchedule.findUnique({ where: { Id: Number(req.params.Id) } });
  if (!Schedule) return res.status(404).json({ Message: "Jadwal tidak ditemukan" });

  const DoneAt = new Date();
  const NextDueAt = CalculateNextDueAt(Schedule.FrequencyDays, DoneAt);

  await prisma.careLog.create({
    data: { PlantId: Schedule.PlantId, ScheduleId: Schedule.Id, Type: Schedule.Type, DoneAt },
  });

  const Updated = await prisma.careSchedule.update({
    where: { Id: Schedule.Id },
    data: { LastDoneAt: DoneAt, NextDueAt },
  });

  res.json({
    ScheduleId: Updated.Id,
    PlantId: Updated.PlantId,
    Type: Updated.Type,
    DoneAt,
    NextDueAt: Updated.NextDueAt,
    Message: "Perawatan berhasil dicatat",
  });
}));

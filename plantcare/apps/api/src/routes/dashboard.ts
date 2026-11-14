import { Router } from "express";
import { prisma } from "../lib/prisma";
import { BuildDashboardResult } from "../lib/dashboardLogic";
import { AsyncHandler } from "../lib/asyncHandler";

export const DashboardRouter = Router();

DashboardRouter.get("/", AsyncHandler(async (req, res) => {
  const Gardens = await prisma.garden.findMany({ include: { Plants: { include: { Schedules: true } } } });
  const Result = BuildDashboardResult(Gardens, new Date());
  res.json(Result);
}));

import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../middleware/errorHandler";
import * as statsService from "../services/stats.service";
import { statsRangeSchema } from "../validators/stats.validator";

export async function getOverviewStats(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = statsRangeSchema.safeParse(req.query.range);
    if (!parsed.success) {
      throw new HttpError(400, "Invalid range");
    }
    const stats = await statsService.getOverviewStats(parsed.data);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

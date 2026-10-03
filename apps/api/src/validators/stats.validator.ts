import { z } from "zod";

export const statsRangeSchema = z.enum(["7d", "30d", "90d", "all"]).default("30d");
export type StatsRange = z.infer<typeof statsRangeSchema>;

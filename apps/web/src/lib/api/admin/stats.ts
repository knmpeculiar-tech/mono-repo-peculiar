import type { Stats, StatsRange } from "@/types/api";
import { apiFetch } from "@/lib/api/client";

export function getAdminStats(range: StatsRange, accessToken?: string | null) {
  return apiFetch<Stats>(`/admin/stats?range=${range}`, { accessToken });
}

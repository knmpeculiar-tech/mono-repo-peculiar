import type { Profile } from "@/types/api";
import { apiFetch } from "@/lib/api/client";

// Confirms the logged-in user is actually an admin (401/403 otherwise) —
// see apps/api's GET /admin/me and docs/decisions.md for why this exists.
export function getAdminMe(accessToken?: string | null) {
  return apiFetch<Profile>("/admin/me", { accessToken });
}

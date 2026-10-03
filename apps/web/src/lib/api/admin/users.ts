import type { AdminUserDetail, AdminUserListItem, Profile, Role } from "@/types/api";
import { apiFetch } from "@/lib/api/client";

export interface CreateUserInput {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  role: Role;
}

export function listAdminUsers(accessToken?: string | null) {
  return apiFetch<AdminUserListItem[]>("/admin/users", { accessToken });
}

export function getAdminUser(id: string, accessToken?: string | null) {
  return apiFetch<AdminUserDetail>(`/admin/users/${id}`, { accessToken });
}

export function createAdminUser(input: CreateUserInput, accessToken?: string | null) {
  return apiFetch<Profile>("/admin/users", { method: "POST", body: input, accessToken });
}

export function deleteAdminUser(id: string, accessToken?: string | null) {
  return apiFetch<void>(`/admin/users/${id}`, { method: "DELETE", accessToken });
}

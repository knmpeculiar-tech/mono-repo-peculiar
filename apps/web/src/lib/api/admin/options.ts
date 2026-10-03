import type { PackOption, SizeOption } from "@/types/api";
import { apiFetch } from "@/lib/api/client";

export interface SizeOptionInput {
  name: string;
  sortOrder?: number;
}

export interface PackOptionInput {
  name: string;
  padsPerPack: number;
  sortOrder?: number;
}

export function listSizeOptions(accessToken?: string | null) {
  return apiFetch<SizeOption[]>("/admin/sizes", { accessToken });
}

export function createSizeOption(input: SizeOptionInput) {
  return apiFetch<SizeOption>("/admin/sizes", { method: "POST", body: input });
}

export function updateSizeOption(id: string, input: Partial<SizeOptionInput>) {
  return apiFetch<SizeOption>(`/admin/sizes/${id}`, { method: "PATCH", body: input });
}

export function deleteSizeOption(id: string) {
  return apiFetch<void>(`/admin/sizes/${id}`, { method: "DELETE" });
}

export function listPackOptions(accessToken?: string | null) {
  return apiFetch<PackOption[]>("/admin/packs", { accessToken });
}

export function createPackOption(input: PackOptionInput) {
  return apiFetch<PackOption>("/admin/packs", { method: "POST", body: input });
}

export function updatePackOption(id: string, input: Partial<PackOptionInput>) {
  return apiFetch<PackOption>(`/admin/packs/${id}`, { method: "PATCH", body: input });
}

export function deletePackOption(id: string) {
  return apiFetch<void>(`/admin/packs/${id}`, { method: "DELETE" });
}

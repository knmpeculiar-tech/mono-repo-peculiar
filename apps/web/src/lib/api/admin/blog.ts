import type { BlogPost } from "@/types/api";
import { apiFetch } from "@/lib/api/client";

export interface CreateBlogPostInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
}
export type UpdateBlogPostInput = Partial<CreateBlogPostInput>;

export function listAdminBlogPosts(accessToken?: string | null) {
  return apiFetch<BlogPost[]>("/admin/blog", { accessToken });
}

export function getAdminBlogPost(id: string, accessToken?: string | null) {
  return apiFetch<BlogPost>(`/admin/blog/${id}`, { accessToken });
}

export function createBlogPost(input: CreateBlogPostInput, accessToken?: string | null) {
  return apiFetch<BlogPost>("/admin/blog", { method: "POST", body: input, accessToken });
}

export function updateBlogPost(id: string, input: UpdateBlogPostInput, accessToken?: string | null) {
  return apiFetch<BlogPost>(`/admin/blog/${id}`, { method: "PATCH", body: input, accessToken });
}

export function deleteBlogPost(id: string, accessToken?: string | null) {
  return apiFetch<void>(`/admin/blog/${id}`, { method: "DELETE", accessToken });
}

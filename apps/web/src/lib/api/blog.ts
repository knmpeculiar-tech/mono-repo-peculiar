import type { BlogPost } from "@/types/api";
import { apiFetch } from "./client";

export function listBlogPosts(revalidate?: number) {
  return apiFetch<BlogPost[]>("/blog", { accessToken: null, next: { revalidate } });
}

export function getBlogPostBySlug(slug: string, revalidate?: number) {
  return apiFetch<BlogPost>(`/blog/${slug}`, { accessToken: null, next: { revalidate } });
}

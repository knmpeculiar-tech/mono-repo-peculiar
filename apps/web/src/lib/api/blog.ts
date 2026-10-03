import type { BlogPost } from "@/types/api";
import { STOREFRONT_TAG } from "@/lib/cache/storefrontTag";
import { apiFetch } from "./client";

export function listBlogPosts(revalidate?: number) {
  return apiFetch<BlogPost[]>("/blog", { accessToken: null, next: { revalidate, tags: [STOREFRONT_TAG] } });
}

export function getBlogPostBySlug(slug: string, revalidate?: number) {
  return apiFetch<BlogPost>(`/blog/${slug}`, { accessToken: null, next: { revalidate, tags: [STOREFRONT_TAG] } });
}

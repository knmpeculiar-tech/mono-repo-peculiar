import type { Product } from "@/types/api";
import { STOREFRONT_TAG } from "@/lib/cache/storefrontTag";
import { apiFetch } from "./client";

// Purely public, unauthenticated endpoints — accessToken: null skips the
// session lookup entirely rather than attaching a token the API ignores.
export function listProducts(revalidate?: number) {
  return apiFetch<Product[]>("/products", { accessToken: null, next: { revalidate, tags: [STOREFRONT_TAG] } });
}

export function getProductBySlug(slug: string, revalidate?: number) {
  return apiFetch<Product>(`/products/${slug}`, { accessToken: null, next: { revalidate, tags: [STOREFRONT_TAG] } });
}

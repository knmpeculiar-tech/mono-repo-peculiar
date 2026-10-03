import type { Review } from "@/types/api";
import { STOREFRONT_TAG } from "@/lib/cache/storefrontTag";
import { apiFetch } from "./client";

export function listProductReviews(productId: string, revalidate?: number) {
  return apiFetch<Review[]>(`/products/${productId}/reviews`, {
    accessToken: null,
    next: { revalidate, tags: [STOREFRONT_TAG] },
  });
}

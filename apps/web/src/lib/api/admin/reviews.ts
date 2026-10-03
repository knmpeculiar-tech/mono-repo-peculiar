import type { Review } from "@/types/api";
import { apiFetch } from "@/lib/api/client";

export interface CreateReviewInput {
  productId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  isPublished?: boolean;
  imagePaths?: string[];
  videoPaths?: string[];
}
export type UpdateReviewInput = Partial<CreateReviewInput>;

export function listAdminReviews(accessToken?: string | null) {
  return apiFetch<Review[]>("/admin/reviews", { accessToken });
}

export function createReview(input: CreateReviewInput, accessToken?: string | null) {
  return apiFetch<Review>("/admin/reviews", { method: "POST", body: input, accessToken });
}

export function updateReview(id: string, input: UpdateReviewInput, accessToken?: string | null) {
  return apiFetch<Review>(`/admin/reviews/${id}`, { method: "PATCH", body: input, accessToken });
}

export function deleteReview(id: string, accessToken?: string | null) {
  return apiFetch<void>(`/admin/reviews/${id}`, { method: "DELETE", accessToken });
}

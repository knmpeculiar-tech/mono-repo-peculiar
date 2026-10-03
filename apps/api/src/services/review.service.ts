import { prisma } from "../lib/prisma";
import type { CreateReviewInput, UpdateReviewInput } from "../validators/review.validator";

export function listPublishedReviewsForProduct(productId: string) {
  return prisma.review.findMany({
    where: { productId, isPublished: true },
    orderBy: { createdAt: "desc" },
  });
}

export function listAllReviews() {
  return prisma.review.findMany({ orderBy: { createdAt: "desc" } });
}

export function createReview(input: CreateReviewInput) {
  return prisma.review.create({ data: input });
}

export function updateReview(id: string, input: UpdateReviewInput) {
  return prisma.review.update({ where: { id }, data: input });
}

export function deleteReview(id: string) {
  return prisma.review.delete({ where: { id } });
}

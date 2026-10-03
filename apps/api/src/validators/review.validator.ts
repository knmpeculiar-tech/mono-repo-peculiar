import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.string().min(1),
  authorName: z.string().trim().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  isPublished: z.boolean().default(true),
  imagePaths: z.array(z.string().min(1)).max(4).default([]),
  videoPaths: z.array(z.string().min(1)).max(2).default([]),
});

export const updateReviewSchema = createReviewSchema.partial();

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

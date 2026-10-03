import { Router } from "express";
import * as reviewController from "../controllers/review.controller";
import { validateBody } from "../middleware/validate";
import { createReviewSchema, updateReviewSchema } from "../validators/review.validator";

export const reviewRouter = Router();

reviewRouter.get("/products/:productId/reviews", reviewController.listReviewsForProduct);

// Mounted under /api/admin/reviews, behind requireAuth + requireAdmin (see routes/index.ts).
export const adminReviewRouter = Router();

adminReviewRouter.get("/", reviewController.listReviewsAdmin);
adminReviewRouter.post("/", validateBody(createReviewSchema), reviewController.createReview);
adminReviewRouter.patch("/:id", validateBody(updateReviewSchema), reviewController.updateReview);
adminReviewRouter.delete("/:id", reviewController.deleteReview);

import type { NextFunction, Request, Response } from "express";
import * as reviewService from "../services/review.service";

export async function listReviewsForProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const reviews = await reviewService.listPublishedReviewsForProduct(req.params.productId);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

export async function listReviewsAdmin(_req: Request, res: Response, next: NextFunction) {
  try {
    const reviews = await reviewService.listAllReviews();
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await reviewService.createReview(req.body);
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

export async function updateReview(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await reviewService.updateReview(req.params.id, req.body);
    res.json(review);
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req: Request, res: Response, next: NextFunction) {
  try {
    await reviewService.deleteReview(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

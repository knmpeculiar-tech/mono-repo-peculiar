import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../middleware/errorHandler";
import * as paymentService from "../services/payment.service";

export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await paymentService.verifyAndRecordCheckoutPayment(req.body);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function webhook(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.rawBody) {
      throw new HttpError(500, "Raw body capture is not configured");
    }
    await paymentService.processWebhookEvent(
      req.rawBody,
      req.header("x-razorpay-signature"),
    );
    // Razorpay only cares about the 2xx/non-2xx distinction, not the body.
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
}

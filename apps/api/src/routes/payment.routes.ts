import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import { validateBody } from "../middleware/validate";
import { verifyPaymentSchema } from "../validators/payment.validator";

export const paymentRouter = Router();

paymentRouter.post("/verify", validateBody(verifyPaymentSchema), paymentController.verifyPayment);
// Needs the *raw* request body for signature verification — see the
// express.json({ verify }) capture of req.rawBody in app.ts.
paymentRouter.post("/webhook", paymentController.webhook);

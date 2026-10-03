import crypto from "node:crypto";
import { Prisma } from "../../prisma/generated/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { HttpError } from "../middleware/errorHandler";
import {
  razorpayWebhookEventSchema,
  type VerifyPaymentInput,
} from "../validators/payment.validator";
import * as orderService from "./order.service";

function hmacHex(secret: string, payload: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function timingSafeHexEqual(a: string, b: string) {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// Client-side checkout callback: Razorpay signs `${orderId}|${paymentId}`
// with the key secret. Verifying this gives fast UI feedback; the webhook
// below is the actual source of truth in case the browser never calls back.
export function verifyCheckoutSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
) {
  const expected = hmacHex(env.RAZORPAY_KEY_SECRET, `${razorpayOrderId}|${razorpayPaymentId}`);
  return timingSafeHexEqual(expected, razorpaySignature);
}

// Razorpay signs the raw request body with the separate webhook secret.
export function verifyWebhookSignature(rawBody: Buffer, signature: string) {
  const expected = hmacHex(env.RAZORPAY_WEBHOOK_SECRET, rawBody.toString("utf8"));
  return timingSafeHexEqual(expected, signature);
}

// Claims an event via the payment_events unique constraint. Returns false
// when the event (or the same payment via the client-verify path) was
// already recorded — a retried webhook delivery or a client-callback racing
// the webhook both land here safely, never double-processed.
async function claimPaymentEvent(providerEventId: string, eventType: string, payload: unknown) {
  try {
    await prisma.paymentEvent.create({
      data: { providerEventId, eventType, payload: payload as Prisma.InputJsonValue },
    });
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return false;
    }
    throw err;
  }
}

async function markEventProcessed(providerEventId: string) {
  await prisma.paymentEvent.updateMany({
    where: { provider: "razorpay", providerEventId },
    data: { processedAt: new Date() },
  });
}

async function handlePaymentCaptured(orderId: string, providerOrderId: string, paymentId: string) {
  await prisma.payment.updateMany({
    where: { orderId, providerOrderId },
    data: { providerPaymentId: paymentId, status: "paid" },
  });
  await orderService.markOrderPaid(orderId);
}

async function handlePaymentFailed(orderId: string, providerOrderId: string, paymentId: string) {
  // The order stays 'pending' — a failed payment attempt doesn't cancel or
  // restock it, so the customer can retry checkout against the same order.
  await prisma.payment.updateMany({
    where: { orderId, providerOrderId },
    data: { providerPaymentId: paymentId, status: "failed" },
  });
}

// Client-side checkout success callback.
export async function verifyAndRecordCheckoutPayment(input: VerifyPaymentInput) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

  // PAYMENTS_MOCK orders were never signed by Razorpay in the first place
  // (see order.service.ts), so there's no real signature to check here
  // either — dev/test only, gated by the same server-side env flag.
  if (
    !env.PAYMENTS_MOCK &&
    !verifyCheckoutSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
  ) {
    throw new HttpError(400, "Invalid payment signature");
  }

  const payment = await prisma.payment.findUnique({ where: { providerOrderId: razorpayOrderId } });
  if (!payment) {
    throw new HttpError(404, "Order not found");
  }

  const eventId = `client-verify:${razorpayPaymentId}`;
  const isNewEvent = await claimPaymentEvent(eventId, "payment.captured", {
    razorpayOrderId,
    razorpayPaymentId,
  });
  if (isNewEvent) {
    await handlePaymentCaptured(payment.orderId, razorpayOrderId, razorpayPaymentId);
    await markEventProcessed(eventId);
  }

  return orderService.getOrderById(payment.orderId);
}

// Razorpay webhook. Must be verified against the *raw* request body — see
// the express.json({ verify }) capture of req.rawBody in app.ts.
export async function processWebhookEvent(rawBody: Buffer, signature: string | undefined) {
  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    throw new HttpError(400, "Invalid webhook signature");
  }

  const parsed = razorpayWebhookEventSchema.safeParse(JSON.parse(rawBody.toString("utf8")));
  if (!parsed.success) {
    // Signature was valid but the shape is something we don't recognize —
    // acknowledge rather than error, so Razorpay doesn't retry forever for
    // an event type we intentionally don't act on.
    return;
  }

  const { event, payload } = parsed.data;
  const entity = payload.payment.entity;

  const payment = await prisma.payment.findUnique({ where: { providerOrderId: entity.order_id } });
  if (!payment) {
    return;
  }

  const eventId = `${event}:${entity.id}`;
  const isNewEvent = await claimPaymentEvent(eventId, event, parsed.data);
  if (!isNewEvent) {
    return;
  }

  if (event === "payment.captured") {
    await handlePaymentCaptured(payment.orderId, entity.order_id, entity.id);
  } else if (event === "payment.failed") {
    await handlePaymentFailed(payment.orderId, entity.order_id, entity.id);
  }
  await markEventProcessed(eventId);
}

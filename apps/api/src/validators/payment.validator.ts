import { z } from "zod";

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

// Minimal structural shape we actually rely on from a Razorpay webhook body
// (the real payload has many more fields we don't need).
export const razorpayWebhookEventSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        order_id: z.string(),
        amount: z.number(),
        status: z.string(),
      }),
    }),
  }),
});

export type RazorpayWebhookEvent = z.infer<typeof razorpayWebhookEventSchema>;

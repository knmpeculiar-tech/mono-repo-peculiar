import type { Order } from "@/types/api";
import { apiFetch } from "./client";

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export function verifyPayment(input: VerifyPaymentInput) {
  return apiFetch<Order>("/payments/verify", {
    method: "POST",
    body: input,
    accessToken: null,
  });
}

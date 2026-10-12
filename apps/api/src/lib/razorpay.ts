import Razorpay from "razorpay";
import { paymentConfig } from "../config/env";

// Created on first use rather than at import: in PAYMENTS_MOCK mode there are
// no keys, and the SDK's constructor throws without one.
let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!paymentConfig.keyId || !paymentConfig.keySecret) {
    throw new Error("Razorpay is not configured (PAYMENTS_MOCK is on or keys are missing)");
  }
  client ??= new Razorpay({ key_id: paymentConfig.keyId, key_secret: paymentConfig.keySecret });
  return client;
}

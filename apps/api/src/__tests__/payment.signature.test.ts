import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyCheckoutSignature, verifyWebhookSignature } from "../services/payment.service";

// Matches vitest.config.ts's test env.
const KEY_SECRET = "dummy_key_secret";
const WEBHOOK_SECRET = "dummy_webhook_secret";

describe("verifyCheckoutSignature", () => {
  it("accepts a correctly signed order/payment pair", () => {
    const orderId = "order_123";
    const paymentId = "pay_456";
    const signature = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(verifyCheckoutSignature(orderId, paymentId, signature)).toBe(true);
  });

  it("rejects a tampered signature", () => {
    expect(verifyCheckoutSignature("order_123", "pay_456", "0".repeat(64))).toBe(false);
  });

  it("rejects a signature for a different payment id", () => {
    const signature = crypto
      .createHmac("sha256", KEY_SECRET)
      .update("order_123|pay_456")
      .digest("hex");

    expect(verifyCheckoutSignature("order_123", "pay_999", signature)).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  it("accepts a body signed with the webhook secret", () => {
    const body = Buffer.from(JSON.stringify({ event: "payment.captured" }));
    const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");

    expect(verifyWebhookSignature(body, signature)).toBe(true);
  });

  it("rejects a body signed with the wrong secret", () => {
    const body = Buffer.from(JSON.stringify({ event: "payment.captured" }));
    const wrongSignature = crypto.createHmac("sha256", "wrong-secret").update(body).digest("hex");

    expect(verifyWebhookSignature(body, wrongSignature)).toBe(false);
  });

  it("rejects a body that was tampered with after signing", () => {
    const original = Buffer.from(JSON.stringify({ event: "payment.captured", amount: 100 }));
    const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(original).digest("hex");
    const tampered = Buffer.from(JSON.stringify({ event: "payment.captured", amount: 999999 }));

    expect(verifyWebhookSignature(tampered, signature)).toBe(false);
  });
});

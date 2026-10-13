import { afterEach, describe, expect, it, vi } from "vitest";
import { openRazorpayCheckout, paymentFailureMessage, type RazorpayFailureResponse } from "./razorpay";

// A stand-in for Razorpay's checkout.js: records the order of calls and lets
// the test fire the payment.failed event the real widget would emit.
function installFakeRazorpay() {
  const calls: string[] = [];
  let failedHandler: ((r: RazorpayFailureResponse) => void) | undefined;
  window.Razorpay = class {
    on(event: string, handler: (r: RazorpayFailureResponse) => void) {
      calls.push(`on:${event}`);
      failedHandler = handler;
    }
    open() {
      calls.push("open");
    }
  } as unknown as typeof window.Razorpay;
  return { calls, fail: (r: RazorpayFailureResponse) => failedHandler?.(r) };
}

const params = {
  keyId: "rzp_test_x",
  providerOrderId: "order_1",
  amountInPaise: 22500,
  customerName: "A",
  customerPhone: "9999999999",
  onSuccess: () => {},
};

describe("openRazorpayCheckout", () => {
  afterEach(() => {
    delete window.Razorpay;
  });

  it("listens for payment.failed before opening, so no failure is missed", async () => {
    const fake = installFakeRazorpay();
    await openRazorpayCheckout(params);
    expect(fake.calls).toEqual(["on:payment.failed", "open"]);
  });

  it("passes Razorpay's reason to onFailure", async () => {
    const fake = installFakeRazorpay();
    const onFailure = vi.fn();
    await openRazorpayCheckout({ ...params, onFailure });
    fake.fail({ error: { description: "Card declined by bank" } });
    expect(onFailure).toHaveBeenCalledWith("Card declined by bank");
  });
});

describe("paymentFailureMessage", () => {
  it("falls back to a generic message when Razorpay gives no description", () => {
    expect(paymentFailureMessage({})).toBe("The payment didn't go through");
    expect(paymentFailureMessage({ error: { description: "  " } })).toBe("The payment didn't go through");
  });
});

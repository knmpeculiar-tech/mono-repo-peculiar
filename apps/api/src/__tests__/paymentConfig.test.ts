import { describe, expect, it } from "vitest";
import { resolvePaymentConfig } from "../config/env";

type Raw = Parameters<typeof resolvePaymentConfig>[0];

const base: Raw = {
  NODE_ENV: "development",
  PORT: 4000,
  DATABASE_URL: "postgresql://x",
  SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_SECRET_KEY: "s",
  SUPABASE_JWKS_URL: "https://x.supabase.co/jwks",
  RAZORPAY_MODE: "test",
  RAZORPAY_TEST_KEY_ID: "rzp_test_abc",
  RAZORPAY_TEST_KEY_SECRET: "test_secret",
  RAZORPAY_TEST_WEBHOOK_SECRET: "test_whsec",
  RAZORPAY_LIVE_KEY_ID: "rzp_live_xyz",
  RAZORPAY_LIVE_KEY_SECRET: "live_secret",
  RAZORPAY_LIVE_WEBHOOK_SECRET: "live_whsec",
  PAYMENTS_MOCK: false,
  KEEP_ALIVE_HOURS: 24,
};

describe("resolvePaymentConfig", () => {
  it("uses the test key set in test mode", () => {
    expect(resolvePaymentConfig(base)).toEqual({
      mode: "test",
      mock: false,
      keyId: "rzp_test_abc",
      keySecret: "test_secret",
      webhookSecret: "test_whsec",
    });
  });

  it("switches to the live key set with one variable", () => {
    const config = resolvePaymentConfig({ ...base, RAZORPAY_MODE: "live" });
    expect(config).toMatchObject({ mode: "live", keyId: "rzp_live_xyz", keySecret: "live_secret" });
  });

  it("rejects a live key pasted into the test slot (and vice versa)", () => {
    expect(() => resolvePaymentConfig({ ...base, RAZORPAY_TEST_KEY_ID: "rzp_live_oops" })).toThrow(
      /should start with "rzp_test_"/,
    );
    expect(() =>
      resolvePaymentConfig({ ...base, RAZORPAY_MODE: "live", RAZORPAY_LIVE_KEY_ID: "rzp_test_oops" }),
    ).toThrow(/should start with "rzp_live_"/);
  });

  it("requires the active mode's keys", () => {
    expect(() =>
      resolvePaymentConfig({ ...base, RAZORPAY_MODE: "live", RAZORPAY_LIVE_KEY_SECRET: " " }),
    ).toThrow(/RAZORPAY_LIVE_KEY_ID and RAZORPAY_LIVE_KEY_SECRET/);
  });

  it("treats a missing webhook secret as 'not configured' rather than an error", () => {
    expect(resolvePaymentConfig({ ...base, RAZORPAY_TEST_WEBHOOK_SECRET: undefined }).webhookSecret).toBeNull();
  });

  it("allows mock payments in development with no keys at all", () => {
    const config = resolvePaymentConfig({
      ...base,
      PAYMENTS_MOCK: true,
      RAZORPAY_TEST_KEY_ID: undefined,
      RAZORPAY_TEST_KEY_SECRET: undefined,
    });
    expect(config).toMatchObject({ mock: true, keyId: null, keySecret: null });
  });

  it("refuses mock payments in production and in live mode", () => {
    expect(() => resolvePaymentConfig({ ...base, PAYMENTS_MOCK: true, NODE_ENV: "production" })).toThrow(
      /not allowed in production/,
    );
    expect(() => resolvePaymentConfig({ ...base, PAYMENTS_MOCK: true, RAZORPAY_MODE: "live" })).toThrow(
      /can't be combined with RAZORPAY_MODE=live/,
    );
  });
});

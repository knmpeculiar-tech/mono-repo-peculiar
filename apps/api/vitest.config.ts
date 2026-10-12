import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Dummy values so config/env.ts's zod validation passes at import time.
    // No test exercises a real Supabase/Razorpay/Postgres call — those paths
    // are unit-tested by mocking the relevant module, not by hitting a
    // live service.
    env: {
      DATABASE_URL: "postgresql://user:password@localhost:5432/test",
      DIRECT_URL: "postgresql://user:password@localhost:5432/test",
      SUPABASE_URL: "https://test-project.supabase.co",
      SUPABASE_SECRET_KEY: "sb_secret_test_dummy",
      SUPABASE_JWKS_URL: "https://test-project.supabase.co/auth/v1/.well-known/jwks.json",
      // Pinned explicitly: the generated Prisma client auto-loads apps/api/.env
      // on import and fills in anything *not* set here — a developer's local
      // PAYMENTS_MOCK=true would otherwise silently leak into the tests.
      PAYMENTS_MOCK: "false",
      RAZORPAY_MODE: "test",
      RAZORPAY_TEST_KEY_ID: "rzp_test_dummy",
      RAZORPAY_TEST_KEY_SECRET: "dummy_key_secret",
      RAZORPAY_TEST_WEBHOOK_SECRET: "dummy_webhook_secret",
    },
  },
});

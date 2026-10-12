import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// Resolved relative to this file, not cwd, so apps/api/.env (see
// apps/api/.env.example) loads the same way from `pnpm dev:api`, `node
// dist/index.js`, or scripts/. The Prisma CLI reads the same file on its own.
// Not under tests: they must see only vitest.config.ts's dummy values, never
// a developer's real .env (real database URL, PAYMENTS_MOCK, keys).
if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  // Server-side only: bypasses RLS. Never expose to the frontend (that gets
  // SUPABASE_PUBLISHABLE_KEY instead).
  SUPABASE_SECRET_KEY: z.string().min(1, "SUPABASE_SECRET_KEY is required"),
  // JWKS endpoint for local, no-network-round-trip JWT verification (via
  // @supabase/server) — required for the 'user' auth mode.
  SUPABASE_JWKS_URL: z.string().url("SUPABASE_JWKS_URL must be a valid URL"),

  // Both key sets can live in the env at once; RAZORPAY_MODE picks which one
  // is used, so switching test <-> live is a one-word change. See
  // resolvePaymentConfig below and docs/decisions.md.
  RAZORPAY_MODE: z.enum(["test", "live"]).default("test"),
  RAZORPAY_TEST_KEY_ID: z.string().optional(),
  RAZORPAY_TEST_KEY_SECRET: z.string().optional(),
  RAZORPAY_TEST_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_LIVE_KEY_ID: z.string().optional(),
  RAZORPAY_LIVE_KEY_SECRET: z.string().optional(),
  RAZORPAY_LIVE_WEBHOOK_SECRET: z.string().optional(),
  // Dev only: skips Razorpay entirely (fake order ids, no signature check) so
  // checkout works without keys. Refused in production and in live mode —
  // anyone could "pay" with a made-up signature.
  PAYMENTS_MOCK: z.string().optional().default("false").transform((value) => value === "true"),
  // How often the API pings Supabase so the free-plan project isn't paused for
  // inactivity (see jobs/keepAlive.ts). 0 turns it off, e.g. once real traffic
  // keeps the project busy on its own.
  KEEP_ALIVE_HOURS: z.coerce.number().min(0).default(24),
});

export interface PaymentConfig {
  mode: "test" | "live";
  mock: boolean;
  /** Public key id sent to the browser for the checkout widget. Null in mock mode. */
  keyId: string | null;
  keySecret: string | null;
  /** Null until a webhook is created in the Razorpay dashboard; webhooks are then rejected. */
  webhookSecret: string | null;
}

const blank = (value: string | undefined) => (value && value.trim() !== "" ? value.trim() : null);

// Pure so it can be unit-tested; throws a readable error for any unsafe or
// inconsistent combination, so a misconfigured deploy fails at startup rather
// than mid-checkout.
export function resolvePaymentConfig(raw: z.infer<typeof envSchema>): PaymentConfig {
  const mode = raw.RAZORPAY_MODE;
  const prefix = mode === "test" ? "RAZORPAY_TEST" : "RAZORPAY_LIVE";
  const keyId = blank(mode === "test" ? raw.RAZORPAY_TEST_KEY_ID : raw.RAZORPAY_LIVE_KEY_ID);
  const keySecret = blank(mode === "test" ? raw.RAZORPAY_TEST_KEY_SECRET : raw.RAZORPAY_LIVE_KEY_SECRET);
  const webhookSecret = blank(
    mode === "test" ? raw.RAZORPAY_TEST_WEBHOOK_SECRET : raw.RAZORPAY_LIVE_WEBHOOK_SECRET,
  );

  if (raw.PAYMENTS_MOCK) {
    if (raw.NODE_ENV === "production") {
      throw new Error("PAYMENTS_MOCK=true is not allowed in production (it accepts fake payments).");
    }
    if (mode === "live") {
      throw new Error("PAYMENTS_MOCK=true can't be combined with RAZORPAY_MODE=live.");
    }
    return { mode, mock: true, keyId: null, keySecret: null, webhookSecret };
  }

  if (!keyId || !keySecret) {
    throw new Error(`RAZORPAY_MODE=${mode} needs ${prefix}_KEY_ID and ${prefix}_KEY_SECRET.`);
  }
  if (!keyId.startsWith(`rzp_${mode}_`)) {
    throw new Error(
      `${prefix}_KEY_ID should start with "rzp_${mode}_" — a ${mode === "test" ? "live" : "test"} key may have been pasted into the ${mode} slot.`,
    );
  }
  return { mode, mock: false, keyId, keySecret, webhookSecret };
}

export const env = envSchema.parse(process.env);
export const paymentConfig = resolvePaymentConfig(env);

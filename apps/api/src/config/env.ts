import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// Resolved relative to this file, not cwd, so apps/api/.env (see
// apps/api/.env.example) loads the same way from `pnpm dev:api`, `node
// dist/index.js`, or scripts/. The Prisma CLI reads the same file on its own.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

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

  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, "RAZORPAY_WEBHOOK_SECRET is required"),
  // Dev/test only — skips real Razorpay API calls and signature verification
  // so checkout can be exercised end-to-end without a real Razorpay account.
  // Must never be "true" in production; see docs/decisions.md.
  PAYMENTS_MOCK: z.string().optional().default("false").transform((value) => value === "true"),
});

export const env = envSchema.parse(process.env);

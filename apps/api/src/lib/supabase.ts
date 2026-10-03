import { createAdminClient } from "@supabase/server/core";
import { env } from "../config/env";

// Ensures the required config exists before this module is used, even
// though createAdminClient() also reads process.env itself internally —
// fail fast at import time, not on the first request.
void env.SUPABASE_URL;
void env.SUPABASE_SECRET_KEY;

// Admin client: server-side only, bypasses RLS. Used for privileged
// operations (e.g. Storage access for product/blog images later). Never
// send this key to the frontend.
export const supabaseAdmin = createAdminClient();

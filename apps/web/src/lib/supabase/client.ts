import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client for Client Components — cookie-based session,
// shared with the server via @supabase/ssr so proxy.ts and Server Components
// see the same session without a client-side round trip.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

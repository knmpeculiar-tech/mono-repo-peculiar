import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Component / Server Action client — reads the session from cookies.
// Writing cookies from a Server Component throws (Next.js only allows that
// from a Route Handler or Server Action); proxy.ts is what actually refreshes
// the session cookie on each request, so that failure is safe to ignore here.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options ?? {}),
            );
          } catch {
            // Called from a Server Component — expected, see comment above.
          }
        },
      },
    },
  );
}

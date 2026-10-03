import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renamed middleware.ts -> proxy.ts (same request/response model).
// Refreshes the Supabase session cookie on every matched request and gates
// /account/**, /admin/**, and /checkout behind having a session at all — the
// authoritative role check (customer vs admin) happens server-side per-request
// via the API, not here. Checkout requires sign-in (guest checkout was
// removed — every order needs a real account so order history always works;
// see docs/decisions.md).
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const requiresSession =
    request.nextUrl.pathname.startsWith("/account") ||
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/checkout");

  if (requiresSession && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image optimization
     * files, so the session cookie stays fresh across the whole app.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

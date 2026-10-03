import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/authHelpers";
import { createClient } from "@/lib/supabase/server";

const RESET_PASSWORD_PATH = "/reset-password";

// Every auth email (signup confirmation, password reset) links here. Supabase
// first verifies the email token on its own domain, then redirects here with
// either a PKCE `code` (default template) or a `token_hash` (custom template
// pointing straight at this route). Either way, this swaps it for a session
// cookie and forwards to `next`.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const isPasswordReset = next === RESET_PASSWORD_PATH;
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));

  // Supabase rejected the link itself (expired, already used, tampered).
  if (searchParams.get("error")) {
    return redirectTo(
      isPasswordReset ? "/forgot-password?notice=link_expired" : "/login?notice=link_expired",
    );
  }

  const supabase = await createClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectTo(next);
    }
    // A `code` only exists once Supabase has already verified the email, so
    // a failed exchange almost always means the link was opened in a
    // different browser than the one that signed up (the PKCE verifier
    // cookie lives in the original one). The address *is* confirmed — the
    // user just needs to sign in. A reset link has no such fallback: it must
    // be re-requested.
    return redirectTo(
      isPasswordReset ? "/forgot-password?notice=other_device" : "/login?notice=email_confirmed",
    );
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return redirectTo(next);
    }
  }

  return redirectTo(
    isPasswordReset ? "/forgot-password?notice=link_expired" : "/login?notice=link_expired",
  );
}

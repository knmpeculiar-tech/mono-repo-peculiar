import type { AuthError } from "@supabase/supabase-js";

/**
 * Only same-origin relative paths are honoured for post-auth redirects.
 * `?next=` is attacker-controllable (anyone can send a crafted /login link),
 * so "//evil.com" or "https://evil.com" must never be followed.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}

// Supabase's raw messages ("Invalid login credentials", "For security
// purposes, you can only request this after 47 seconds") are inconsistent and
// sometimes leak internals; map the codes customers will actually hit.
const MESSAGES: Record<string, string> = {
  invalid_credentials: "That email and password don't match. Check them and try again.",
  email_not_confirmed: "Please confirm your email first — check your inbox for the link.",
  user_already_exists: "An account with this email already exists. Sign in instead.",
  email_exists: "An account with this email already exists. Sign in instead.",
  weak_password: "Choose a stronger password — at least 8 characters.",
  same_password: "Your new password must be different from your current one.",
  email_address_invalid: "Enter a valid email address.",
  over_email_send_rate_limit: "Too many emails sent. Please wait a few minutes and try again.",
  over_request_rate_limit: "Too many attempts. Please wait a few minutes and try again.",
  signup_disabled: "Sign-ups are currently closed.",
};

export function authErrorMessage(error: Pick<AuthError, "code" | "message" | "status">): string {
  if (error.code && MESSAGES[error.code]) {
    return MESSAGES[error.code];
  }
  if (error.status === 429) {
    return MESSAGES.over_request_rate_limit;
  }
  return "Something went wrong. Please try again.";
}

export const MIN_PASSWORD_LENGTH = 8;

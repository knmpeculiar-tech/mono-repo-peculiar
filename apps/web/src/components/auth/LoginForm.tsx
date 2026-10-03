"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { safeNextPath } from "@/lib/auth/authHelpers";
import { useAuth } from "@/lib/auth/AuthProvider";

// Keyed so the page only ever renders our own copy — the query string is
// user-controllable and must not be echoed back as text.
const NOTICES: Record<string, { tone: "success" | "error"; text: string }> = {
  email_confirmed: { tone: "success", text: "Your email is confirmed. Sign in to continue." },
  link_expired: {
    tone: "error",
    text: "That link has expired or was already used. Sign in, or sign up again to get a new one.",
  },
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const notice = NOTICES[searchParams.get("notice") ?? ""];
  const { signIn, resendConfirmation } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNeedsConfirmation(false);
    setIsSubmitting(true);
    const result = await signIn(email.trim(), password);
    if (result.error) {
      setIsSubmitting(false);
      setError(result.error);
      setNeedsConfirmation(result.errorCode === "email_not_confirmed");
      return;
    }
    // refresh() so Server Components (header, /account) re-read the new
    // session cookie instead of rendering the cached signed-out tree.
    router.replace(next);
    router.refresh();
  }

  async function handleResend() {
    setResendState("sending");
    const result = await resendConfirmation(email.trim(), next);
    if (result.error) {
      setResendState("idle");
      setError(result.error);
      return;
    }
    setResendState("sent");
  }

  const signupHref = next === "/" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {notice ? <AuthNotice tone={notice.tone}>{notice.text}</AuthNotice> : null}
      <label className="flex flex-col gap-1">
        <span className="text-caption">Email</span>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-caption">Password</span>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <Link
        href="/forgot-password"
        className="text-caption text-brand -mt-2 self-end hover:underline"
      >
        Forgot password?
      </Link>
      {error ? (
        <div role="alert" className="flex flex-col gap-2">
          <p className="text-danger text-sm">{error}</p>
          {needsConfirmation ? (
            resendState === "sent" ? (
              <p className="text-caption">New confirmation link sent to {email.trim()}.</p>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleResend}
                disabled={resendState === "sending"}
              >
                {resendState === "sending" ? "Sending…" : "Resend confirmation email"}
              </Button>
            )
          ) : null}
        </div>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-caption">
        Don&apos;t have an account?{" "}
        <Link href={signupHref} className="text-brand hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}

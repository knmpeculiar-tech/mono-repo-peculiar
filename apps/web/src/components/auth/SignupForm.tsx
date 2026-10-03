"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { MIN_PASSWORD_LENGTH, safeNextPath } from "@/lib/auth/authHelpers";
import { useAuth } from "@/lib/auth/AuthProvider";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const { signUp, resendConfirmation } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [resendError, setResendError] = useState<string | null>(null);

  const loginHref = next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setErrorCode(undefined);
    setIsSubmitting(true);
    const result = await signUp(email.trim(), password, next);
    if (result.error) {
      setIsSubmitting(false);
      setError(result.error);
      setErrorCode(result.errorCode);
      return;
    }
    if (result.needsEmailConfirmation) {
      setIsSubmitting(false);
      setNeedsEmailConfirmation(true);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function handleResend() {
    setResendError(null);
    setResendState("sending");
    const result = await resendConfirmation(email.trim(), next);
    if (result.error) {
      setResendState("idle");
      setResendError(result.error);
      return;
    }
    setResendState("sent");
  }

  if (needsEmailConfirmation) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-body font-medium">Check your email</p>
          <p className="text-caption">
            We sent a confirmation link to <strong>{email.trim()}</strong>. Click it to finish
            creating your account — it can take a minute to arrive, and may land in spam.
          </p>
        </div>
        {resendState === "sent" ? (
          <AuthNotice tone="success">A new link is on its way.</AuthNotice>
        ) : null}
        {resendError ? <AuthNotice tone="error">{resendError}</AuthNotice> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleResend}
            disabled={resendState === "sending"}
          >
            {resendState === "sending" ? "Sending…" : "Resend email"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setNeedsEmailConfirmation(false);
              setResendState("idle");
              setResendError(null);
            }}
          >
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          aria-describedby="password-hint"
          required
        />
        <span id="password-hint" className="text-caption">
          At least {MIN_PASSWORD_LENGTH} characters.
        </span>
      </label>
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}{" "}
          {errorCode === "user_already_exists" ? (
            <>
              <Link href={loginHref} className="text-brand underline">
                Sign in
              </Link>{" "}
              or{" "}
              <Link href="/forgot-password" className="text-brand underline">
                reset your password
              </Link>
              .
            </>
          ) : null}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Sign up"}
      </Button>
      <p className="text-caption">
        Already have an account?{" "}
        <Link href={loginHref} className="text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

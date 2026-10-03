"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { useAuth } from "@/lib/auth/AuthProvider";

const NOTICES: Record<string, string> = {
  link_expired: "That reset link has expired or was already used. Request a new one below.",
  other_device:
    "Reset links only work in the browser you requested them from. Request a new one here.",
};

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const notice = NOTICES[searchParams.get("notice") ?? ""];
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await requestPasswordReset(email.trim());
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    // Worded the same whether or not the address has an account — Supabase
    // doesn't reveal that, and neither should we.
    return (
      <div className="flex flex-col gap-2">
        <p className="text-body font-medium">Check your email</p>
        <p className="text-caption">
          If an account exists for <strong>{email.trim()}</strong>, we&apos;ve sent a link to reset
          your password. Open it in this browser.
        </p>
        <Link href="/login" className="text-caption text-brand hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {notice ? <AuthNotice tone="error">{notice}</AuthNotice> : null}
      <p className="text-caption">
        Enter the email you signed up with and we&apos;ll send you a link to choose a new password.
      </p>
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
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
      <Link href="/login" className="text-caption text-brand hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}

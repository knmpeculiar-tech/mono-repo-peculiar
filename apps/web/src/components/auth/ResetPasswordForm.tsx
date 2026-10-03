"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/authHelpers";
import { useAuth } from "@/lib/auth/AuthProvider";

// Reached from the reset email via /auth/callback, which has already turned
// the link into a (recovery) session — updateUser() needs that session.
export function ResetPasswordForm() {
  const { session, isLoading, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setIsSubmitting(true);
    const result = await updatePassword(password);
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-body">Your password has been updated and you&apos;re signed in.</p>
        <Link href="/" className={buttonClassName()}>
          Continue shopping
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-body">
          This page needs a valid reset link. It may have expired, or been opened in a different
          browser.
        </p>
        <Link href="/forgot-password" className={buttonClassName()}>
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-caption">
        Setting a new password for <strong>{session.user.email}</strong>.
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-caption">New password</span>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-caption">Confirm new password</span>
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </label>
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}

"use client";

import type { ReactNode } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useIsFormPending } from "./AdminFeedback";

// Header Save button for a form rendered elsewhere on the page (form="…").
// Shows progress and blocks double-submits while that form reports pending.
export function SaveButton({
  form,
  children,
  pendingLabel = "Saving…",
}: {
  form: string;
  children: ReactNode;
  pendingLabel?: string;
}) {
  const pending = useIsFormPending(form);
  return (
    <button
      type="submit"
      form={form}
      disabled={pending}
      aria-busy={pending}
      className={buttonClassName({ className: "min-w-32" })}
    >
      {pending ? (
        <>
          <Spinner />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

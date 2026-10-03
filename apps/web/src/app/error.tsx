"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

// Next.js 16: the callback prop is `retry`, not the classic `reset`.
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <ErrorState
        title="Something went wrong"
        description="Please try again — if this keeps happening, let us know."
        onRetry={retry}
      />
    </div>
  );
}

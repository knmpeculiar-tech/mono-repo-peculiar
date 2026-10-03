"use client";

import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessage, useToast } from "./AdminFeedback";

// Confirmation for destructive actions. Owns the in-flight state: the confirm
// button shows progress, the dialog can't be dismissed mid-request, a failure
// stays inside the dialog (so the admin sees why), and success closes it with
// a toast.
export function ConfirmDialog({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  pendingLabel,
  successMessage,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  successMessage: string;
  onConfirm: () => Promise<void>;
}) {
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (pending) return;
    setError(null);
    onClose();
  }

  async function handleConfirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      setPending(false);
      onClose();
      toast.success(successMessage);
    } catch (err) {
      setPending(false);
      setError(errorMessage(err, "That didn't work. Please try again."));
    }
  }

  return (
    <Modal open={open} onClose={close} title={title} dismissible={!pending}>
      <div className="text-body text-muted-foreground mb-5">{children}</div>
      {error ? (
        <p role="alert" className="text-danger mb-4 text-sm">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={close} disabled={pending}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={pending} aria-busy={pending}>
          {pending ? (
            <>
              <Spinner />
              {pendingLabel}
            </>
          ) : (
            confirmLabel
          )}
        </Button>
      </div>
    </Modal>
  );
}

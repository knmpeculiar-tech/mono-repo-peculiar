"use client";

import { type ReactNode, useEffect, useRef } from "react";

// Native <dialog> — free focus trap, Esc handling, and backdrop, no
// dependency. Used only for short confirmations (delete a variant/image/etc),
// not full forms.
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 text-foreground backdrop:bg-foreground/40"
    >
      <h2 className="text-heading-3 mb-3">{title}</h2>
      {children}
    </dialog>
  );
}

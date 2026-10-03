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
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** False while an action is running, so Esc can't close mid-request. */
  dismissible?: boolean;
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
      onCancel={(event) => {
        if (!dismissible) event.preventDefault();
      }}
      // m-auto: the browser centers a modal <dialog> with `margin: auto`, which
      // Tailwind's preflight resets to 0 — without it the dialog pins to the
      // top-left corner.
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-surface p-6 text-foreground shadow-[0_12px_40px_-8px_rgb(32_26_28/0.35)] backdrop:bg-foreground/45 motion-safe:animate-[dialog-in_180ms_cubic-bezier(0.16,1,0.3,1)]"
    >
      <h2 className="text-heading-3 mb-3">{title}</h2>
      {children}
    </dialog>
  );
}

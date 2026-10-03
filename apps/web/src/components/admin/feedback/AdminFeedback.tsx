"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { ApiError } from "@/lib/api/client";

type ToastKind = "success" | "error";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface FeedbackContextValue {
  notify: (kind: ToastKind, message: string) => void;
  pendingForms: ReadonlySet<string>;
  setFormPending: (formId: string, pending: boolean) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const SUCCESS_MS = 3500;
const MAX_TOASTS = 3;

// Admin-wide feedback: corner toasts for "it worked / it didn't", plus which
// forms are mid-save so a header Save button (rendered far from its form, via
// form="…") can show progress. Mounted once in AdminShell.
export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingForms, setPendingForms] = useState<ReadonlySet<string>>(new Set());
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++nextId.current;
      setToasts((current) => [...current, { id, kind, message }].slice(-MAX_TOASTS));
      // Errors stay until dismissed — they're the ones the admin must not miss.
      if (kind === "success") setTimeout(() => dismiss(id), SUCCESS_MS);
    },
    [dismiss],
  );

  const setFormPending = useCallback((formId: string, pending: boolean) => {
    setPendingForms((current) => {
      const next = new Set(current);
      if (pending) next.add(formId);
      else next.delete(formId);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ notify, pendingForms, setFormPending }),
    [notify, pendingForms, setFormPending],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.kind === "error" ? "alert" : "status"}
            className="bg-surface text-foreground pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 shadow-[0_10px_30px_-6px_rgb(32_26_28/0.3)] motion-safe:animate-[toast-in_220ms_cubic-bezier(0.16,1,0.3,1)]"
          >
            {toast.kind === "success" ? <SuccessIcon /> : <ErrorIcon />}
            <p className="flex-1 text-sm leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="text-muted-foreground hover:text-foreground -my-1 -mr-1 rounded p-1"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("Admin feedback hooks must be used inside AdminFeedbackProvider");
  return ctx;
}

export function useToast() {
  const { notify } = useFeedback();
  return useMemo(
    () => ({
      success: (message: string) => notify("success", message),
      error: (message: string) => notify("error", message),
    }),
    [notify],
  );
}

/** For a form whose Save button lives elsewhere (form="…"): report saving state. */
export function useFormPending(formId: string) {
  const { setFormPending } = useFeedback();
  return useCallback((pending: boolean) => setFormPending(formId, pending), [formId, setFormPending]);
}

export function useIsFormPending(formId: string) {
  return useFeedback().pendingForms.has(formId);
}

/** The API's own message when it sent one (they're written for humans), else a fallback. */
export function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

function SuccessIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="text-success mt-0.5 h-5 w-5 shrink-0">
      <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 10.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="text-danger mt-0.5 h-5 w-5 shrink-0">
      <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="10" cy="13.6" r="1" fill="currentColor" />
    </svg>
  );
}

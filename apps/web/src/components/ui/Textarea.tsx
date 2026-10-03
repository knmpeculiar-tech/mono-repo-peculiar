import { type TextareaHTMLAttributes, forwardRef } from "react";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-brand focus:outline-none focus:ring-2 ${className}`}
        {...props}
      />
    );
  },
);

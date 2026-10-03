import { type InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-brand focus:outline-none focus:ring-2 ${className}`}
        {...props}
      />
    );
  },
);

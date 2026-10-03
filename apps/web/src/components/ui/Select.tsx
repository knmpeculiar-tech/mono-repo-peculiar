import { type SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={`w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:ring-brand focus:outline-none focus:ring-2 ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  },
);

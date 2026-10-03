import { type ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-foreground hover:bg-brand-800 disabled:bg-brand-200",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-surface-muted disabled:opacity-60",
  ghost: "bg-transparent text-foreground hover:bg-surface-muted disabled:opacity-60",
  // Destructive confirmations only (delete/remove) — never a page's main action.
  danger: "bg-danger text-danger-foreground hover:bg-danger/90 disabled:opacity-60",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
};

// Exposed separately from the Button component so a Link that should *look*
// like a button can use the same classes directly, instead of illegally
// nesting a <button> inside an <a> (or vice versa).
export function buttonClassName({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return `inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", ...props },
  ref,
) {
  return (
    <button ref={ref} className={buttonClassName({ variant, size, className })} {...props} />
  );
});

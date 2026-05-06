import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-csp-blue text-csp-white hover:bg-csp-primary focus-visible:ring-csp-blue",
  secondary:
    "border border-csp-primary text-csp-primary hover:bg-csp-soft focus-visible:ring-csp-primary",
  ghost:
    "text-csp-primary hover:bg-csp-soft focus-visible:ring-csp-primary border border-transparent",
  danger:
    "bg-csp-error text-csp-white hover:opacity-90 focus-visible:ring-csp-error",
};

export function Button({
  children,
  className,
  variant = "primary",
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Procesando..." : children}
    </button>
  );
}

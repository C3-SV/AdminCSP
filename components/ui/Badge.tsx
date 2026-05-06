import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "outline";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-csp-primary text-csp-white",
  accent: "bg-csp-accent text-csp-white",
  success: "bg-csp-accent/15 text-csp-accent",
  warning: "bg-csp-warning/15 text-csp-warning",
  error: "bg-csp-error/15 text-csp-error",
  outline: "border border-csp-neutral text-csp-black bg-csp-white",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

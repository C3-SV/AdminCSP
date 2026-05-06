import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastProps = {
  message: string;
  variant?: ToastVariant;
};

const variantClasses: Record<ToastVariant, string> = {
  success: "border-csp-accent/30 bg-csp-accent/10 text-csp-accent",
  error: "border-csp-error/30 bg-csp-error/10 text-csp-error",
  info: "border-csp-blue/30 bg-csp-blue/10 text-csp-blue",
};

export function Toast({ message, variant = "info" }: ToastProps) {
  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 rounded-md border px-4 py-3 text-sm font-medium shadow-csp",
        variantClasses[variant],
      )}
      role="status"
    >
      {message}
    </div>
  );
}

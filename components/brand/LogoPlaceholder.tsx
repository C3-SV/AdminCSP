import { cn } from "@/lib/utils";

type LogoPlaceholderProps = {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
};

const sizeClasses = {
  sm: "h-10 w-10 text-[10px]",
  md: "h-14 w-14 text-xs",
  lg: "h-20 w-20 text-sm",
};

const variantClasses = {
  light: "bg-csp-white text-csp-primary border-csp-primary/30",
  dark: "bg-csp-primary text-csp-white border-csp-primary",
};

export function LogoPlaceholder({
  size = "md",
  variant = "light",
}: LogoPlaceholderProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-md border font-display font-bold",
        sizeClasses[size],
        variantClasses[variant],
      )}
      aria-label="Logo CSP"
    >
      LOGO CSP
    </div>
  );
}

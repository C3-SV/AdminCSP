import { HTMLAttributes } from "react";
import { cn } from "@/utils/admin";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-csp-white p-6 shadow-csp border border-csp-soft",
        className,
      )}
      {...props}
    />
  );
}
